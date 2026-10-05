import { type LegalReportData, type TableEntry } from './LegalReportPDF';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';

interface ApiHistorialEntry {
  documento: string;
  tipo_documento: string;
  nombre: string;
  fecha: string;
  tiempo_como_propietario: string;
  precio: string;
  titulo: string;
  estado: string;
}

interface ApiResponse {
  resumen_situacion_legal?: { concepto: string; resultado: string; semaforo: string }[];
  vehiculo?: {
    marca: string;
    modelo: string;
    anio_fabricacion: string;
    anio_modelo: string;
    categoria: string;
    color: string;
    combustible: string;
    nro_motor: string;
    nro_serie: string;
    nro_vin: string;
    uso: string;
    datos_complementarios_partida?: string;
  };
  titularidad?: {
    historial: ApiHistorialEntry[];
    nota_titular_vigente?: string;
  };
  asientos_registrales?: {
    lista: { asiento: string; fecha: string; acto: string; titulo: string }[];
    nota_titulos_pendientes?: string;
  };
  gravamenes?: { estado: string; semaforo: string; detalle: string };
  impuesto_vehicular?: {
    anios: { anio: string; estado: string; semaforo: string; contribuyente?: string; monto?: string }[];
    criterio_aplicado?: string;
    recordatorio?: string;
  };
  deudas_multas_capturas?: { fuente: string; resultado: string; semaforo: string; detalle?: string }[];
  seguros_revision_siniestros?: { concepto: string; resultado: string; semaforo: string }[];
  desglose_soat?: {
    compania: string;
    uso?: string;
    vigencia_desde: string;
    vigencia_hasta: string;
    nro_certificado: string;
    nro_accidentes: string;
    nro_poliza?: string;
    vigencia?: string;
    estado?: string;
  }[];
  desglose_seguro_vehicular?: { aseguradora?: string; nro_poliza?: string; periodo?: string; cantidad?: number; nro_accidentes?: string; [k: string]: any }[];
  revision_tecnica?: { estado: string; semaforo: string; detalle?: string; vigencia_hasta?: string };
  conversion_gnv?: { concepto: string; resultado: string; semaforo: string }[];
  observaciones_analista?: (string | { severidad: string; texto: string })[];
  conclusion?: { etiqueta: string; texto: string };
  fuentes_consultadas?: string[];
  reglas_condicionales_aplicadas?: string[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Api2Response {
  sat_tributos?: {
    contribuyentes?: {
      nombre?: string;
      tributos?: Record<string, string>[];
    }[];
  };
  citv?: { certificado?: string; tipo_servicio?: string; resultado?: string; fecha_vcto?: string; [k: string]: any };
  sutran?: { placa?: string; mensaje?: string; papeletas?: { numero?: string; fecha?: string; codigo?: string; calificacion?: string; infractor?: string; monto?: string; pronto_pago?: string; estado?: string; [k: string]: any }[]; [k: string]: any };
  soat?: { historial?: { 'Compañía'?: string; Inicio?: string; Fin?: string; Certificado?: string; Estado?: string; Uso?: string; 'Fec. Anulación'?: string; [k: string]: any }[]; [k: string]: any };
  siguelo?: { titulos?: Record<string, any>[] };
  sunarp?: { siguelo?: { titulos?: Record<string, any>[] }; listaRes?: { titulos?: { acto?: string; num_titulo?: string }[] }[] };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

type FieldStatus = 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';

function semaforoToStatus(semaforo: string): FieldStatus {
  switch (semaforo) {
    case 'verde': return 'OK';
    case 'amarillo': case 'ambar': return 'WARNING';
    case 'rojo': return 'CRITICAL';
    default: return 'PENDING';
  }
}

function parseDatosComplementarios(raw?: string): Record<string, string> {
  if (!raw) return {};
  const result: Record<string, string> = {};
  // Format: "Partida XXXXX, Zona Registral..., Oficina Registral... . Key1 Value1, Key2 Value2, ..."
  // Split on comma, then try "Key Value" or "Key: Value" patterns
  const parts = raw.split(/[,;]/).map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    // Try "Key: Value" first
    const colonIdx = part.indexOf(':');
    if (colonIdx > 0) {
      result[part.slice(0, colonIdx).trim()] = part.slice(colonIdx + 1).trim();
      continue;
    }
    // Known keys with space-separated values
    const knownKeys = [
      'Partida', 'Tipo Carrocería', 'Tipo Carroceria', 'Nro. Ruedas', 'Nro. Ejes',
      'Fórmula Rodante', 'Formula Rodante', 'Potencia Motor', 'Nro. Cilindros',
      'Cilindrada', 'Longitud', 'Ancho', 'Altura', 'Nro. Asientos', 'Nro. Pasajeros',
      'Peso Bruto', 'Peso Neto', 'Carga Util', 'Carga Útil',
      'Nro. Versión', 'Nro. Version', 'Zona Registral', 'Oficina Registral',
    ];
    const partLower = part.toLowerCase();
    for (const key of knownKeys) {
      if (partLower.startsWith(key.toLowerCase())) {
        const val = part.slice(key.length).trim().replace(/^\.?\s*/, '');
        if (val) result[key] = val;
        break;
      }
    }
  }
  return result;
}

function formatDocument(tipo: string, doc: string): string {
  const tipoL = (tipo || '').toLowerCase();
  const docL = (doc || '').toLowerCase();
  const isUnknown = docL.includes('no especificado') || docL.includes('no disponible') || docL.includes('no consignado') || !doc;
  if (isUnknown) {
    if (tipoL.includes('dni')) return 'N.° de DNI no consignado';
    if (tipoL.includes('carné') || tipoL.includes('carne') || tipoL.includes('c.e')) return 'N.° de C.E. no consignado';
    if (tipoL.includes('partida')) return tipo;
    return '—';
  }
  return `${tipo}\n${doc}`;
}

function cleanTimeAsOwner(raw: string, fecha?: string, nextFecha?: string): string {
  if (!raw && !fecha) return '';
  if (fecha) {
    const dm = fecha.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (dm) {
      const from = new Date(+dm[3], +dm[2] - 1, +dm[1]);
      let to = new Date();
      if (nextFecha) {
        const dm2 = nextFecha.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (dm2) to = new Date(+dm2[3], +dm2[2] - 1, +dm2[1]);
      }
      let totalMonths = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
      if (to.getDate() < from.getDate()) totalMonths--;
      if (totalMonths < 0) totalMonths = 0;
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;
      const p: string[] = [];
      if (years > 0) p.push(`${years} año${years === 1 ? '' : 's'}`);
      if (months > 0) p.push(`${months} mes${months === 1 ? '' : 'es'}`);
      if (p.length === 0) p.push('< 1 mes');
      return p.join(' y ');
    }
  }
  if (raw) {
    let clean = raw
      .replace(/\s*\(.*?\)/g, '')
      .replace(/\s*—.*$/g, '')
      .replace(/\bcopropiedad\b/gi, '')
      .replace(/\bco-registrado\b/gi, '')
      .replace(/\bdesde\s+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    const shortened = shortenTime(clean);
    if (shortened !== clean) return shortened;
  }
  return raw || '';
}

const MONTH_MAP: Record<string, number> = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 };

function shortenTime(raw: string): string {
  if (!raw) return '';
  const y = raw.match(/(\d+)\s*año/i);
  const m = raw.match(/(\d+)\s*mes/i);
  const d = raw.match(/(\d+)\s*d[ií]a/i);
  const parts: string[] = [];
  if (y) parts.push(`${y[1]} año${y[1] === '1' ? '' : 's'}`);
  if (m) parts.push(`${m[1]} mes${m[1] === '1' ? '' : 'es'}`);
  if (!y && !m && d) parts.push(`${d[1]} día${d[1] === '1' ? '' : 's'}`);
  if (parts.length > 0) return parts.join(' y ');
  const rangeMatch = raw.match(/([A-Za-z]+)\s+(\d{4})\s*[-–a]\s*(?:la\s+fecha|([A-Za-z]+)\s+(\d{4}))/i);
  if (rangeMatch) {
    const m1 = MONTH_MAP[rangeMatch[1].toLowerCase().slice(0, 3)];
    const y1 = parseInt(rangeMatch[2]);
    let m2: number, y2: number;
    if (rangeMatch[3]) {
      m2 = MONTH_MAP[rangeMatch[3].toLowerCase().slice(0, 3)];
      y2 = parseInt(rangeMatch[4]);
    } else {
      const now = new Date();
      m2 = now.getMonth();
      y2 = now.getFullYear();
    }
    if (m1 !== undefined && m2 !== undefined) {
      let totalMonths = (y2 - y1) * 12 + (m2 - m1);
      if (totalMonths < 0) totalMonths = 0;
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;
      const p: string[] = [];
      if (years > 0) p.push(`${years} año${years === 1 ? '' : 's'}`);
      if (months > 0) p.push(`${months} mes${months === 1 ? '' : 'es'}`);
      if (p.length === 0) p.push('< 1 mes');
      return p.join(' y ');
    }
  }
  return raw;
}

function parseDate(dateStr: string): Date | null {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

function findDeuda(deudas: ApiResponse['deudas_multas_capturas'], fuente: string) {
  return deudas?.find(d => d.fuente === fuente);
}

function cleanDate(d: string): string {
  return (d || '').replace(/\s*-?\s*PRESENTACI[ÓO]N ELECTR[ÓO]NICA/gi, '').trim();
}

function cleanResultText(text: string): string {
  let clean = text
    .replace(/\s*\([^)]*:\s*\w+\)/g, '')
    .replace(/\s*\([^)]*=[^)]*\)/g, '')
    .replace(/\s*\([^)]*:\s*[^)]*=[^)]*\)/g, '')
    .replace(/\s*\w+:\s*\w+=\w+/g, '')
    .replace(/\.\s*\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
  // Improve common terse outputs
  clean = clean.replace(/\s*\(sin_resultados:\s*\w+\)/gi, '');
  if (/^Sin resultados en InfoGas$/i.test(clean)) clean = 'No registra conversión a GNV.';
  if (/^Sin resultados$/i.test(clean)) clean = 'No presenta infracciones pendientes de pago.';
  if (/^Sin papeletas registradas$/i.test(clean)) clean = 'No presenta papeletas pendientes de pago.';
  if (/^SIN REGISTRO en SBS$/i.test(clean)) clean = 'Sin registro de seguro vehicular en SBS.';
  return clean;
}

// === CONCEPT BUILDERS (summary badges) ===

function buildOwnerHistory(api: ApiResponse) {
  const hist = api.titularidad?.historial;
  if (!hist) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'No se pudo consultar historial de propietarios.' };
  const count = hist.length;
  const status: FieldStatus = count <= 3 ? 'OK' : count <= 14 ? 'WARNING' : 'CRITICAL';
  const badgeText = count === 1 ? '1 TITULAR' : `${count} TITULARES`;
  let nota = api.titularidad?.nota_titular_vigente || '';
  // Replace misleading "cadena inusualmente larga/corta" with data-driven observation
  if (count > 3 && /cadena\s+(inusualmente\s+)?(larga|corta)|lapso\s+corto/i.test(nota)) {
    const dates = hist.map(h => parseDate(h.fecha)).filter(Boolean) as Date[];
    const sorted = dates.sort((a, b) => a.getTime() - b.getTime());
    const firstYear = sorted[0]?.getFullYear();
    const lastYear = sorted[sorted.length - 1]?.getFullYear();
    const recentCount = sorted.filter(d => d.getFullYear() >= lastYear - 1).length;
    nota = `${count} titulares desde ${firstYear}${recentCount >= 3 ? `, con varias transferencias de muy corta duración entre ${lastYear - 1} y ${lastYear}` : ''}.`;
  }
  return { status, badgeText, text: `${count} propietario${count > 1 ? 's' : ''} registrado${count > 1 ? 's' : ''}. ${nota}`.trim() };
}

function resolveActLabel(api: ApiResponse, titulo?: string, isFirst?: boolean): string {
  if (isFirst) return 'Primera inscripción';
  if (titulo) {
    const clean = titulo.replace(/\s*\(asiento\s*\d+\)/gi, '').trim();
    const entry = api.asientos_registrales?.lista?.find(a => a.titulo === clean);
    if (entry?.acto) {
      const lower = entry.acto.toLowerCase();
      if (lower.includes('compraventa')) return 'Compraventa';
      if (lower.includes('sucesión') || lower.includes('sucesion')) return 'Sucesión intestada';
      if (lower.includes('anticipo')) return 'Anticipo de legítima';
      if (lower.includes('dación') || lower.includes('dacion')) return 'Dación en pago';
      if (lower.includes('donación') || lower.includes('donacion')) return 'Donación';
      if (lower.includes('remate')) return 'Remate judicial';
      if (lower.includes('adjudicación') || lower.includes('adjudicacion')) return 'Adjudicación';
      return entry.acto.charAt(0).toUpperCase() + entry.acto.slice(1).toLowerCase();
    }
  }
  return 'Transferencia';
}

function buildLastTransfer(api: ApiResponse, api2?: Api2Response | null) {
  const hist = api.titularidad?.historial;
  if (!hist?.length) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'Sin datos de transferencia.', extraInfo: undefined };
  const last = hist[hist.length - 1];
  let fecha = cleanDate(last.fecha);
  let precio = last.precio;
  if (!fecha && api2) {
    const titulos = api2.siguelo?.titulos || api2.sunarp?.siguelo?.titulos || [];
    const lastTitulo = titulos.filter(t => t.fecha).pop();
    if (lastTitulo) {
      fecha = cleanDate(lastTitulo.fecha);
      if ((!precio || precio === 'N/A') && lastTitulo.precio) precio = lastTitulo.precio;
    }
  }
  const acto = resolveActLabel(api, last.titulo, hist.length === 1);
  return {
    status: 'OK' as FieldStatus,
    badgeText: 'SIN OBSERVACIONES',
    text: fecha ? `${acto} registrada el ${fecha}.` : `${acto} registrada (fecha no disponible).`,
    extraInfo: precio && precio !== 'N/A' ? `Monto: ${precio}` : undefined,
  };
}

function buildGravamenes(api: ApiResponse) {
  const g = api.gravamenes;
  if (!g) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'No se pudo consultar gravámenes.' };
  const status = semaforoToStatus(g.semaforo);
  const detail = g.detalle || g.estado;
  const lower = (g.estado || '').toLowerCase();

  if (status === 'OK') {
    const entries = api.asientos_registrales?.lista || [];
    const historicalLiens = entries.filter(e => LIEN_ACTS.some(act => e.acto.toLowerCase().includes(act)));
    let text = 'SIGM sin registros y sin cargas vigentes en la partida.';
    if (historicalLiens.length > 0) {
      const resumen = historicalLiens.map(e => `${e.acto} (${e.fecha}, asiento ${e.asiento})`).join('; ');
      text += ` Cargas históricas canceladas: ${resumen}.`;
    }
    return { status, badgeText: 'LIBRE', text };
  }

  if (status === 'WARNING') {
    return { status, badgeText: 'CON CARGA', text: `${detail}. Verificar en SUNARP antes de cerrar.` };
  }

  // CRITICAL
  if (lower.includes('embargo')) {
    return { status, badgeText: 'EMBARGO', text: `${detail}. No transferible mientras esté vigente.` };
  }
  if (lower.includes('medida') || lower.includes('cautelar')) {
    return { status, badgeText: 'MEDIDA CAUTELAR', text: `${detail}. Puede derivar en embargo.` };
  }
  return { status, badgeText: 'CON GRAVAMEN', text: `${detail}. Requiere levantamiento o autorización del acreedor.` };
}

function isErrorResult(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('no disponible') || lower.includes('error de navegación') || lower.includes('error de navegacion') || lower.includes('no respondió') || lower.includes('no respondio') || lower.includes('tiempo de espera agotado') || lower.includes('timeout') || lower.includes('no se pudo completar');
}

function buildCaptura(api: ApiResponse) {
  const d = findDeuda(api.deudas_multas_capturas, 'sat_captura') ?? findDeuda(api.deudas_multas_capturas, 'sat_lima');
  if (!d) {
    const captura = api.deudas_multas_capturas?.find(x => x.fuente.includes('captura'));
    if (!captura) return { status: 'OK' as FieldStatus, badgeText: 'OK', text: 'No presenta orden de captura.' };
    if (isErrorResult(captura.resultado)) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: cleanResultText(captura.resultado) };
    return { status: semaforoToStatus(captura.semaforo), badgeText: captura.semaforo === 'verde' ? 'OK' : 'CON CAPTURA', text: cleanResultText(captura.resultado) };
  }
  if (isErrorResult(d.resultado)) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: cleanResultText(d.resultado) };
  const status = semaforoToStatus(d.semaforo);
  return { status, badgeText: status === 'OK' ? 'OK' : 'CON CAPTURA', text: status === 'OK' ? 'No presenta orden de captura.' : cleanResultText(d.resultado) };
}

function buildImpuesto(api: ApiResponse, api2?: Api2Response | null) {
  const imp = api.impuesto_vehicular;
  const resumen = api.resumen_situacion_legal?.find(r => r.concepto.toLowerCase().includes('impuesto vehicular'));
  if (!imp) return { status: 'PENDING' as FieldStatus, badgeText: 'SIN REGISTRO', text: resumen?.resultado || 'No se ubicó registro de pago.' };
  // api2 SAT is deterministic — use it as authority when available
  if (api2?.sat_tributos?.contribuyentes?.length) {
    const allPaid = api2.sat_tributos.contribuyentes.every(c =>
      (c.tributos || []).every(t => (t.Estado || t.estado || '').toLowerCase().includes('pagado'))
    );
    if (allPaid) {
      return {
        status: 'OK' as FieldStatus,
        badgeText: 'PAGADO',
        text: resumen?.resultado || 'Todos los años figuran pagados en SAT Lima.',
      };
    }
  }
  if (imp.anios.length === 0 && api2?.sat_tributos?.contribuyentes?.length) {
    return {
      status: 'WARNING' as FieldStatus,
      badgeText: 'PENDIENTE',
      text: resumen?.resultado || 'Cuotas pendientes detectadas vía SAT Lima.',
    };
  }
  const pagados = imp.anios.filter(a => a.semaforo === 'verde');
  const pendientes = imp.anios.filter(a => a.semaforo !== 'verde');
  const fallbackText = resumen?.resultado || `${imp.anios.length} año${imp.anios.length > 1 ? 's' : ''} verificado${imp.anios.length > 1 ? 's' : ''}.`;
  if (pendientes.length === 0) return { status: 'OK' as FieldStatus, badgeText: 'PAGADO', text: fallbackText };
  const parcial = pagados.length > 0;
  return {
    status: (parcial ? 'WARNING' : 'CRITICAL') as FieldStatus,
    badgeText: parcial ? 'PARCIAL' : 'CON DEUDA',
    text: resumen?.resultado || `${pendientes.length} año${pendientes.length > 1 ? 's' : ''} con deuda pendiente. ${(imp.criterio_aplicado || '').replace(/\s*\bJSON\b\s*/gi, ' ').replace(/'\s*/g, '').replace(/,?\s*por lo que el resultado es \w+/gi, '').replace(/\.?\s*[Ee]l resultado es \w+/gi, '').replace(/\s{2,}/g, ' ').trim()}`.trim(),
  };
}

function buildPapeletas(api: ApiResponse, fuente: string, label: string) {
  const d = findDeuda(api.deudas_multas_capturas, fuente);
  if (!d) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: `No se pudo consultar ${label}.` };
  if (isErrorResult(d.resultado)) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: cleanResultText(d.resultado) };
  const status = semaforoToStatus(d.semaforo);
  return { status, badgeText: debtStatusText(status, d.resultado), text: cleanResultText(d.resultado) };
}

function buildSutran(api: ApiResponse) {
  const d = findDeuda(api.deudas_multas_capturas, 'sutran_record') ?? findDeuda(api.deudas_multas_capturas, 'sutran');
  if (!d) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'No se pudo consultar SUTRAN.' };
  if (isErrorResult(d.resultado)) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: cleanResultText(d.resultado) };
  const status = semaforoToStatus(d.semaforo);
  return { status, badgeText: debtStatusText(status, d.resultado), text: cleanResultText(d.resultado) };
}

function buildSoat(api: ApiResponse, api2?: Api2Response | null) {
  const soat = api.desglose_soat?.[0];
  if (!soat) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'APESEG no respondió.', expiryDate: undefined };
  const estadoLower = (soat.estado || '').toLowerCase();
  const isAnulado = estadoLower.includes('anulado') || estadoLower.includes('anulada');
  const hasta = soat.vigencia_hasta;
  const expiry = parseDate(hasta);
  const now = new Date();
  let status: FieldStatus = 'OK';
  let badgeText = 'VIGENTE';
  if (isAnulado) {
    status = 'CRITICAL';
    badgeText = 'ANULADO';
  } else if (!expiry || expiry < now) {
    status = 'CRITICAL';
    badgeText = 'VENCIDO';
  } else {
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
    if (daysLeft === 0) { status = 'CRITICAL'; badgeText = 'VENCE HOY'; }
    else if (daysLeft <= 30) { status = 'WARNING'; badgeText = 'VENCE PRONTO'; }
  }
  let cert = soat.nro_poliza || soat.nro_certificado || '';
  if ((!cert || /^\d{1,3}$/.test(cert)) && api2?.soat?.Certificado) {
    cert = api2.soat.Certificado;
  }
  const usoPart = soat.uso ? ` Uso: ${soat.uso}.` : '';
  const estadoPart = isAnulado ? `ANULADO. ` : '';
  return { status, badgeText, text: `${estadoPart}${soat.compania}. Vigencia del ${soat.vigencia_desde} al ${soat.vigencia_hasta}. Certificado: ${cert}.${usoPart}`, expiryDate: hasta };
}

function isCitvNotRequired(text: string): boolean {
  return /no exigible|no obligat|no está obligad|no esta obligad|exento|no requiere|no aplica|aún no.{0,20}obligad/i.test(text);
}

function citvExpiryDays(api: ApiResponse, api2?: Api2Response | null): number | null {
  const hasta = api.revision_tecnica?.vigencia_hasta || api2?.citv?.fecha_vcto;
  if (!hasta) return null;
  const expiry = parseDate(hasta);
  if (!expiry) return null;
  const now = new Date();
  if (expiry < now) return -1;
  return Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
}

function buildRevisionTecnica(api: ApiResponse, citvCertificado?: string, api2?: Api2Response | null) {
  const srs = api.seguros_revision_siniestros;
  const citv = srs?.find(s => s.concepto === 'citv');
  if (citv) {
    const citvClean = cleanResultText(citv.resultado);
    const citvExtras: string[] = [];
    if (citvCertificado && !citvClean.includes(citvCertificado)) citvExtras.push(`Certificado: ${citvCertificado}`);
    if (api2?.citv?.tipo_servicio && !citvClean.toLowerCase().includes(api2.citv.tipo_servicio.toLowerCase())) citvExtras.push(`Uso: ${api2.citv.tipo_servicio}`);
    const citvSuffix = citvExtras.length ? ` ${citvExtras.join('. ')}.` : '';
    let status = semaforoToStatus(citv.semaforo);
    const lower = citv.resultado.toLowerCase();
    let badgeText = 'VIGENTE';
    if (status === 'CRITICAL') {
      if (lower.includes('sin registro')) { status = 'WARNING'; badgeText = 'SIN REGISTRO'; }
      else badgeText = 'VENCIDO';
    } else if (status === 'WARNING') badgeText = lower.includes('observ') ? 'CON OBSERV.' : 'VENCE PRONTO';
    else if (status === 'PENDING') {
      if (isCitvNotRequired(lower)) { status = 'OK'; badgeText = 'NO EXIGIBLE'; }
      else badgeText = 'NO CONSULTADO';
    } else if (status === 'OK') {
      const days = citvExpiryDays(api, api2);
      if (days === 0) { status = 'CRITICAL'; badgeText = 'VENCE HOY'; }
      else if (days !== null && days <= 30) { status = 'WARNING'; badgeText = 'VENCE PRONTO'; }
    }
    return { status, badgeText, text: citvClean + citvSuffix };
  }
  if (api.revision_tecnica) {
    const rt = api.revision_tecnica as { estado: string; semaforo: string; detalle?: string; vigencia_hasta?: string };
    const rtClean = cleanResultText(rt.detalle || rt.estado);
    const rtExtras: string[] = [];
    if (citvCertificado && !rtClean.includes(citvCertificado)) rtExtras.push(`Certificado: ${citvCertificado}`);
    if (api2?.citv?.tipo_servicio && !rtClean.toLowerCase().includes(api2.citv.tipo_servicio.toLowerCase())) rtExtras.push(`Uso: ${api2.citv.tipo_servicio}`);
    const rtSuffix = rtExtras.length ? ` ${rtExtras.join('. ')}.` : '';
    let status = semaforoToStatus(rt.semaforo);
    const lower = (rt.detalle || rt.estado).toLowerCase();
    let badgeText = 'VIGENTE';
    if (status === 'CRITICAL') {
      if (lower.includes('sin registro')) { status = 'WARNING'; badgeText = 'SIN REGISTRO'; }
      else badgeText = 'VENCIDO';
    } else if (status === 'WARNING') badgeText = lower.includes('observ') ? 'CON OBSERV.' : 'VENCE PRONTO';
    else if (status === 'OK') {
      const days = citvExpiryDays(api, api2);
      if (days === 0) { status = 'CRITICAL'; badgeText = 'VENCE HOY'; }
      else if (days !== null && days <= 30) { status = 'WARNING'; badgeText = 'VENCE PRONTO'; }
    }
    return { status, badgeText, text: rtClean + rtSuffix };
  }
  return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'Portal MTC no respondió.' };
}

function extractCount(text: string): number {
  const matches = [...text.matchAll(/(\d+)\s*(?:siniestro|accidente|activacion|activación)/gi)];
  if (matches.length === 0) return 0;
  return matches.reduce((sum, m) => sum + (parseInt(m[1], 10) || 0), 0);
}

function sumMontos(text: string): string | null {
  const matches = [...text.matchAll(/S\/\s*([\d,.]+)/g)];
  if (matches.length === 0) return null;
  const total = matches.reduce((sum, m) => {
    const num = parseFloat(m[1].replace(/,/g, ''));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
  return `S/ ${total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function debtStatusText(st: FieldStatus, text: string): string {
  if (st === 'OK') return 'OK';
  const total = sumMontos(text);
  if (st === 'WARNING') {
    if (total) return `${total} PENDIENTE`;
    if (/papeleta|infracción|infracci[oó]n|pendiente/i.test(text)) return 'PENDIENTE';
    return 'REVISAR';
  }
  return total ? `${total} PENDIENTE` : 'PENDIENTE';
}

function buildSiniestros(api: ApiResponse) {
  const srs = api.seguros_revision_siniestros;
  const sin = srs?.find(s => s.concepto === 'siniestros_soat');
  if (sin) {
    if (isErrorResult(sin.resultado)) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: cleanResultText(sin.resultado) };
    const count = extractCount(sin.resultado);
    const status: FieldStatus = count >= 3 ? 'CRITICAL' : count >= 1 ? 'WARNING' : 'OK';
    return { status, badgeText: count === 0 ? 'OK' : `${count} SINIESTRO${count !== 1 ? 'S' : ''}`, text: cleanResultText(sin.resultado) };
  }
  const soat = api.desglose_soat?.[0];
  if (soat) {
    const acc = parseInt(soat.nro_accidentes, 10) || 0;
    if (acc === 0) return { status: 'OK' as FieldStatus, badgeText: 'OK', text: '0 siniestros SOAT registrados.' };
    const status: FieldStatus = acc >= 3 ? 'CRITICAL' : 'WARNING';
    return { status, badgeText: `${acc} SINIESTRO${acc > 1 ? 'S' : ''}`, text: `${acc} siniestro${acc > 1 ? 's' : ''} SOAT registrado${acc > 1 ? 's' : ''}.` };
  }
  return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'SBS no respondió.' };
}

function buildActivacionesText(api: ApiResponse, api2?: Api2Response | null): string {
  const desglose = api.desglose_seguro_vehicular;
  if (desglose && desglose.length > 0) {
    const withAcc = desglose.filter(d => (parseInt(d.nro_accidentes || String(d.cantidad ?? '0'), 10) || 0) > 0);
    const total = desglose.reduce((s, d) => s + (parseInt(d.nro_accidentes || String(d.cantidad ?? '0'), 10) || 0), 0);
    if (total === 0) return '0 activaciones de seguro vehicular registradas.';
    // Build period map from api2 SBS data and desglose_soat as fallback sources
    const periodMap = new Map<string, string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sbsRaw = (api2 as any)?.['sbs-vehicular'] || (api2 as any)?.sbs_vehicular || (api2 as any)?.sbs;
    if (sbsRaw && Array.isArray(sbsRaw)) {
      for (const entry of sbsRaw) {
        const pol = entry.nro_poliza || entry.poliza || entry.numero_poliza || '';
        const desde = entry.vigencia_inicio || entry.vigencia_desde || entry.inicio || entry.Inicio || '';
        const hasta = entry.vigencia_fin || entry.vigencia_hasta || entry.fin || entry.Fin || '';
        if (pol && desde && hasta) periodMap.set(pol, `${desde} — ${hasta}`);
      }
    }
    for (const s of api.desglose_soat || []) {
      const cert = s.nro_poliza || s.nro_certificado || '';
      if (cert && !periodMap.has(cert) && s.vigencia_desde && s.vigencia_hasta) periodMap.set(cert, `${s.vigencia_desde} — ${s.vigencia_hasta}`);
    }
    const parts = withAcc.map(d => {
      const n = parseInt(d.nro_accidentes || String(d.cantidad ?? '0'), 10) || 0;
      const poliza = d.nro_poliza || 'S/N';
      const periodo = d.periodo
        || (d.vigencia_desde && d.vigencia_hasta ? `${d.vigencia_desde} — ${d.vigencia_hasta}` : '')
        || d.vigencia
        || (d.inicio && d.fin ? `${d.inicio} — ${d.fin}` : '')
        || (d.fecha_inicio && d.fecha_fin ? `${d.fecha_inicio} — ${d.fecha_fin}` : '')
        || periodMap.get(poliza)
        || 'periodo no disponible';
      return `${n} en póliza ${poliza} (${periodo})`;
    });
    return `${total} activacion${total !== 1 ? 'es' : ''} de seguro vehicular: ${parts.join(', ')}.`;
  }
  return '';
}

function buildActivaciones(api: ApiResponse, api2?: Api2Response | null) {
  const srs = api.seguros_revision_siniestros;
  const act = srs?.find(s => s.concepto === 'accidentes_seguro_vehicular');
  if (act) {
    if (isErrorResult(act.resultado)) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: cleanResultText(act.resultado) };
    let count = 0;
    if (api.desglose_seguro_vehicular?.length) {
      count = api.desglose_seguro_vehicular.reduce((sum, p) => sum + (parseInt(p.nro_accidentes || '0', 10) || 0), 0);
    }
    if (count === 0) count = extractCount(act.resultado);
    const status: FieldStatus = count >= 5 ? 'CRITICAL' : count >= 1 ? 'WARNING' : 'OK';
    const text = buildActivacionesText(api, api2) || cleanResultText(act.resultado).replace(/\bvigente teórica\b/gi, 'vigente');
    return { status, badgeText: count === 0 ? 'OK' : `${count} ACTIV.`, text };
  }
  return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'SBS no respondió.' };
}

function isGnvNoResult(text: string): boolean {
  return /sin resultados|no se encontr[óo] informaci[óo]n|no registra conversi[óo]n/i.test(text);
}

function buildGnv(api: ApiResponse) {
  const arr = api.conversion_gnv;
  if (arr && arr.length > 0) {
    const allGray = arr.every(g => g.semaforo === 'gris');
    const allNoResult = arr.every(g => g.semaforo === 'gris' || (isGnvNoResult(g.resultado) && !isErrorResult(g.resultado)));
    if (allGray || allNoResult) return { status: 'OK' as FieldStatus, badgeText: 'NO APLICA', text: 'Sin registro de conversión a GNV.' };
    const infogas = arr.find(g => g.concepto === 'infogas');
    const fise = arr.find(g => g.concepto === 'fise');
    const hasRed = arr.some(g => g.semaforo === 'rojo' && !isGnvNoResult(g.resultado));
    const hasYellow = arr.some(g => (g.semaforo === 'amarillo' || g.semaforo === 'ambar') && !isGnvNoResult(g.resultado));
    if (hasRed) return { status: 'CRITICAL' as FieldStatus, badgeText: 'REVISAR GNV', text: arr.map(g => g.resultado).join('. ') };
    if (hasYellow) return { status: 'WARNING' as FieldStatus, badgeText: 'REVISAR GNV', text: arr.map(g => g.resultado).join('. ') };
    if (infogas?.semaforo === 'verde') return { status: 'OK' as FieldStatus, badgeText: 'HABILITADO', text: arr.map(g => g.resultado).join('. ') };
    if (fise?.semaforo === 'verde') return { status: 'OK' as FieldStatus, badgeText: fise.resultado.toLowerCase().includes('recaudando') ? 'RECAUDANDO' : 'PAGADO', text: arr.map(g => g.resultado).join('. ') };
    return { status: 'OK' as FieldStatus, badgeText: 'OK', text: arr.map(g => g.resultado).join('. ') };
  }
  if (api.fuentes_consultadas?.some(f => f.toLowerCase().includes('infogas') || f.toLowerCase().includes('fise')))
    return { status: 'OK' as FieldStatus, badgeText: 'NO APLICA', text: 'No tiene conversión ni sistema GNV registrado.' };
  return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'InfoGas/FISE no respondió.' };
}

function buildTransportes(api: ApiResponse) {
  const v = api.vehiculo;
  const uso = v?.uso?.toLowerCase() || '';
  if (uso.includes('particular'))
    return { status: 'OK' as FieldStatus, badgeText: 'OK', text: `No pertenece a transporte público; uso particular (${v?.categoria || 'Cat. M'}).` };
  if (uso.includes('público') || uso.includes('servicio'))
    return { status: 'WARNING' as FieldStatus, badgeText: 'TRANSPORTE PUB.', text: `Registrado como ${v?.uso}.` };
  return { status: 'OK' as FieldStatus, badgeText: 'OK', text: 'Uso particular, sin pertenencia a transporte público.' };
}

function buildSoatBreakdown(api: ApiResponse, api2?: Api2Response | null) {
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  const desglose = api.desglose_soat || [];
  const historial = api2?.soat?.historial;

  if (historial && historial.length > 0) {
    const accMap = new Map<string, number>();
    for (const d of desglose) {
      const cert = d.nro_poliza || d.nro_certificado || '';
      if (cert) accMap.set(cert, parseInt(d.nro_accidentes, 10) || 0);
    }
    return historial
      .filter(h => {
        const inicio = parseDate(h.Inicio || '');
        return inicio && inicio >= fiveYearsAgo;
      })
      .sort((a, b) => {
        const da = parseDate(a.Inicio || '');
        const db = parseDate(b.Inicio || '');
        if (da && db) return db.getTime() - da.getTime();
        return 0;
      })
      .map(h => {
        const estadoLower = (h.Estado || '').toLowerCase();
        const vigente = estadoLower.includes('vigente');
        const anulado = /anulad[oa]/.test(estadoLower);
        const cert = h.Certificado || '';
        const acc = accMap.get(cert) || 0;
        return {
          compania: h['Compañía'] || '',
          uso: h.Uso || '',
          vigencia: `${h.Inicio || ''} — ${h.Fin || ''}`,
          certificado: cert,
          accidentes: acc,
          estado: anulado ? 'ANULADO' : vigente ? 'VIGENTE' : 'VENCIDO',
          status: (anulado ? 'CRITICAL' : vigente ? 'OK' : 'PENDING') as FieldStatus,
        };
      });
  }

  return desglose.map(d => {
    const acc = parseInt(d.nro_accidentes, 10) || 0;
    const estadoLower = (d.estado || '').toLowerCase();
    const vigente = estadoLower.includes('vigente');
    const anulado = /anulad[oa]/.test(estadoLower);
    return {
      compania: d.compania || '',
      uso: d.uso || '',
      vigencia: `${d.vigencia_desde} — ${d.vigencia_hasta}`,
      certificado: d.nro_poliza || d.nro_certificado || '',
      accidentes: acc,
      estado: anulado ? 'ANULADO' : vigente ? 'VIGENTE' : 'VENCIDO',
      status: (anulado ? 'CRITICAL' : vigente ? 'OK' : 'PENDING') as FieldStatus,
    };
  });
}

// === TABLE BUILDERS (detail sections) ===

function buildDebtsTable(api: ApiResponse, now: Date, api2?: Api2Response | null): TableEntry[] {
  const dmc = api.deudas_multas_capturas || [];
  const debts: TableEntry[] = [];

  const capturaData = buildCaptura(api);
  debts.push({
    concept: 'Orden de captura',
    entity: 'SAT Lima',
    result: capturaData.text,
    status: capturaData.status,
    statusText: capturaData.badgeText,
  });

  const sat = dmc.find(d => d.fuente === 'sat_lima');
  if (sat) {
    if (isErrorResult(sat.resultado)) {
      debts.push({ concept: 'Papeletas', entity: 'SAT Lima', result: cleanResultText(sat.resultado), status: 'PENDING', statusText: 'NO CONSULTADO' });
    } else {
      const st = semaforoToStatus(sat.semaforo);
      const papeletasPart = sat.resultado.split(/\.\s*Sin orden de captura/i)[0];
      debts.push({ concept: 'Papeletas', entity: 'SAT Lima', result: cleanResultText(papeletasPart), status: st, statusText: debtStatusText(st, sat.resultado) });
    }
  }

  const callao = dmc.find(d => d.fuente === 'mun_callao');
  if (callao) {
    if (isErrorResult(callao.resultado)) {
      debts.push({ concept: 'Papeletas', entity: 'Mun. del Callao', result: cleanResultText(callao.resultado), status: 'PENDING', statusText: 'NO CONSULTADO' });
    } else {
      const st = semaforoToStatus(callao.semaforo);
      debts.push({ concept: 'Papeletas', entity: 'Mun. del Callao', result: cleanResultText(callao.resultado), status: st, statusText: debtStatusText(st, callao.resultado) });
    }
  }

  const atu = dmc.find(d => d.fuente === 'atu');
  if (atu) {
    if (isErrorResult(atu.resultado)) {
      debts.push({ concept: 'Infracciones', entity: 'ATU', result: cleanResultText(atu.resultado), status: 'PENDING', statusText: 'NO CONSULTADO' });
    } else {
      const st = semaforoToStatus(atu.semaforo);
      debts.push({ concept: 'Infracciones', entity: 'ATU', result: cleanResultText(atu.resultado), status: st, statusText: debtStatusText(st, atu.resultado) });
    }
  }

  // Row 1: Récord de infracciones (from API 1 sutran_record)
  const sutran = dmc.find(d => d.fuente === 'sutran_record');
  if (sutran) {
    if (isErrorResult(sutran.resultado)) {
      debts.push({ concept: 'Récord de infracciones', entity: 'SUTRAN', result: cleanResultText(sutran.resultado), status: 'PENDING', statusText: 'NO CONSULTADO' });
    } else {
      const st = semaforoToStatus(sutran.semaforo);
      const papeletas = api2?.sutran?.papeletas;
      let recordText = cleanResultText(sutran.resultado);
      if (papeletas && papeletas.length > 0) {
        const parts = papeletas.map(p => {
          const pieces: string[] = [];
          if (p.numero) pieces.push(`papeleta de tránsito N.° ${p.numero}`);
          if (p.fecha) pieces.push(`del ${p.fecha}`);
          if (p.codigo) pieces.push(`código ${p.codigo}`);
          if (p.calificacion) pieces.push(`calificación **${p.calificacion}**`);
          return pieces.join(', ');
        });
        recordText = `Registra **${papeletas.length} documento${papeletas.length > 1 ? 's' : ''}**: ${parts.join('; ')}.`;
      }
      debts.push({ concept: 'Récord de infracciones', entity: 'SUTRAN', result: recordText, status: st, statusText: debtStatusText(st, sutran.resultado) });
    }
  }

  // Row 2: Verificación de la papeleta (from API 2 sutran.papeletas)
  const sutranApi2 = api2?.sutran;
  if (sutranApi2) {
    const papeletas = sutranApi2.papeletas;
    if (papeletas && papeletas.length > 0) {
      const details = papeletas.map(p => {
        const pieces: string[] = [];
        if (p.numero) pieces.push(`Papeleta ${p.numero}`);
        if (p.infractor) pieces.push(`infractor **${p.infractor}**`);
        if (p.monto) pieces.push(`monto S/ ${p.monto}`);
        if (p.pronto_pago) pieces.push(`pronto pago S/ ${p.pronto_pago}`);
        if (p.estado) pieces.push(`ESTADO: **${p.estado.toUpperCase()}**`);
        return pieces.join(', ');
      });
      const allPaid = papeletas.every(p => (p.estado || '').toLowerCase() === 'pagado');
      const hasPending = papeletas.some(p => (p.estado || '').toLowerCase() !== 'pagado');
      const verStatus: FieldStatus = allPaid ? 'OK' : hasPending ? 'WARNING' : 'OK';
      const verBadge = allPaid ? 'PAGADO' : 'PENDIENTE';
      debts.push({ concept: 'Verificación de la papeleta', entity: 'SUTRAN', result: details.join('. ') + '.', status: verStatus, statusText: verBadge });
    } else {
      const msg = sutranApi2.mensaje || 'Sin papeletas registradas';
      debts.push({ concept: 'Verificación de la papeleta', entity: 'SUTRAN', result: msg + '.', status: 'OK', statusText: 'OK' });
    }
  } else if (sutran) {
    debts.push({ concept: 'Verificación de la papeleta', entity: 'SUTRAN', result: 'No se pudo verificar detalle de papeletas.', status: 'PENDING', statusText: 'NO CONSULTADO' });
  }

  return debts;
}

function buildInsuranceTable(api: ApiResponse, citvCertificado?: string, api2?: Api2Response | null): TableEntry[] {
  const items: TableEntry[] = [];
  const srs = api.seguros_revision_siniestros || [];
  const soatDetail = api.desglose_soat?.[0];

  const soat = srs.find(s => s.concepto === 'soat');
  if (soat) {
    let st = semaforoToStatus(soat.semaforo);
    const soatAnulado = soatDetail && /anulad[oa]/i.test(soatDetail.estado || '');
    let soatStatusText = 'VIGENTE';
    if (soatAnulado) { st = 'CRITICAL'; soatStatusText = 'ANULADO'; }
    else if (st === 'CRITICAL') soatStatusText = 'VENCIDO';
    else if (st === 'WARNING') soatStatusText = 'VENCE PRONTO';
    else if (st === 'PENDING') soatStatusText = 'SIN REGISTRO';
    if (st === 'OK' && soatDetail) {
      const expiry = parseDate(soatDetail.vigencia_hasta);
      if (expiry) {
        const daysLeft = Math.ceil((expiry.getTime() - new Date().getTime()) / 86400000);
        if (daysLeft === 0) { st = 'CRITICAL'; soatStatusText = 'VENCE HOY'; }
        else if (daysLeft <= 30) { st = 'WARNING'; soatStatusText = 'VENCE PRONTO'; }
      }
    }
    let soatResult: string;
    let soatCert = soatDetail?.nro_poliza || soatDetail?.nro_certificado || '';
    if ((!soatCert || /^\d{1,3}$/.test(soatCert)) && api2?.soat?.Certificado) soatCert = api2.soat.Certificado;
    if (soatAnulado && soatDetail) {
      soatResult = `ANULADO — Póliza ${soatDetail.compania}, vigencia ${soatDetail.vigencia_desde} al ${soatDetail.vigencia_hasta}. El vehículo circula actualmente SIN SOAT vigente. Certificado: ${soatCert}.${soatDetail.uso ? ` Uso: ${soatDetail.uso}.` : ''}`;
    } else {
      soatResult = cleanResultText(soat.resultado);
      if (soatDetail) {
        const extras: string[] = [];
        if (soatCert && !soatResult.includes(soatCert)) extras.push(`Certificado: ${soatCert}`);
        if (soatDetail.uso) extras.push(`Uso: ${soatDetail.uso}`);
        if (extras.length) soatResult += ` ${extras.join('. ')}.`;
      }
    }
    items.push({
      concept: 'SOAT', entity: soatDetail ? `APESEG / ${soatDetail.compania}` : 'APESEG',
      result: soatResult, status: st, statusText: soatStatusText,
    });
  }

  const citvEntry = srs.find(s => s.concepto === 'citv');
  if (citvEntry) {
    let st = semaforoToStatus(citvEntry.semaforo);
    const citvLower = citvEntry.resultado.toLowerCase();
    let citvText = 'VIGENTE';
    if (st === 'CRITICAL') {
      if (citvLower.includes('sin registro')) { st = 'WARNING'; citvText = 'SIN REGISTRO'; }
      else citvText = 'VENCIDO';
    } else if (st === 'WARNING') citvText = citvLower.includes('observ') ? 'CON OBSERV.' : 'VENCE PRONTO';
    else if (st === 'PENDING') {
      if (isCitvNotRequired(citvLower)) { st = 'OK'; citvText = 'NO EXIGIBLE'; }
      else citvText = 'NO CONSULTADO';
    } else if (st === 'OK') {
      const days = citvExpiryDays(api, api2);
      if (days === 0) { st = 'CRITICAL'; citvText = 'VENCE HOY'; }
      else if (days !== null && days <= 30) { st = 'WARNING'; citvText = 'VENCE PRONTO'; }
    }
    const citvClean = cleanResultText(citvEntry.resultado);
    const citvExtras: string[] = [];
    if (citvCertificado && !citvClean.includes(citvCertificado)) citvExtras.push(`Certificado: ${citvCertificado}`);
    if (api2?.citv?.tipo_servicio && !citvClean.toLowerCase().includes(api2.citv.tipo_servicio.toLowerCase())) citvExtras.push(`Uso: ${api2.citv.tipo_servicio}`);
    const citvSuffix = citvExtras.length ? ` ${citvExtras.join('. ')}.` : '';
    items.push({
      concept: 'Revisión técnica (CITV)', entity: 'MTC',
      result: citvClean + citvSuffix, status: st, statusText: citvText,
    });
  }

  return items;
}

function buildClaimsTable(api: ApiResponse, api2?: Api2Response | null): TableEntry[] {
  const items: TableEntry[] = [];
  const srs = api.seguros_revision_siniestros || [];

  const sin = srs.find(s => s.concepto === 'siniestros_soat');
  if (sin) {
    if (isErrorResult(sin.resultado)) {
      items.push({ concept: 'Siniestros con cobertura SOAT', entity: 'SBS', result: cleanResultText(sin.resultado), status: 'PENDING', statusText: 'NO CONSULTADO' });
    } else {
      const count = extractCount(sin.resultado);
      const st: FieldStatus = count >= 3 ? 'CRITICAL' : count >= 1 ? 'WARNING' : 'OK';
      items.push({ concept: 'Siniestros con cobertura SOAT', entity: 'SBS', result: cleanResultText(sin.resultado), status: st, statusText: count === 0 ? 'OK' : `${count} SINIESTRO${count !== 1 ? 'S' : ''}` });
    }
  }

  const act = srs.find(s => s.concepto === 'accidentes_seguro_vehicular');
  if (act) {
    if (isErrorResult(act.resultado)) {
      items.push({ concept: 'Activaciones de seguro vehicular', entity: 'SBS', result: cleanResultText(act.resultado), status: 'PENDING', statusText: 'NO CONSULTADO' });
    } else {
      let count = 0;
      if (api.desglose_seguro_vehicular?.length) {
        count = api.desglose_seguro_vehicular.reduce((sum, p) => sum + (parseInt(p.nro_accidentes || '0', 10) || 0), 0);
      }
      if (count === 0) count = extractCount(act.resultado);
      const st: FieldStatus = count >= 5 ? 'CRITICAL' : count >= 1 ? 'WARNING' : 'OK';
      const actText = buildActivacionesText(api, api2) || cleanResultText(act.resultado).replace(/\bvigente teórica\b/gi, 'vigente');
      items.push({ concept: 'Activaciones de seguro vehicular', entity: 'SBS', result: actText, status: st, statusText: count === 0 ? 'OK' : `${count} ACTIV.` });
    }
  }

  return items;
}

const BOLD_PHRASES = [
  'no registra garantías mobiliarias, embargos ni cargas',
  'no registra garantías mobiliarias',
  'embargos ni cargas',
  'sin vigencia',
  'títulos pendientes',
  'actos ordinarios',
  'sucesión', 'anticipo de legítima', 'dación en pago', 'remate judicial', 'adjudicación',
  'garantía', 'embargo',
];

function boldKeyPhrases(text: string): string {
  if (!text) return text;
  const sorted = [...BOLD_PHRASES].sort((a, b) => b.length - a.length);
  let result = text;
  for (const phrase of sorted) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`(?<!\\*\\*)${escaped}(?!\\*\\*)`, 'gi'), '**$&**');
  }
  return result;
}

const CONCLUSION_BOLD = [
  'registral y tributaria limpia: sin gravámenes ni afectaciones',
  'registral y tributaria limpia',
  'sin gravámenes ni afectaciones',
  'impuesto vehicular al día',
  'sin papeletas ni orden de captura',
  'siniestros con cobertura SOAT',
  'SOAT no se encuentra vigente',
  'activaciones de seguro vehicular',
  'alta rotación de propietarios',
  'La decisión final es del cliente',
  'SAT Lima',
  'Mun. del Callao',
  'ATU',
  'SUTRAN',
  'SUNARP',
  'APESEG',
  'MTC',
  'SBS',
];

function boldConclusionText(text: string, code: string, plate?: string): string {
  if (!text) return text;
  const phrases = [...CONCLUSION_BOLD];
  if (code) phrases.push(code);
  if (plate) phrases.push(plate.toUpperCase());
  const sorted = phrases.sort((a, b) => b.length - a.length);
  let result = text;
  for (const phrase of sorted) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`(?<!\\*\\*)${escaped}(?!\\*\\*)`, 'gi'), '**$&**');
  }
  return result;
}

const NON_ORDINARY_ACTS = ['sucesión', 'sucesion', 'anticipo de legítima', 'anticipo de legitima', 'dación en pago', 'dacion en pago', 'remate judicial', 'adjudicación', 'adjudicacion'];
const LIEN_ACTS = ['constitución de garantía', 'constitucion de garantia', 'levantamiento de garantía', 'levantamiento de garantia', 'embargo', 'levantamiento de embargo'];

function buildRegistryNote(api: ApiResponse, api2?: Api2Response | null, finalCount?: number): { status: FieldStatus; title: string; detail: string } {
  const entries = api.asientos_registrales?.lista || [];
  const pendientes = api.asientos_registrales?.nota_titulos_pendientes || '';
  const pendLower = pendientes.toLowerCase();
  let hasPending = pendientes.length > 0
    && !pendLower.includes('no se identifican')
    && !pendLower.includes('no hay títulos pendientes')
    && !pendLower.includes('no hay titulos pendientes')
    && !pendLower.includes('sin títulos pendientes')
    && !pendLower.includes('sin titulos pendientes');

  // Cross-reference: if all título numbers mentioned in nota_titulos_pendientes
  // appear in inscribed entries, they're not actually pending
  if (hasPending) {
    const mentionedTitulos = pendientes.match(/\d{4}-\d{5,}/g) || [];
    const inscribedTitulos = new Set<string>();
    for (const e of entries) { if (e.titulo) inscribedTitulos.add(e.titulo); }
    const listaResTitulos = api2?.sunarp?.listaRes?.[0]?.titulos || [];
    for (const t of listaResTitulos) { if (t.num_titulo) inscribedTitulos.add(t.num_titulo); }
    if (mentionedTitulos.length > 0 && mentionedTitulos.every(t => inscribedTitulos.has(t))) {
      hasPending = false;
    }
    // Also: if api2 listaRes shows all titles accounted for, override
    if (hasPending && listaResTitulos.length > 0) {
      const histTitulos = (api.titularidad?.historial || []).map(h => (h.titulo || '').replace(/\s*\(asiento\s*\d+\)/gi, '').trim()).filter(Boolean);
      const allInscribed = histTitulos.every(t => inscribedTitulos.has(t));
      if (allInscribed && listaResTitulos.length >= entries.length) hasPending = false;
    }
  }

  const hasNonOrdinary = entries.some(e => NON_ORDINARY_ACTS.some(act => e.acto.toLowerCase().includes(act)));
  const hasHistoricalLien = entries.some(e => LIEN_ACTS.some(act => e.acto.toLowerCase().includes(act)));

  const sunarpCount = api2?.sunarp?.listaRes?.[0]?.titulos?.length || 0;
  const totalEntries = Math.max(finalCount || 0, sunarpCount, entries.length);
  const countNote = totalEntries > 0
    ? `Se registran ${totalEntries} asiento${totalEntries > 1 ? 's' : ''} inscrito${totalEntries > 1 ? 's' : ''}. `
    : '';

  if (hasPending) {
    const pendingLines = pendientes.split(/[,;.]/).map(s => s.trim()).filter(Boolean);
    const n = pendingLines.length || 1;
    return { status: 'WARNING', title: 'TÍTULO PENDIENTE', detail: `${countNote}Hay ${n} título${n > 1 ? 's' : ''} presentado${n > 1 ? 's' : ''} y aún no inscrito${n > 1 ? 's' : ''} a la fecha de consulta. Confirmar naturaleza y resultado antes de cerrar.` };
  }
  if (hasNonOrdinary) return { status: 'WARNING', title: 'ACTO NO ORDINARIO', detail: `${countNote}Al menos un asiento es sucesión, anticipo de legítima, dación en pago, remate judicial o adjudicación. Puede requerir documentación adicional.` };
  if (hasHistoricalLien) return { status: 'PENDING', title: 'CARGA HISTÓRICA', detail: `${countNote}Al menos un asiento registra constitución o levantamiento de garantía/embargo, ya resuelto (sin vigencia).` };
  return { status: 'OK', title: 'SIN PENDIENTES', detail: `${countNote}No hay títulos pendientes de inscripción y todos los asientos son actos ordinarios (1.ª inscripción + compraventas).` };
}

const STATUS_SEVERITY: Record<FieldStatus, number> = { CRITICAL: 3, WARNING: 2, PENDING: 1, OK: 0 };

function combinePapeletas(...sources: { status: FieldStatus; badgeText: string; text: string }[]) {
  const valid = sources.filter(s => s.status !== 'PENDING');
  if (valid.length === 0) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: sources[0].text };
  const worst = valid.reduce((a, b) => STATUS_SEVERITY[b.status] > STATUS_SEVERITY[a.status] ? b : a);
  if (worst.status === 'OK') return { status: 'OK' as FieldStatus, badgeText: 'OK', text: 'No presenta papeletas pendientes de pago.' };
  const withIssues = valid.filter(s => s.status !== 'OK');
  const names = withIssues.map(s => {
    const t = s.text.toLowerCase();
    if (t.includes('sat')) return 'SAT Lima';
    if (t.includes('callao')) return 'Mun. del Callao';
    if (t.includes('atu')) return 'ATU';
    return '';
  }).filter(Boolean);
  const label = names.length ? ` (${names.join(', ')})` : '';
  return { status: worst.status, badgeText: worst.badgeText, text: `Presenta papeletas pendientes de pago${label}. Ver detalle en sección Deudas.` };
}

export function transformApiResponse(api: ApiResponse, plate: string, api2?: Api2Response | null): LegalReportData {
  const now = toZonedTime(new Date(), 'America/Lima');
  const v = api.vehiculo;
  const comp = parseDatosComplementarios(v?.datos_complementarios_partida);
  const t0 = api2?.siguelo?.titulos?.[0] || api2?.sunarp?.siguelo?.titulos?.[0];
  const vehicleDescription = v ? `${v.marca} ${v.modelo} ${v.anio_modelo}` : plate;
  const hist = api.titularidad?.historial || [];

  const owner = buildOwnerHistory(api);
  const transfer = buildLastTransfer(api, api2);
  const grav = buildGravamenes(api);
  const captura = buildCaptura(api);
  const soat = buildSoat(api, api2);
  const citv = buildRevisionTecnica(api, api2?.citv?.certificado, api2);
  const impuesto = buildImpuesto(api, api2);
  const gnv = buildGnv(api);
  const satPap = buildPapeletas(api, 'sat_lima', 'papeletas SAT');
  const callaoPap = buildPapeletas(api, 'mun_callao', 'papeletas Callao');
  const atuPap = buildPapeletas(api, 'atu', 'papeletas ATU');
  const sutran = buildSutran(api);
  const transportes = buildTransportes(api);
  const siniestros = buildSiniestros(api);
  const activaciones = buildActivaciones(api, api2);

  const liensStatus = api.gravamenes ? semaforoToStatus(api.gravamenes.semaforo) : ('PENDING' as FieldStatus);
  let registryFinalCount = 0;

  const observations = (api.observaciones_analista || []).map(o =>
    typeof o === 'string' ? o : o.texto
  );

  const code = `VL-${plate.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

  return {
    plate: plate.toUpperCase(),
    emissionDate: format(now, "dd/MM/yyyy") + ' — ' + format(now, "hh:mm a"),
    code,
    vehicleDescription,

    fields: [
      { key: 'ownerHistory', label: 'Historial de propietarios', ...owner },
      { key: 'lastTransfer', label: 'Fecha última transferencia', ...transfer },
      { key: 'sunarpLiens', label: 'Gravámenes SUNARP / SIGM', ...grav },
      { key: 'satCaptureOrder', label: 'Orden de captura SAT', ...captura },
      { key: 'vehicleTax', label: 'Impuesto vehicular', ...impuesto },
      { key: 'satTickets', label: 'Papeletas SAT / Callao / ATU', ...combinePapeletas(satPap, callaoPap, atuPap) },
      { key: 'sutranTickets', label: 'Infracciones SUTRAN', ...sutran },
      { key: 'soat', label: 'SOAT', status: soat.status, badgeText: soat.badgeText, text: soat.text },
      { key: 'techReview', label: 'Revisión técnica (CITV)', status: citv.status, badgeText: citv.badgeText, text: citv.text },
      { key: 'siniestroSoat', label: 'Siniestros con cobertura SOAT', ...siniestros },
      { key: 'accidentHistory', label: 'Activaciones de seguro vehicular', ...activaciones },
      { key: 'gasConversion', label: 'Conversión a GNV', ...gnv },
      { key: 'transportRegistry', label: 'Registro de transportes', ...transportes },
    ],

    vehicleMain: v ? [
      { label: 'Placa', value: plate.toUpperCase() },
      { label: 'Tipo de uso', value: v.uso || '' },
      { label: 'Categoría', value: v.categoria || '' },
      { label: 'Carrocería', value: comp['Tipo Carrocería'] || comp['Tipo Carroceria'] || t0?.tipo_carroceria || '' },
      { label: 'Marca', value: v.marca || '' },
      { label: 'Modelo', value: v.modelo || '' },
      { label: 'N.° versión', value: comp['Nro. Versión'] || comp['Nro. Version'] || t0?.nro_version || '' },
      { label: 'Año de modelo', value: v.anio_modelo || '' },
      { label: 'Año de fabricación', value: v.anio_fabricacion && v.anio_fabricacion !== v.anio_modelo ? v.anio_fabricacion : '' },
      { label: 'N.° de serie', value: v.nro_serie || '' },
      { label: 'N.° de VIN', value: v.nro_vin || '' },
      { label: 'N.° de motor', value: v.nro_motor || '' },
      { label: 'Color', value: v.color || '' },
    ] : undefined,

    vehicleComplementary: v ? [
      { label: 'Combustible', value: v.combustible || '' },
      { label: 'Potencia motor', value: t0?.potencia_motor || comp['Potencia Motor'] || '' },
      { label: 'N.° de cilindros', value: t0?.nro_cilindros || comp['Nro. Cilindros'] || '' },
      { label: 'Cilindrada', value: t0?.cilindrada || comp['Cilindrada'] || '' },
      { label: 'N.° de asientos', value: t0?.nro_asientos || comp['Nro. Asientos'] || '' },
      { label: 'Fórmula rodante', value: t0?.formula_rodante || comp['Fórmula Rodante'] || comp['Formula Rodante'] || '' },
      { label: 'Peso neto / bruto', value: [t0?.peso_neto || comp['Peso Neto'], t0?.peso_bruto || comp['Peso Bruto']].filter(Boolean).join(' / ') },
      { label: 'Carga útil', value: t0?.carga_util || comp['Carga Util'] || '' },
      { label: 'Long. / Ancho / Alto', value: [t0?.longitud || comp['Longitud'], t0?.ancho || comp['Ancho'], t0?.altura || comp['Altura']].filter(Boolean).join(' / ') },
      { label: 'Inmatriculación', value: cleanDate((hist[0]?.fecha || '').replace(/\s*[—\-][\s\S]*/, '')) },
      { label: 'Adquisición titular actual', value: cleanDate((hist[hist.length - 1]?.fecha || '').replace(/\s*[—\-][\s\S]*/, '')) },
      { label: 'N.° de partida', value: [(comp['Partida'] || '').replace(/^N\.?[°º]\s*/i, ''), comp['Oficina Registral'] ? `— Of. ${comp['Oficina Registral']}` : ''].filter(Boolean).join(' ') },
    ] : undefined,

    owners: [...hist].sort((a, b) => {
      const da = parseDate((a.fecha || '').match(/\d{2}\/\d{2}\/\d{4}/)?.[0] || '');
      const db = parseDate((b.fecha || '').match(/\d{2}\/\d{2}\/\d{4}/)?.[0] || '');
      if (da && db) return da.getTime() - db.getTime();
      return 0;
    }).map((h, i, sorted) => {
      const isJuridica = /\b(S\.?A\.?C?\.?|E\.?I\.?R\.?L\.?|S\.?R\.?L\.?|S\.?A\.?|CORP|LLC|INC)\b/i.test(h.nombre);
      const isSociedad = !isJuridica && /\bY\b/.test(h.nombre) && h.nombre.split(/\bY\b/).length === 2;
      const nextFecha = i < sorted.length - 1 ? sorted[i + 1]?.fecha : undefined;
      return {
        number: i + 1,
        name: h.nombre,
        document: formatDocument(h.tipo_documento, h.documento),
        acquisitionDate: cleanDate(h.fecha),
        timeAsOwner: cleanTimeAsOwner(h.tiempo_como_propietario, h.fecha, nextFecha),
        price: h.precio,
        title: (() => {
          const raw = h.titulo || '';
          if (/\d{4}-\d{4,}/.test(raw)) return raw;
          const entry = api.asientos_registrales?.lista?.find(a =>
            a.acto.toLowerCase().includes('inscripci') && a.titulo && /\d{4}-\d{4,}/.test(a.titulo)
          );
          return entry?.titulo || raw;
        })(),
        tags: [
          i === 0 ? (isJuridica ? '1.ª inscripción · P. Jurídica' : '1.ª inscripción') : undefined,
          isSociedad ? 'Sociedad conyugal' : undefined,
          (h.estado === 'Titular vigente' || i === sorted.length - 1) ? 'Titular vigente' : undefined,
        ].filter(Boolean) as string[],
      };
    }),
    ownershipNote: api.titularidad?.nota_titular_vigente || '',

    registryEntries: (() => {
      const extractDate = (d: string) => (d || '').match(/\d{2}\/\d{2}\/\d{4}/)?.[0] || (d || '').trim();
      const getApellidos = (nombre: string) => {
        const cleaned = nombre.replace(/^\(?\s*sociedad\s+conyugal\s*\)?\s*[:|]?\s*/i, '').replace(/\|/g, ' ').trim();
        return cleaned.split(/\s+/).slice(0, 2).join(' ');
      };
      type Entry = { date: string; act: string; title: string };

      // API2-primary path: deterministic entries from siguelo + listaRes
      const sigTitulos = api2?.siguelo?.titulos || api2?.sunarp?.siguelo?.titulos || [];
      if (sigTitulos.length > 0) {
        // Detect shared títulos from listaRes duplicates AND siguelo duplicates
        const sharedTitles = new Set<string>();
        const lrCounts = new Map<string, number>();
        for (const t of (api2?.sunarp?.listaRes?.[0]?.titulos || [])) {
          const num = t.num_titulo || '';
          if (num) lrCounts.set(num, (lrCounts.get(num) || 0) + 1);
        }
        for (const [t, c] of lrCounts) { if (c > 1) sharedTitles.add(t); }
        const sigCounts = new Map<string, number>();
        for (const st of sigTitulos) {
          const t = String((st as Record<string, unknown>).num_titulo || '');
          if (t) sigCounts.set(t, (sigCounts.get(t) || 0) + 1);
        }
        for (const [t, c] of sigCounts) { if (c > 1) sharedTitles.add(t); }

        // Group siguelo entries by título — store both dates
        const sigByTitle = new Map<string, { apellidos: string; acto: string; fechaAsiento: string; fechaActo: string }[]>();
        for (const st of sigTitulos) {
          const rec = st as Record<string, unknown>;
          const titulo = String(rec.num_titulo || '');
          const nombre = String(rec.nombre || '');
          const mainName = (nombre.split('|').map(s => s.trim())[1] || nombre).trim();
          const apellidos = getApellidos(mainName);
          const acto = String(rec.acto_registral || '').replace(/Ã³/g, 'ó');
          const fechaAsiento = extractDate(String(rec.fecha_asiento || ''));
          const fechaActo = extractDate(String(rec.fecha || ''));
          if (!sigByTitle.has(titulo)) sigByTitle.set(titulo, []);
          sigByTitle.get(titulo)!.push({ apellidos, acto, fechaAsiento, fechaActo });
        }

        const entries: Entry[] = [];
        const processed = new Set<string>();

        for (const st of sigTitulos) {
          const titulo = String((st as Record<string, unknown>).num_titulo || '');
          if (processed.has(titulo)) continue;
          processed.add(titulo);
          const group = sigByTitle.get(titulo) || [];

          if (sharedTitles.has(titulo) && group.length >= 2) {
            // Media acta: 2 asientos por título, usar fechaActo para diferenciar
            const sorted = [...group].sort((a, b) => {
              const da = parseDate(a.fechaActo || a.fechaAsiento);
              const db = parseDate(b.fechaActo || b.fechaAsiento);
              if (da && db) return da.getTime() - db.getTime();
              return 0;
            });
            for (const s of sorted) {
              entries.push({ date: s.fechaActo || s.fechaAsiento, act: `${s.acto} (${s.apellidos})`, title: titulo });
            }
          } else {
            const g = group[0];
            const isPrimera = /primera\s*inscripci[oó]n/i.test(g.acto);
            const date = g.fechaAsiento || g.fechaActo;
            entries.push({ date, act: isPrimera ? g.acto : `${g.acto} (${g.apellidos})`, title: titulo });
          }
        }

        entries.sort((a, b) => {
          const da = parseDate(a.date);
          const db = parseDate(b.date);
          if (da && db) return da.getTime() - db.getTime();
          return 0;
        });
        registryFinalCount = entries.length;
        return entries.map((e, i) => ({ number: i + 1, date: e.date, act: e.act, title: e.title }));
      }

      // Fallback: api1-based logic (when api2 is unavailable)
      const baseTit = (t: string) => (t || '').replace(/\s*\(asiento\s*\d+\)/gi, '').trim();
      const apiEntries: (Entry & { asiento: string })[] = (api.asientos_registrales?.lista || []).map(a => {
        let act = a.acto;
        const aDate = extractDate(a.fecha);
        const ownerMatch = hist.find(h => extractDate(h.fecha) === aDate);
        if (ownerMatch && !/primera inscripci[oó]n/i.test(a.acto)) {
          const apellidos = getApellidos(ownerMatch.nombre);
          if (apellidos) act = `${a.acto} (${apellidos})`;
        }
        return { date: aDate, act, title: a.titulo, asiento: a.asiento };
      });
      for (const h of hist) {
        const apellidos = getApellidos(h.nombre);
        if (!apellidos) continue;
        if (apiEntries.some(e => e.act.includes(apellidos))) continue;
        const hTitle = baseTit(h.titulo);
        if (!hTitle) continue;
        const pair = apiEntries.find(e => e.title === hTitle);
        if (!pair || /primera inscripci[oó]n/i.test(pair.act)) continue;
        const idx = apiEntries.indexOf(pair);
        apiEntries.splice(idx + 1, 0, { date: extractDate(h.fecha), act: `Compra - Venta (${apellidos})`, title: hTitle, asiento: '' });
      }
      apiEntries.sort((a, b) => {
        const da = parseDate(a.date);
        const db = parseDate(b.date);
        if (da && db) return da.getTime() - db.getTime();
        return 0;
      });
      registryFinalCount = apiEntries.length;
      return apiEntries.map((e, i) => ({ number: i + 1, date: e.date, act: e.act, title: e.title }));
    })(),
    ...(() => { const r = buildRegistryNote(api, api2, registryFinalCount); return { registryNote: boldKeyPhrases(r.detail), registryNoteStatus: r.status as 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING', registryNoteTitle: r.title }; })(),

    liensStatus,
    liensTitle: liensStatus === 'OK'
      ? 'NO REGISTRA AFECTACIONES VIGENTES'
      : liensStatus === 'PENDING'
        ? 'NO SE PUDO CONSULTAR'
        : 'REGISTRA AFECTACIONES VIGENTES',
    liensDetail: liensStatus === 'OK'
      ? 'SUNARP y SIGM (Sistema Informativo de Garantías Mobiliarias) devuelve «No se han encontrado registros». Ninguno de los títulos inscritos en la partida corresponde a constitución de garantía, embargo u otra carga. El vehículo se encuentra libre para transferencia en este aspecto.'
      : liensStatus === 'PENDING'
        ? 'No se pudo completar la consulta a SUNARP / SIGM. Reintentar o verificar manualmente.'
        : boldKeyPhrases(api.gravamenes?.detalle || ''),
    liensSource: 'SUNARP · SIGM',

    taxYears: (() => {
      // api2 SAT is deterministic — prefer it as primary source for contributor/amount
      if (api2?.sat_tributos?.contribuyentes?.length) {
        const yearMap = new Map<string, { paid: number; unpaid: number; contributor: string }>();
        for (const c of api2.sat_tributos.contribuyentes) {
          for (const t of c.tributos || []) {
            const y = t['Año'] || t.anio || '';
            if (!y) continue;
            const entry = yearMap.get(y) || { paid: 0, unpaid: 0, contributor: '' };
            const pagado = parseFloat((t.Pagado || t.pagado || '0').replace(/,/g, ''));
            entry.paid += pagado;
            if (!entry.contributor) entry.contributor = c.nombre || '';
            const estado = (t.Estado || t.estado || '').toLowerCase();
            if (estado && !estado.includes('pagado')) entry.unpaid++;
            yearMap.set(y, entry);
          }
        }
        return Array.from(yearMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([year, info]) => ({
            year,
            contributor: info.contributor,
            amount: info.paid > 0 ? `S/ ${info.paid.toFixed(2)}` : '',
            status: (info.unpaid === 0 ? 'OK' : 'WARNING') as FieldStatus,
            statusText: info.unpaid === 0 ? 'PAGADO' : 'PENDIENTE',
          }));
      }
      const anios = api.impuesto_vehicular?.anios || [];
      if (anios.length === 0) return [];
      return anios.map(a => {
        const estado = (a.estado || '').toLowerCase();
        let status: FieldStatus = 'OK';
        let statusText = 'PAGADO';
        if (isErrorResult(a.estado || '')) { status = 'PENDING'; statusText = 'NO CONSULTADO'; }
        else if (a.semaforo === 'verde' || estado.includes('pagado')) { status = 'OK'; statusText = 'PAGADO'; }
        else if (estado.includes('no exigible')) { status = 'PENDING'; statusText = 'NO EXIGIBLE'; }
        else if (estado.includes('vencer')) { status = 'WARNING'; statusText = 'POR VENCER'; }
        else if (a.semaforo === 'gris' && !estado.includes('pendiente')) { status = 'PENDING'; statusText = 'SIN REGISTRO'; }
        else { status = 'WARNING'; statusText = 'PENDIENTE'; }
        return { year: a.anio, contributor: a.contribuyente || '', amount: a.monto || '', status, statusText };
      });
    })(),
    taxPendingSummary: (() => {
      const anios = api.impuesto_vehicular?.anios || [];
      const pendientes = anios.filter(a => a.semaforo !== 'verde' && a.semaforo !== 'gris');
      if (pendientes.length === 0) return undefined;
      const items = pendientes.map(a => {
        const monto = a.monto || '';
        return monto ? `${a.anio} (${monto})` : a.anio;
      });
      const montos = pendientes.map(a => parseFloat((a.monto || '0').replace(/[^0-9.,]/g, '').replace(',', '.')));
      const total = montos.reduce((s, m) => s + m, 0);
      const totalStr = total > 0 ? ` Total adeudado: S/ ${total.toFixed(2)}.` : '';
      return `${items.join(', ')}.${totalStr}`;
    })(),
    taxCriteria: (api.impuesto_vehicular?.criterio_aplicado || '').replace(/\s*\bJSON\b\s*/gi, ' ').replace(/[''`´']/g, '').replace(/,?\s*por lo que el resultado es \w+/gi, '').replace(/\.?\s*[Ee]l resultado es \w+/gi, '').replace(/\s{2,}/g, ' ').trim(),
    taxReminder: (() => {
      const anios = api.impuesto_vehicular?.anios || [];
      const allPaid = anios.length > 0 && anios.every(a => a.semaforo === 'verde');
      if (allPaid) return '';
      return api.impuesto_vehicular?.recordatorio || '**Requisito de transferencia:** el pago del impuesto vehicular es un requisito para la transferencia vehicular notarial. Cualquier deuda pendiente debe regularizarse antes de realizar la transferencia.';
    })(),
    taxSource: 'SAT — Lima',

    debts: buildDebtsTable(api, now, api2),
    debtsNote: 'Para cada papeleta se recomienda solicitar el **detalle por infracción**: código de falta (p. ej. M16, M10, G47), fecha, importe, gastos y **monto con descuento por pronto pago**. La consulta rápida suele entregar solo el total; el detalle se obtiene en el portal del SAT o de la municipalidad correspondiente.',
    debtsSource: 'SAT — Lima · Mun. del Callao · ATU · SUTRAN',

    insurance: buildInsuranceTable(api, api2?.citv?.certificado, api2),
    soatBreakdown: buildSoatBreakdown(api, api2),
    soatBreakdownNote: (() => {
      const soats = api.desglose_soat || [];
      if (soats.length === 0) return undefined;
      const totalAcc = soats.reduce((s, d) => s + (parseInt(d.nro_accidentes, 10) || 0), 0);
      return `Total de siniestros con cobertura SOAT: **${totalAcc}** en los últimos 5 años.`;
    })(),
    insuranceNote: 'La consulta APESEG refleja el estado del SOAT a la fecha de emisión; el certificado CITV proviene del registro de la entidad certificadora.',
    insuranceSource: 'APESEG · MTC — CITV',

    claims: buildClaimsTable(api, api2),
    activationsTable: (api.desglose_seguro_vehicular || [])
      .filter(d => (parseInt(d.nro_accidentes || String(d.cantidad ?? '0'), 10) || 0) > 0)
      .map(d => ({
        insurer: d.aseguradora || '',
        policyNumber: d.nro_poliza || '',
        period: d.periodo || '',
        count: parseInt(d.nro_accidentes || String(d.cantidad ?? '0'), 10) || 0,
      })),
    claimsNote: 'Nota: se distingue entre siniestros con cobertura SOAT (lesiones a personas) y activaciones de seguro vehicular (daños materiales atendidos por la poliza, generalmente eventos menores).',
    claimsSource: 'SBS',

    gnvItems: (api.conversion_gnv || []).map(g => {
      const st = semaforoToStatus(g.semaforo);
      let statusText = 'NO APLICA';
      const noResult = isGnvNoResult(g.resultado) && !isErrorResult(g.resultado);
      if (g.semaforo !== 'gris' && !noResult) {
        if (g.concepto === 'infogas') {
          statusText = st === 'OK' ? 'HABILITADO' : st === 'WARNING' ? 'REVISAR GNV' : st === 'CRITICAL' ? 'REVISAR GNV' : 'NO CONSULTADO';
        } else if (g.concepto === 'fise') {
          const lower = g.resultado.toLowerCase();
          if (st === 'OK') statusText = lower.includes('recaudando') ? 'RECAUDANDO' : 'PAGADO';
          else if (st === 'WARNING') statusText = 'RECAUDANDO';
          else statusText = 'NO CONSULTADO';
        } else {
          statusText = st === 'OK' ? 'OK' : 'REVISAR';
        }
      }
      return {
        concept: g.concepto === 'infogas' ? 'Conversión a GNV' : g.concepto === 'fise' ? 'Subsidio FISE' : g.concepto,
        entity: g.concepto === 'infogas' ? 'InfoGas' : g.concepto === 'fise' ? 'FISE' : g.concepto,
        result: noResult ? 'No registra conversión a GNV.' : cleanResultText(g.resultado),
        status: noResult ? 'OK' : st,
        statusText,
      };
    }),
    gnvSource: 'InfoGas · FISE',

    conclusionText: boldConclusionText(
      (() => {
        let txt = (api.conclusion?.texto || '')
          .replace(/\bANULADO\s+el\s+\d{1,2}\/\d{1,2}\/\d{4}/gi, 'ANULADO')
          .replace(/[^.]*\b(JNE|MTC[- ]?SCPPP)\b[^.]*\.\s*/gi, '');
        const actText = buildActivacionesText(api, api2);
        if (actText) {
          const m = actText.match(/^(\d+)\s+activacion/);
          const total = m ? parseInt(m[1]) : 0;
          const polCount = (actText.match(/póliza/g) || []).length;
          const conclusionAct = total > 0
            ? `Registra ${total} activacion${total !== 1 ? 'es' : ''} de seguro vehicular${polCount > 1 ? ` en ${polCount} pólizas` : ''}.`
            : actText;
          txt = txt.replace(/[^.]*\b(?:activacion|accidente)[^.]*(?:seguro vehicular|p[oó]liza)[^.]*\.\s*/gi, ' ' + conclusionAct + ' ');
        }
        const soatNote: Record<string, string> = {
          ANULADO: 'Sin embargo, el último SOAT contratado fue anulado, por lo que el vehículo circula actualmente sin SOAT; debe regularizarse antes de cualquier uso o transferencia.',
          VENCIDO: 'El SOAT se encuentra vencido; debe renovarse antes de cualquier uso o transferencia.',
          'VENCE HOY': 'El SOAT vence hoy; debe renovarse de inmediato para mantener la cobertura.',
          'VENCE PRONTO': `El SOAT se encuentra vigente pero próximo a vencer (${soat.expiryDate || ''}); se recomienda renovarlo con anticipación.`,
          VIGENTE: 'El SOAT se encuentra vigente.',
        };
        const soatMsg = soatNote[soat.badgeText];
        if (soatMsg) {
          txt = txt.replace(/\s*$/, ' ') + soatMsg;
        }
        return txt;
      })(),
      code,
      plate,
    ),
    disclaimer: `**Sobre este informe.** Documento elaborado por VERIFICARLO a partir de consultas a fuentes oficiales para el vehículo de placa ${plate.toUpperCase()}, emitido el ${format(now, "dd/MM/yyyy 'a las' HH:mm 'h'")}. La información registral proviene de copia informativa de SUNARP, que solo tiene fines informativos y no constituye publicidad registral ni reemplaza un certificado vigente para trámites. Los resultados de deudas, infracciones y vigencias corresponden a la fecha de consulta y pueden variar.`,

    // Backward compat
    inspectionId: 0,
    clientName: 'Consulta Express',
    date: format(now, "dd 'de' MMMM 'de' yyyy 'a las' HH:mm 'hrs'", { locale: es }),
    conclusion: api.conclusion ? { label: api.conclusion.etiqueta, text: api.conclusion.texto } : undefined,
    vehicleDetails: v ? { color: v.color, nroMotor: v.nro_motor, nroVin: v.nro_vin } : undefined,
    otherObservations: observations.join('\n'),
    screenshots: [],
    inspectorName: 'Sistema Automatizado',
    totalPages: 4,
    soatExpiryDate: soat.expiryDate || null,
    techReviewExpiryDate: null,
    lastTransferPrice: transfer.extraInfo ? transfer.extraInfo.replace('Monto: ', '') : null,
  };
}
