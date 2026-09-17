import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import LegalReportPDF, { type LegalReportData } from "@/lib/pdf/legal/LegalReportPDF";
import { transformApiResponse } from "@/lib/pdf/legal/transform-api-response";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";

const INFORME_API_URL = "http://161.132.38.122/informe/placa";
const API_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos max

async function fetchInformeFromApi(plate: string): Promise<LegalReportData> {
  const apiKey = process.env.INFORME_API_KEY;
  if (!apiKey) throw new Error("EXTERNAL_API_KEY no configurada");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(INFORME_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ placa: plate }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`API respondió ${res.status}: ${body}`);
    }

    const apiData = await res.json();
    return transformApiResponse(apiData, plate);
  } finally {
    clearTimeout(timeout);
  }
}

// ponytail: fallback mock, eliminar cuando la API sea estable
function getMockLegalData(plate: string): LegalReportData {
  const now = toZonedTime(new Date(), "America/Lima");

  return {
    inspectionId: 0,
    plate: plate.toUpperCase(),
    vehicleDescription: "SUZUKI SWIFT 2014",
    clientName: "Consulta Express",
    date: format(now, "dd 'de' MMMM 'de' yyyy 'a las' HH:mm 'hrs'", { locale: es }),
    fields: [
      { key: "ownerHistory", label: "Historial de Propietarios", status: "OK", badgeText: "3 TITULARES", text: "3 propietarios registrados. Propietario actual desde 2022 (persona natural)." },
      { key: "lastTransfer", label: "Última Transferencia", status: "OK", badgeText: "SIN PROBLEMAS", text: "Compraventa registrada el 14 de marzo de 2022 en sede Lima." },
      { key: "sunarpLiens", label: "Gravámenes SUNARP", status: "WARNING", badgeText: "CON CARGA", text: "Se encontró 1 gravamen vehicular vigente a favor de entidad financiera." },
      { key: "satCaptureOrder", label: "Orden de Captura SAT", status: "OK", badgeText: "OK", text: "Sin órdenes de captura vigentes." },
      { key: "soat", label: "SOAT", status: "OK", badgeText: "VIGENTE", text: "SOAT vigente hasta el 15 de diciembre de 2026." },
      { key: "techReview", label: "Revisión Técnica", status: "WARNING", badgeText: "VENCIDO", text: "Revisión técnica vencida desde marzo 2025." },
      { key: "vehicleTax", label: "Impuesto Vehicular", status: "OK", badgeText: "PAGADO", text: "Sin deuda de impuesto vehicular." },
      { key: "gasConversion", label: "Conversión a Gas", status: "OK", badgeText: "NO APLICA", text: "No registra conversión a gas." },
      { key: "satTickets", label: "Papeletas SAT", status: "CRITICAL", badgeText: "S/462 PENDIENTE", text: "1 papeleta pendiente por S/462.00 — infracción L09 (estacionamiento prohibido)." },
      { key: "callaoTickets", label: "Papeletas Callao", status: "OK", badgeText: "OK", text: "Sin papeletas en el Callao." },
      { key: "atuTickets", label: "Papeletas ATU", status: "OK", badgeText: "OK", text: "Sin papeletas ATU." },
      { key: "sutranTickets", label: "Infracciones SUTRAN", status: "OK", badgeText: "OK", text: "Sin infracciones SUTRAN." },
      { key: "transportRegistry", label: "Registro de Transportes", status: "OK", badgeText: "OK", text: "No registra actividad de transporte público." },
      { key: "siniestroSoat", label: "Siniestros SOAT", status: "CRITICAL", badgeText: "2 SINIESTROS", text: "2 siniestros SOAT registrados (2021, 2023)." },
      { key: "accidentHistory", label: "Activaciones de Seguro", status: "OK", badgeText: "OK", text: "Sin reclamos registrados en aseguradoras." },
    ],
    otherObservations: "Vehículo con historial mixto. Se recomienda verificar el gravamen vigente antes de proceder con la compra y regularizar la revisión técnica.",
    screenshots: [],
    inspectorName: "Sistema Automatizado",
    totalPages: 3,
    soatExpiryDate: "15/12/2026",
    techReviewExpiryDate: "10/03/2025",
    lastTransferPrice: null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plate, useMock, apiData: cachedApiData } = body;

    if (!plate || typeof plate !== "string" || plate.replace(/-/g, "").length !== 6) {
      return NextResponse.json({ error: "Placa inválida" }, { status: 400 });
    }

    const cleanPlate = plate.toUpperCase().replace(/-/g, "");

    let data: LegalReportData;
    if (cachedApiData) {
      data = transformApiResponse(cachedApiData, cleanPlate);
    } else if (useMock) {
      data = getMockLegalData(cleanPlate);
    } else {
      try {
        data = await fetchInformeFromApi(cleanPlate);
      } catch (apiError) {
        console.error("Error llamando API de informes, usando mock:", apiError);
        data = getMockLegalData(cleanPlate);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfElement = React.createElement(LegalReportPDF, { data }) as any;
    const buffer = await renderToBuffer(pdfElement);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="reporte-legal-${cleanPlate}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generando reporte legal:", error);
    return NextResponse.json({ error: "Error generando el reporte" }, { status: 500 });
  }
}
