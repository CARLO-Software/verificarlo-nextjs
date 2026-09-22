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

/* eslint-disable @typescript-eslint/no-explicit-any */
function buildFallbackFromRaw(raw: any, plate: string) {
  // Extract vehicle from siguelo titulos (first one with marca)
  const titulos = raw.siguelo?.titulos || [];
  const vehTit = titulos.find((t: any) => t.marca) || {};

  const vehiculo = vehTit.marca ? {
    marca: vehTit.marca || "",
    modelo: vehTit.modelo || "",
    anio_fabricacion: vehTit.anio_fabricacion || "",
    anio_modelo: vehTit.anio_modelo || vehTit.anio_fabricacion || "",
    categoria: vehTit.categoria || "",
    color: vehTit.color || "",
    combustible: vehTit.combustible || "",
    nro_motor: vehTit.nro_motor || "",
    nro_serie: vehTit.nro_serie || "",
    nro_vin: vehTit.nro_vin || "",
    uso: vehTit.tipo_uso || "",
    datos_complementarios_partida: [
      vehTit.tipo_carroceria ? `Tipo Carrocería ${vehTit.tipo_carroceria}` : "",
      vehTit.cilindrada ? `Cilindrada ${vehTit.cilindrada}` : "",
      vehTit.potencia_motor ? `Potencia Motor ${vehTit.potencia_motor}` : "",
      vehTit.nro_cilindros ? `Nro. Cilindros ${vehTit.nro_cilindros}` : "",
      vehTit.nro_asientos ? `Nro. Asientos ${vehTit.nro_asientos}` : "",
      vehTit.formula_rodante ? `Fórmula Rodante ${vehTit.formula_rodante}` : "",
      vehTit.peso_neto ? `Peso Neto ${vehTit.peso_neto}` : "",
      vehTit.peso_bruto ? `Peso Bruto ${vehTit.peso_bruto}` : "",
      vehTit.carga_util ? `Carga Util ${vehTit.carga_util}` : "",
      vehTit.longitud ? `Longitud ${vehTit.longitud}` : "",
      vehTit.ancho ? `Ancho ${vehTit.ancho}` : "",
      vehTit.altura ? `Altura ${vehTit.altura}` : "",
      vehTit.num_partida ? `Partida ${vehTit.num_partida}` : "",
    ].filter(Boolean).join(", "),
  } : undefined;

  // Build titularidad from siguelo
  const SKIP = new Set(["COPROPIEDAD", "PROPIEDAD EXCLUSIVA", "PERSONA NATURAL", "PERSONA JURÍDICA", "PERSONA JURIDICA"]);
  const CIVIL = new Set(["SOLTERO", "SOLTERA", "CASADO", "CASADA", "VIUDO", "VIUDA", "DIVORCIADO", "DIVORCIADA"]);
  const ownerTitulos = titulos.filter((t: any) => t.nombre && t.acto_registral);
  const historial = ownerTitulos.map((t: any, i: number) => {
    const parts = (t.nombre || "").split("|").map((s: string) => s.trim()).filter(Boolean);
    const names = parts.filter((p: string) => !SKIP.has(p.toUpperCase()) && !CIVIL.has(p.toUpperCase()));
    const nombre = names.join(" y ") || parts[0] || "";
    return {
      documento: "",
      tipo_documento: "",
      nombre,
      fecha: t.fecha_asiento || t.fecha || "",
      tiempo_como_propietario: "",
      precio: t.valor_bien || t.derechos_pagados || "N/A",
      titulo: t.num_titulo || "",
      estado: i === ownerTitulos.length - 1 ? "Titular vigente" : "",
    };
  });

  // Build asientos_registrales
  const asientos = titulos.map((t: any) => ({
    asiento: String(titulos.indexOf(t) + 1),
    fecha: t.fecha_asiento || t.fecha || "",
    acto: t.acto_registral || t.tipo_doc || "",
    titulo: t.num_titulo || "",
  }));

  // Gravámenes from sunarp_garantias
  const gar = raw.sunarp_garantias;
  const gravamenes = gar ? {
    estado: gar.sin_resultados ? "Sin gravámenes" : (gar.nota || "Con gravámenes"),
    semaforo: gar.sin_resultados ? "verde" : "rojo",
    detalle: gar.sin_resultados
      ? "El vehículo no registra garantías mobiliarias, embargos ni cargas vigentes en SUNARP."
      : (gar.nota || "Presenta afectaciones vigentes."),
  } : undefined;

  // Impuesto vehicular from sat_tributos
  const satTrib = raw.sat_tributos;
  let impuesto_vehicular = undefined;
  if (satTrib?.contribuyentes?.length) {
    const allTributos = satTrib.contribuyentes.flatMap((c: any) => (c.tributos || []).map((t: any) => ({ ...t, contribuyente: c.nombre })));
    const byYear = new Map<string, any>();
    for (const t of allTributos) {
      const year = t["Año"] || t.anio || "";
      if (!byYear.has(year)) byYear.set(year, t);
    }
    const anios = Array.from(byYear.entries()).map(([year, t]) => {
      const deuda = parseFloat((t["Deuda Ofic.SAT"] || t.deuda || "0").replace(/,/g, ""));
      const pagado = (t.Estado || t.estado || "").toLowerCase().includes("pagado");
      return {
        anio: year,
        estado: pagado ? "Pagado" : "Pendiente",
        semaforo: pagado || deuda === 0 ? "verde" : "rojo",
        contribuyente: t.contribuyente || "",
        monto: t.Pagado || t.pagado || "",
      };
    }).sort((a, b) => a.anio.localeCompare(b.anio));
    impuesto_vehicular = { anios, criterio_aplicado: "", recordatorio: "" };
  }

  // Deudas/multas/capturas
  const deudas: { fuente: string; resultado: string; semaforo: string }[] = [];

  const satPap = raw.sat_papeletas;
  if (satPap) {
    deudas.push({
      fuente: "sat_lima",
      resultado: satPap.sin_papeletas ? "Sin papeletas registradas." : `Presenta papeletas pendientes.`,
      semaforo: satPap.sin_papeletas ? "verde" : "rojo",
    });
  }
  const satCap = raw.sat_captura;
  if (satCap) {
    const sinCaptura = satCap.sin_captura || satCap.sin_resultados;
    deudas.push({
      fuente: "sat_captura",
      resultado: sinCaptura ? "Sin orden de captura." : "Presenta orden de captura.",
      semaforo: sinCaptura ? "verde" : "rojo",
    });
  }
  const multa = raw.multa;
  if (multa) {
    deudas.push({
      fuente: "mun_callao",
      resultado: multa.sin_papeletas || multa.sin_resultados ? "Sin papeletas registradas." : "Presenta papeletas.",
      semaforo: multa.sin_papeletas || multa.sin_resultados ? "verde" : "rojo",
    });
  }
  const atu = raw.atu;
  if (atu) {
    const sinAtu = atu.sin_papeletas || atu.sin_resultados;
    deudas.push({
      fuente: "atu",
      resultado: sinAtu ? "Sin infracciones ATU." : "Presenta infracciones ATU.",
      semaforo: sinAtu ? "verde" : "rojo",
    });
  }
  const sutran = raw.sutran;
  if (sutran) {
    const sinSutran = sutran.sin_papeletas || sutran.sin_resultados || (Array.isArray(sutran) && sutran.length === 0);
    deudas.push({
      fuente: "sutran_record",
      resultado: sinSutran ? "Sin infracciones SUTRAN." : "Presenta infracciones SUTRAN.",
      semaforo: sinSutran ? "verde" : "rojo",
    });
  }

  // SOAT + seguro vehicular → desglose_soat (feeds activationsTable)
  const sbs = raw.sbs_soat;
  const soatEntries = (sbs?.seguros || []).map((seg: any) => ({
    compania: seg.empresa || sbs.empresa || "",
    uso: seg.uso || "",
    vigencia_desde: seg.fecha_inicio || "",
    vigencia_hasta: seg.fecha_vcto || "",
    nro_certificado: seg.nro_certificado || "",
    nro_accidentes: seg.nro_accidentes || "0",
    nro_poliza: seg.poliza || seg.nro_poliza || "",
  }));
  const sbsVeh = raw.sbs_vehicular;
  const vehEntries = (sbsVeh?.seguros || []).map((seg: any) => ({
    compania: seg.empresa || sbsVeh.empresa || "",
    uso: seg.uso || "",
    vigencia_desde: seg.fecha_inicio || "",
    vigencia_hasta: seg.fecha_vcto || "",
    nro_certificado: seg.nro_certificado || "",
    nro_accidentes: seg.nro_accidentes || "0",
    nro_poliza: seg.poliza || seg.nro_poliza || "",
  }));
  const desglose_soat = [...soatEntries, ...vehEntries].length > 0
    ? [...soatEntries, ...vehEntries]
    : undefined;

  // Seguros/revision/siniestros summary
  const srs: { concepto: string; resultado: string; semaforo: string }[] = [];

  // SOAT summary
  if (sbs) {
    const venc = sbs.vencimiento || sbs.seguros?.[0]?.fecha_vcto;
    const parts = venc?.split("/");
    let vigente = false;
    if (parts?.length === 3) {
      const exp = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T23:59:59`);
      vigente = exp >= new Date();
    }
    srs.push({ concepto: "soat", resultado: vigente ? `SOAT vigente hasta ${venc}. ${sbs.empresa}.` : `SOAT vencido (${venc}).`, semaforo: vigente ? "verde" : "rojo" });
  }

  // CITV summary
  const citv = raw.citv;
  if (citv) {
    const parts = citv.fecha_vcto?.split("/");
    let vigente = false;
    if (parts?.length === 3) {
      const exp = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T23:59:59`);
      vigente = exp >= new Date();
    }
    srs.push({ concepto: "citv", resultado: vigente ? `Revisión técnica vigente hasta ${citv.fecha_vcto}.` : `Revisión técnica vencida (${citv.fecha_vcto}).`, semaforo: vigente ? "verde" : "rojo" });
  }

  // Siniestros — only from SOAT seguros
  const accTotal = soatEntries.reduce((sum: number, d: any) => sum + (parseInt(d.nro_accidentes, 10) || 0), 0);
  srs.push({ concepto: "siniestros_soat", resultado: accTotal === 0 ? "0 siniestros SOAT registrados." : `${accTotal} siniestro(s) SOAT registrado(s).`, semaforo: accTotal === 0 ? "verde" : accTotal >= 3 ? "rojo" : "amarillo" });

  // Seguro vehicular — count activations
  if (sbsVeh) {
    const vehAcc = vehEntries.reduce((sum: number, d: any) => sum + (parseInt(d.nro_accidentes, 10) || 0), 0);
    const vehText = vehAcc > 0
      ? `${vehAcc} activacion(es) de seguro vehicular con ${sbsVeh.empresa}.`
      : `Seguro vehicular con ${sbsVeh.empresa}. Sin activaciones registradas.`;
    srs.push({ concepto: "accidentes_seguro_vehicular", resultado: vehText, semaforo: vehAcc > 0 ? "amarillo" : "gris" });
  }

  // GNV
  const conversion_gnv: { concepto: string; resultado: string; semaforo: string }[] = [];
  const infogas = raw.infogas;
  if (infogas) {
    const sinGnv = infogas.sin_resultados || !infogas.resultado;
    conversion_gnv.push({ concepto: "infogas", resultado: sinGnv ? "No registra conversión a GNV." : (infogas.resultado || ""), semaforo: sinGnv ? "gris" : "verde" });
  }
  const fise = raw.fise;
  if (fise) {
    const sinFise = fise.sin_resultados || !fise.resultado;
    conversion_gnv.push({ concepto: "fise", resultado: sinFise ? "Sin subsidio FISE." : (fise.resultado || ""), semaforo: sinFise ? "gris" : "verde" });
  }

  // Conclusion — generate a basic one from the data
  const issues: string[] = [];
  if (gravamenes && gravamenes.semaforo !== "verde") issues.push("gravámenes vigentes");
  if (impuesto_vehicular?.anios.some((a: any) => a.semaforo !== "verde")) issues.push("impuesto vehicular pendiente");
  if (deudas.some(d => d.semaforo !== "verde")) issues.push("papeletas o multas pendientes");
  if (accTotal > 0) issues.push(`${accTotal} siniestro(s) registrado(s)`);

  const nOwners = historial.length;
  let conclusionText: string;
  let conclusionLabel: string;

  if (issues.length === 0) {
    conclusionLabel = "APTO CON OBSERVACIONES";
    conclusionText = `El vehículo de placa ${plate.toUpperCase()} presenta una situación registral y tributaria limpia: sin gravámenes ni afectaciones, impuesto vehicular al día, sin papeletas ni orden de captura. ${nOwners > 5 ? `Se observa alta rotación de propietarios (${nOwners} titulares).` : ""} La decisión final es del cliente.`;
  } else {
    conclusionLabel = "REVISAR ANTES DE COMPRAR";
    conclusionText = `El vehículo de placa ${plate.toUpperCase()} presenta las siguientes observaciones: ${issues.join(", ")}. Se recomienda verificar estos puntos antes de proceder con la compra. La decisión final es del cliente.`;
  }

  return {
    vehiculo,
    titularidad: historial.length > 0 ? { historial, nota_titular_vigente: "" } : undefined,
    asientos_registrales: asientos.length > 0 ? { lista: asientos } : undefined,
    gravamenes,
    impuesto_vehicular,
    deudas_multas_capturas: deudas.length > 0 ? deudas : undefined,
    seguros_revision_siniestros: srs.length > 0 ? srs : undefined,
    desglose_soat,
    conversion_gnv: conversion_gnv.length > 0 ? conversion_gnv : undefined,
    conclusion: { etiqueta: conclusionLabel, texto: conclusionText },
    fuentes_consultadas: ["SUNARP", "SAT Lima", "APESEG", "SBS", "MTC", "ATU", "SUTRAN", "InfoGas", "FISE"],
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

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
      if (apiData.error && apiData.datos_crudos) {
        const raw = apiData.datos_crudos;
        const fallback = buildFallbackFromRaw(raw, plate);
        const result = transformApiResponse(fallback, plate, api2);
        result.isFallback = true;
        return result;
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
