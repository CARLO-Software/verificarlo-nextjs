import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import LegalReportPDF, { type LegalReportData } from "@/lib/pdf/legal/LegalReportPDF";
import { transformApiResponse } from "@/lib/pdf/legal/transform-api-response";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import { sendEmail } from "@/lib/email/resend";

const INFORME_API_URL = "http://161.132.38.122/informe/placa";
const API_TIMEOUT_MS = 5 * 60 * 1000;
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

  const actions: Record<ApiErrorCode, string> = {
    API_KEY_MISSING: "Configurar la variable INFORME_API_KEY en el servidor.",
    API_DOWN: "Verificar que el servidor de la API (161.132.38.122) este encendido y que el servicio Python este corriendo detras de nginx.",
    API_TIMEOUT: "La API tardo mas de 5 minutos en responder. Revisar si el servidor esta sobrecargado o si la consulta se quedo colgada.",
    API_ERROR: "La API respondio pero con un error. Revisar los logs del servidor Python y verificar que tenga creditos/saldo disponible para consultas.",
    PDF_ERROR: "Los datos se obtuvieron correctamente pero fallo la generacion del PDF. Revisar los logs de la aplicacion Next.js.",
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
      <hr/>
      <p><b>Accion sugerida:</b> ${actions[error.code]}</p>
    `,
  }).catch((emailErr) => {
    console.error("No se pudo enviar alerta a admins:", emailErr);
  });
}

async function fetchInformeFromApi(plate: string): Promise<LegalReportData> {
  const apiKey = process.env.INFORME_API_KEY;
  if (!apiKey) throw new LegalReportError("API_KEY_MISSING", "INFORME_API_KEY no configurada", 500);

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
      if (apiData.error) {
        throw new LegalReportError("API_ERROR", apiData.error);
      }
      return transformApiResponse(apiData, plate);
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
    emissionDate: format(now, "dd/MM/yyyy HH:mm", { locale: es }),
    code: `RL-DEMO-${plate.toUpperCase().replace(/-/g, "")}`,
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
    vehicleMain: [
      { label: "Placa", value: plate.toUpperCase() },
      { label: "Marca", value: "SUZUKI" },
      { label: "Modelo", value: "SWIFT 1.2" },
      { label: "Año Fabricación", value: "2014" },
      { label: "Categoría", value: "M1" },
      { label: "Color", value: "BLANCO" },
      { label: "Combustible", value: "GASOLINA" },
      { label: "Uso", value: "PARTICULAR" },
    ],
    vehicleComplementary: [
      { label: "Nº Motor", value: "K12BN4******" },
      { label: "Nº Serie", value: "MALAN41S0E******" },
      { label: "Nº VIN", value: "MALAN41S0EK******" },
      { label: "Partida Registral", value: "N° 70XXXXXX" },
      { label: "Zona Registral", value: "IX - SEDE LIMA" },
      { label: "Oficina Registral", value: "LIMA" },
      { label: "Cilindrada", value: "1242 cc" },
      { label: "Ejes / Ruedas", value: "2 / 4" },
    ],
    owners: [
      { number: 1, name: "GARCÍA LÓPEZ, JUAN CARLOS", document: "DNI 4XXXXXXX", acquisitionDate: "15/03/2014", timeAsOwner: "3 años 8 meses", price: "US$ 12,500", title: "Título 2014-XXXXXXX", tags: [] },
      { number: 2, name: "MENDOZA RÍOS, MARÍA ELENA", document: "DNI 7XXXXXXX", acquisitionDate: "20/11/2017", timeAsOwner: "4 años 4 meses", price: "S/ 32,000", title: "Título 2017-XXXXXXX", tags: [] },
      { number: 3, name: "TORRES VEGA, PEDRO ANTONIO", document: "DNI 4XXXXXXX", acquisitionDate: "14/03/2022", timeAsOwner: "Titular actual", price: "S/ 28,500", title: "Título 2022-XXXXXXX", tags: ["TITULAR VIGENTE"] },
    ],
    ownershipNote: "El vehículo ha tenido 3 propietarios. El titular actual (persona natural) adquirió el vehículo por compraventa en marzo de 2022.",
    registryEntries: [
      { number: 1, date: "15/03/2014", act: "PRIMERA INSCRIPCIÓN DE DOMINIO", title: "Título 2014-XXXXXXX" },
      { number: 2, date: "20/11/2017", act: "COMPRAVENTA", title: "Título 2017-XXXXXXX" },
      { number: 3, date: "10/06/2019", act: "CONSTITUCIÓN DE GARANTÍA MOBILIARIA", title: "Título 2019-XXXXXXX" },
      { number: 4, date: "14/03/2022", act: "COMPRAVENTA", title: "Título 2022-XXXXXXX" },
    ],
    registryNote: "Se detectó una garantía mobiliaria inscrita. Es importante verificar si fue levantada.",
    registryNoteStatus: "WARNING",
    registryNoteTitle: "Atención",
    liensStatus: "WARNING",
    liensTitle: "Gravamen vigente",
    liensDetail: "Se encontró 1 gravamen vehicular vigente. Entidad acreedora: BANCO DE CRÉDITO DEL PERÚ. Constituido el 10/06/2019. Mientras el gravamen no se levante, la transferencia podría verse afectada.",
    liensSource: "Fuente: SUNARP — Partida Registral",
    taxYears: [
      { year: "2024", contributor: "TORRES VEGA, PEDRO A.", amount: "S/ 0.00", status: "OK", statusText: "PAGADO" },
      { year: "2023", contributor: "TORRES VEGA, PEDRO A.", amount: "S/ 0.00", status: "OK", statusText: "PAGADO" },
      { year: "2022", contributor: "TORRES VEGA, PEDRO A.", amount: "S/ 0.00", status: "OK", statusText: "PAGADO" },
    ],
    taxPendingSummary: "Sin deuda de impuesto vehicular pendiente.",
    taxCriteria: "El Impuesto Vehicular grava la propiedad de vehículos con antigüedad no mayor a 3 años. Al ser un vehículo del año 2014, ya no está afecto a este tributo.",
    taxReminder: "Sin deuda pendiente.",
    taxSource: "Fuente: SAT Lima",
    debts: [
      { concept: "Papeletas SAT Lima", entity: "SAT", result: "1 papeleta pendiente — S/ 462.00", status: "CRITICAL", statusText: "PENDIENTE" },
      { concept: "Orden de Captura SAT", entity: "SAT", result: "Sin órdenes vigentes", status: "OK", statusText: "OK" },
      { concept: "Papeletas Callao", entity: "MPC", result: "Sin papeletas", status: "OK", statusText: "OK" },
      { concept: "Infracciones ATU", entity: "ATU", result: "Sin infracciones", status: "OK", statusText: "OK" },
      { concept: "Infracciones SUTRAN", entity: "SUTRAN", result: "Sin infracciones", status: "OK", statusText: "OK" },
    ],
    debtsNote: "**Resumen:** El vehículo registra 1 papeleta pendiente en SAT Lima por S/ 462.00 (infracción L09 — estacionamiento prohibido). Las papeletas y multas pendientes se transfieren al nuevo propietario.",
    debtsSource: "Fuente: SAT Lima, Municipalidad del Callao, ATU, SUTRAN",
    insurance: [
      { concept: "SOAT", entity: "APESEG", result: "Vigente hasta 15/12/2026", status: "OK", statusText: "VIGENTE" },
      { concept: "Revisión Técnica (CITV)", entity: "MTC", result: "Vencida desde 10/03/2025", status: "WARNING", statusText: "VENCIDO" },
    ],
    soatBreakdown: [
      { compania: "LA POSITIVA SEGUROS", uso: "PARTICULAR", vigencia: "16/12/2025 — 15/12/2026", certificado: "N° 00XXXXXXXX", accidentes: 0, estado: "Vigente", status: "OK" },
      { compania: "RÍMAC SEGUROS", uso: "PARTICULAR", vigencia: "16/12/2024 — 15/12/2025", certificado: "N° 00XXXXXXXX", accidentes: 1, estado: "Vencido", status: "WARNING" },
    ],
    soatBreakdownNote: "El SOAT actual está vigente. Se registra 1 accidente reportado bajo la póliza anterior (Rímac Seguros).",
    citvBreakdown: [
      { empresa: "REVISIONES TÉCNICAS DEL PERÚ S.A.C.", certificado: "CITV-XXXXXXXX", fechaEmision: "10/03/2024", fechaVcto: "10/03/2025", resultado: "APROBADO", estado: "Vencido", status: "WARNING" },
    ],
    citvBreakdownNote: "**Revisión técnica vencida** — La última revisión técnica venció el 10/03/2025. Se debe renovar antes de circular.",
    insuranceNote: "Se recomienda verificar que el SOAT esté vigente al momento de la transferencia y renovar la revisión técnica.",
    insuranceSource: "Fuente: APESEG, MTC, SBS",
    claims: [
      { concept: "Siniestros SOAT (SBS)", entity: "SBS/APESEG", result: "2 siniestros registrados", status: "CRITICAL", statusText: "2 SINIESTROS" },
      { concept: "Activaciones de seguro", entity: "APESEG", result: "Sin reclamos adicionales", status: "OK", statusText: "OK" },
    ],
    activationsTable: [
      { insurer: "RÍMAC SEGUROS", policyNumber: "00XXXXXXXX", period: "2024-2025", count: 1 },
      { insurer: "LA POSITIVA SEGUROS", policyNumber: "00XXXXXXXX", period: "2021-2022", count: 1 },
    ],
    claimsNote: "El vehículo registra 2 siniestros SOAT. Se recomienda solicitar el detalle de los siniestros a la aseguradora para conocer la gravedad de los incidentes.",
    claimsSource: "Fuente: SBS, APESEG",
    gnvItems: [
      { concept: "Conversión a GNV", entity: "OSINERGMIN", result: "No registra conversión", status: "OK", statusText: "NO APLICA" },
      { concept: "Subsidio FISE", entity: "OSINERGMIN", result: "No registra beneficio", status: "OK", statusText: "NO APLICA" },
    ],
    gnvSource: "Fuente: OSINERGMIN",
    conclusionText: "El vehículo SUZUKI SWIFT 2014 presenta un historial mixto. Se identificaron puntos de atención: 1 gravamen vigente a favor de entidad financiera (BCP), 1 papeleta pendiente en SAT Lima por S/ 462.00, revisión técnica vencida y 2 siniestros SOAT registrados. Se recomienda: (1) Verificar y negociar el levantamiento del gravamen antes de la compra, (2) Solicitar el descargo de la papeleta pendiente, (3) Renovar la revisión técnica vehicular, (4) Solicitar detalle de los siniestros a la aseguradora.",
    disclaimer: "Este reporte fue generado de forma automatizada consultando fuentes oficiales. La información puede variar según actualizaciones de las entidades. VerifiCARLO no se hace responsable por cambios posteriores a la fecha de emisión.",
    otherObservations: "Vehículo con historial mixto. Se recomienda verificar el gravamen vigente antes de proceder con la compra y regularizar la revisión técnica.",
    screenshots: [],
    inspectorName: "Sistema Automatizado",
    totalPages: 5,
    soatExpiryDate: "15/12/2026",
    techReviewExpiryDate: "10/03/2025",
    lastTransferPrice: "S/ 28,500",
  };
}

export async function POST(req: NextRequest) {
  let cleanPlate = "???";
  try {
    const body = await req.json();
    const { plate, useMock, isExample, apiData: cachedApiData } = body;

    if (!plate || typeof plate !== "string" || plate.replace(/-/g, "").length !== 6) {
      return NextResponse.json({ error: "Placa inválida" }, { status: 400 });
    }

    cleanPlate = plate.toUpperCase().replace(/-/g, "");

    let data: LegalReportData;
    if (cachedApiData) {
      data = transformApiResponse(cachedApiData, cleanPlate);
    } else if (useMock) {
      data = getMockLegalData(cleanPlate);
    } else {
      data = await fetchInformeFromApi(cleanPlate);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfElement = React.createElement(LegalReportPDF, { data, isExample: !!isExample }) as any;
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
