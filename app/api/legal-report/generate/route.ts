import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import LegalReportPDF, { type LegalReportData } from "@/lib/pdf/legal/LegalReportPDF";
import { transformApiResponse, type Api2Response } from "@/lib/pdf/legal/transform-api-response";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import { sendEmail } from "@/lib/email/resend";

const INFORME_API_URL = "http://161.132.38.122/informe/placa";
const CONSULTAR_API_URL = "http://161.132.38.122/consultar/placa";
const API_TIMEOUT_MS = 5 * 60 * 1000;
const API2_TIMEOUT_MS = 15 * 1000;
const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || "contacto@carlo.pe";

type ApiErrorCode = "API_KEY_MISSING" | "API_DOWN" | "API_TIMEOUT" | "API_ERROR" | "PDF_ERROR";

class LegalReportError extends Error {
  code: ApiErrorCode;
  statusCode: number;
  constructor(code: ApiErrorCode, message: string, statusCode = 502) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

async function notifyAdminsApiError(plate: string, error: LegalReportError) {
  const now = toZonedTime(new Date(), "America/Lima");
  const timestamp = format(now, "dd/MM/yyyy HH:mm", { locale: es });

  const messages: Record<ApiErrorCode, string> = {
    API_KEY_MISSING: "La API key no esta configurada en el servidor.",
    API_DOWN: "La API de informes no responde despues de varios reintentos.",
    API_TIMEOUT: "La API de informes supero el tiempo de espera (timeout).",
    API_ERROR: `La API devolvio un error: ${error.message}`,
    PDF_ERROR: `Error al generar el PDF: ${error.message}`,
  };

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[ALERTA] Fallo en reporte legal - Placa ${plate}`,
    html: `
      <h2>Fallo al generar reporte legal</h2>
      <p><b>Placa:</b> ${plate}</p>
      <p><b>Error:</b> ${messages[error.code]}</p>
      <p><b>Codigo:</b> ${error.code}</p>
      <p><b>Fecha:</b> ${timestamp} (Lima)</p>
      <p>Un cliente intento generar su reporte legal y no se pudo completar. Revisar creditos y estado de la API.</p>
    `,
  }).catch((emailErr) => {
    console.error("No se pudo enviar alerta a admins:", emailErr);
  });
}

async function fetchConsultarApi(plate: string): Promise<Api2Response | null> {
  const apiKey = process.env.INFORME_API_KEY;
  if (!apiKey) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API2_TIMEOUT_MS);
  try {
    const res = await fetch(CONSULTAR_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify({ placa: plate }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchInformeFromApi(plate: string): Promise<LegalReportData> {
  const apiKey = process.env.INFORME_API_KEY;
  if (!apiKey) throw new LegalReportError("API_KEY_MISSING", "INFORME_API_KEY no configurada", 500);

  const api2Promise = fetchConsultarApi(plate);
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
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

      if (res.status === 503 && attempt < MAX_RETRIES) {
        clearTimeout(timeout);
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new LegalReportError("API_ERROR", `API respondio ${res.status}: ${body}`);
      }

      const apiData = await res.json();
      const api2 = await api2Promise;
      if (apiData.error) {
        throw new LegalReportError("API_ERROR", apiData.error);
      }
      return transformApiResponse(apiData, plate, api2);
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof LegalReportError) throw err;
      const isAbort = (err instanceof Error && err.name === "AbortError") || (err instanceof DOMException && err.name === "AbortError");
      if (isAbort) {
        if (attempt < MAX_RETRIES) continue;
        throw new LegalReportError("API_TIMEOUT", "La API supero el tiempo de espera");
      }
      throw new LegalReportError("API_DOWN", String(err));
    }
  }
  throw new LegalReportError("API_DOWN", "API no disponible despues de reintentos");
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
  let cleanPlate = "???";
  try {
    const body = await req.json();
    const { plate, useMock, apiData: cachedApiData } = body;

    if (!plate || typeof plate !== "string" || plate.replace(/-/g, "").length !== 6) {
      return NextResponse.json({ error: "Placa inválida" }, { status: 400 });
    }

    cleanPlate = plate.toUpperCase().replace(/-/g, "");

    let data: LegalReportData;
    if (cachedApiData) {
      const api2 = await fetchConsultarApi(cleanPlate);
      data = transformApiResponse(cachedApiData, cleanPlate, api2);
    } else if (useMock) {
      data = getMockLegalData(cleanPlate);
    } else {
      data = await fetchInformeFromApi(cleanPlate);
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

    if (error instanceof LegalReportError) {
      await notifyAdminsApiError(cleanPlate, error);
      const userMessages: Record<ApiErrorCode, string> = {
        API_KEY_MISSING: "El servicio no esta disponible en este momento. Nuestro equipo ya fue notificado.",
        API_DOWN: "El servicio de consulta vehicular no esta disponible. Nuestro equipo ya fue notificado y tu reporte sera generado a la brevedad.",
        API_TIMEOUT: "La consulta esta tardando mas de lo normal. Intenta de nuevo en unos minutos.",
        API_ERROR: "Hubo un problema consultando los datos del vehiculo. Intenta de nuevo o contactanos por WhatsApp.",
        PDF_ERROR: "Error al generar el documento. Intenta de nuevo.",
      };
      return NextResponse.json(
        { error: userMessages[error.code], code: error.code },
        { status: error.statusCode },
      );
    }

    await notifyAdminsApiError(cleanPlate, new LegalReportError("PDF_ERROR", String(error), 500));
    return NextResponse.json(
      { error: "Hubo un error inesperado. Nuestro equipo ya fue notificado.", code: "PDF_ERROR" },
      { status: 500 },
    );
  }
}
