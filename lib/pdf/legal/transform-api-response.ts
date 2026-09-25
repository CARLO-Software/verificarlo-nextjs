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
  desglose_seguro_vehicular?: { aseguradora?: string; nro_poliza?: string; periodo?: string; cantidad?: number }[];
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
  siguelo?: { titulos?: Record<string, any>[] };
  sunarp?: { siguelo?: { titulos?: Record<string, any>[] } };
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
    for (const key of knownKeys) {
      if (part.startsWith(key)) {
        const val = part.slice(key.length).trim().replace(/^\.?\s*/, '');
        if (val) result[key] = val;
        break;
      }
    }
  }
  return result;
}

function shortenTime(raw: string): string {
  if (!raw) return '';
  const y = raw.match(/(\d+)\s*año/i);
  const m = raw.match(/(\d+)\s*mes/i);
  const d = raw.match(/(\d+)\s*d[ií]a/i);
  const parts: string[] = [];
  if (y) parts.push(`${y[1]} año${y[1] === '1' ? '' : 's'}`);
  if (m) parts.push(`${m[1]} mes${m[1] === '1' ? '' : 'es'}`);
  if (!y && !m && d) parts.push(`${d[1]} día${d[1] === '1' ? '' : 's'}`);
  return parts.length > 0 ? parts.join(' ') : raw;
}

function parseDate(dateStr: string): Date | null {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

function findDeuda(deudas: ApiResponse['deudas_multas_capturas'], fuente: string) {
  return deudas?.find(d => d.fuente === fuente);
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
  const nota = api.titularidad?.nota_titular_vigente || '';
  return { status, badgeText, text: `${count} propietario${count > 1 ? 's' : ''} registrado${count > 1 ? 's' : ''}. ${nota}`.trim() };
}

function buildLastTransfer(api: ApiResponse, api2?: Api2Response | null) {
  const hist = api.titularidad?.historial;
  if (!hist?.length) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'Sin datos de transferencia.', extraInfo: undefined };
  const last = hist[hist.length - 1];
  let fecha = last.fecha || '';
  let precio = last.precio;
  if (!fecha && api2) {
    const titulos = api2.siguelo?.titulos || api2.sunarp?.siguelo?.titulos || [];
    const lastTitulo = titulos.filter(t => t.fecha).pop();
    if (lastTitulo) {
      fecha = lastTitulo.fecha;
      if ((!precio || precio === 'N/A') && lastTitulo.precio) precio = lastTitulo.precio;
    }
  }
  return {
    status: 'OK' as FieldStatus,
    badgeText: 'SIN PROBLEMAS',
    text: fecha ? `Compraventa registrada el ${fecha}.` : 'Compraventa registrada (fecha no disponible).',
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
  return { status, badgeText: status === 'OK' ? 'OK' : 'CON CAPTURA', text: cleanResultText(d.resultado) };
}

function buildImpuesto(api: ApiResponse, api2?: Api2Response | null) {
  const imp = api.impuesto_vehicular;
  const resumen = api.resumen_situacion_legal?.find(r => r.concepto.toLowerCase().includes('impuesto vehicular'));
  if (!imp) return { status: 'PENDING' as FieldStatus, badgeText: 'SIN REGISTRO', text: resumen?.resultado || 'No se ubicó registro de pago.' };
  if (imp.anios.length === 0 && api2?.sat_tributos?.contribuyentes?.length) {
    const allPaid = api2.sat_tributos.contribuyentes.every(c =>
      (c.tributos || []).every(t => (t.Estado || t.estado || '').toLowerCase().includes('pagado'))
    );
    return {
      status: (allPaid ? 'OK' : 'WARNING') as FieldStatus,
      badgeText: allPaid ? 'PAGADO' : 'PENDIENTE',
      text: resumen?.resultado || (allPaid ? 'Pagos verificados vía SAT Lima (fuente secundaria).' : 'Cuotas pendientes detectadas vía SAT Lima.'),
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
    text: resumen?.resultado || `${pendientes.length} año${pendientes.length > 1 ? 's' : ''} con deuda pendiente. ${imp.criterio_aplicado || ''}`.trim(),
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

function buildSoat(api: ApiResponse) {
  const soat = api.desglose_soat?.[0];
  if (!soat) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'APESEG no respondió.', expiryDate: undefined };
  const hasta = soat.vigencia_hasta;
  const expiry = parseDate(hasta);
  const now = new Date();
  let status: FieldStatus = 'OK';
  let badgeText = 'VIGENTE';
  if (!expiry || expiry < now) {
    status = 'CRITICAL';
    badgeText = 'VENCIDO';
  } else {
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
    if (daysLeft === 0) { status = 'CRITICAL'; badgeText = 'VENCE HOY'; }
    else if (daysLeft <= 30) { status = 'WARNING'; badgeText = 'VENCE PRONTO'; }
  }
  const usoPart = soat.uso ? ` Uso: ${soat.uso}.` : '';
  return { status, badgeText, text: `${soat.compania}. Vigente del ${soat.vigencia_desde} al ${soat.vigencia_hasta}. Certificado: ${soat.nro_certificado}.${usoPart}`, expiryDate: hasta };
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
  const citvExtras: string[] = [];
  if (citvCertificado) citvExtras.push(`Certificado: ${citvCertificado}`);
  if (api2?.citv?.tipo_servicio) citvExtras.push(`Uso: ${api2.citv.tipo_servicio}`);
  const citvSuffix = citvExtras.length ? ` ${citvExtras.join('. ')}.` : '';
  if (citv) {
    let status = semaforoToStatus(citv.semaforo);
    const lower = citv.resultado.toLowerCase();
    let badgeText = 'VIGENTE';
    if (status === 'CRITICAL') {
      if (lower.includes('sin registro')) { status = 'WARNING'; badgeText = 'SIN REGISTRO'; }
      else badgeText = 'VENCIDO';
    } else if (status === 'WARNING') badgeText = lower.includes('observ') ? 'CON OBSERV.' : 'VENCE PRONTO';
    else if (status === 'PENDING') {
      if (lower.includes('no exigible')) { status = 'OK'; badgeText = 'NO EXIGIBLE'; }
      else badgeText = 'NO CONSULTADO';
    } else if (status === 'OK') {
      const days = citvExpiryDays(api, api2);
      if (days === 0) { status = 'CRITICAL'; badgeText = 'VENCE HOY'; }
      else if (days !== null && days <= 30) { status = 'WARNING'; badgeText = 'VENCE PRONTO'; }
    }
    return { status, badgeText, text: cleanResultText(citv.resultado) + citvSuffix };
  }
  if (api.revision_tecnica) {
    const rt = api.revision_tecnica as { estado: string; semaforo: string; detalle?: string; vigencia_hasta?: string };
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
    return { status, badgeText, text: cleanResultText(rt.detalle || rt.estado) + citvSuffix };
  }
  return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'Portal MTC no respondió.' };
}

function extractCount(text: string): number {
  const match = text.match(/(\d+)\s*(?:siniestro|accidente|activacion|activación)/i);
  return match ? parseInt(match[1], 10) : 0;
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
  if (st === 'WARNING') return 'REVISAR';
  const total = sumMontos(text);
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

function buildActivaciones(api: ApiResponse) {
  const srs = api.seguros_revision_siniestros;
  const act = srs?.find(s => s.concepto === 'accidentes_seguro_vehicular');
  if (act) {
    if (isErrorResult(act.resultado)) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: cleanResultText(act.resultado) };
    const count = extractCount(act.resultado);
    const status: FieldStatus = count >= 5 ? 'CRITICAL' : count >= 1 ? 'WARNING' : 'OK';
    return { status, badgeText: count === 0 ? 'OK' : `${count} ACTIV.`, text: cleanResultText(act.resultado) };
  }
  return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'SBS no respondió.' };
}

function buildGnv(api: ApiResponse) {
  const arr = api.conversion_gnv;
  if (arr && arr.length > 0) {
    const allGray = arr.every(g => g.semaforo === 'gris');
    if (allGray) return { status: 'OK' as FieldStatus, badgeText: 'NO APLICA', text: 'Sin registro de conversión a GNV.' };
    const infogas = arr.find(g => g.concepto === 'infogas');
    const fise = arr.find(g => g.concepto === 'fise');
    const hasRed = arr.some(g => g.semaforo === 'rojo');
    const hasYellow = arr.some(g => g.semaforo === 'amarillo' || g.semaforo === 'ambar');
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
    let soatStatusText = 'VIGENTE';
    if (st === 'CRITICAL') soatStatusText = 'VENCIDO';
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
    let soatResult = cleanResultText(soat.resultado);
    if (soatDetail) {
      const extras: string[] = [];
      if (soatDetail.nro_certificado && !soatResult.includes(soatDetail.nro_certificado)) extras.push(`Certificado: ${soatDetail.nro_certificado}`);
      if (soatDetail.uso) extras.push(`Uso: ${soatDetail.uso}`);
      if (extras.length) soatResult += ` ${extras.join('. ')}.`;
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
      if (citvLower.includes('no exigible')) { st = 'OK'; citvText = 'NO EXIGIBLE'; }
      else citvText = 'NO CONSULTADO';
    } else if (st === 'OK') {
      const days = citvExpiryDays(api, api2);
      if (days === 0) { st = 'CRITICAL'; citvText = 'VENCE HOY'; }
      else if (days !== null && days <= 30) { st = 'WARNING'; citvText = 'VENCE PRONTO'; }
    }
    const citvExtras: string[] = [];
    if (citvCertificado) citvExtras.push(`Certificado: ${citvCertificado}`);
    if (api2?.citv?.tipo_servicio) citvExtras.push(`Uso: ${api2.citv.tipo_servicio}`);
    const citvSuffix = citvExtras.length ? ` ${citvExtras.join('. ')}.` : '';
    items.push({
      concept: 'Revision tecnica (CITV)', entity: 'MTC',
      result: cleanResultText(citvEntry.resultado) + citvSuffix, status: st, statusText: citvText,
    });
  }

  return items;
}

function buildClaimsTable(api: ApiResponse): TableEntry[] {
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
      const count = extractCount(act.resultado);
      const st: FieldStatus = count >= 5 ? 'CRITICAL' : count >= 1 ? 'WARNING' : 'OK';
      items.push({ concept: 'Activaciones de seguro vehicular', entity: 'SBS', result: cleanResultText(act.resultado), status: st, statusText: count === 0 ? 'OK' : `${count} ACTIV.` });
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
];

function boldConclusionText(text: string, code: string): string {
  if (!text) return text;
  const phrases = [...CONCLUSION_BOLD];
  if (code) phrases.push(code);
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

function buildRegistryNote(api: ApiResponse): { status: FieldStatus; title: string; detail: string } {
  const entries = api.asientos_registrales?.lista || [];
  const pendientes = api.asientos_registrales?.nota_titulos_pendientes || '';
  const hasPending = pendientes.length > 0;
  const hasNonOrdinary = entries.some(e => NON_ORDINARY_ACTS.some(act => e.acto.toLowerCase().includes(act)));
  const hasHistoricalLien = entries.some(e => LIEN_ACTS.some(act => e.acto.toLowerCase().includes(act)));

  const countNote = entries.length > 0
    ? `Se registran ${entries.length} asiento${entries.length > 1 ? 's' : ''} inscrito${entries.length > 1 ? 's' : ''}. `
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
  const texts = valid.map(s => s.text).filter(Boolean);
  return { status: worst.status, badgeText: worst.badgeText, text: texts.join(' ') };
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
  const soat = buildSoat(api);
  const citv = buildRevisionTecnica(api, api2?.citv?.certificado, api2);
  const impuesto = buildImpuesto(api, api2);
  const gnv = buildGnv(api);
  const satPap = buildPapeletas(api, 'sat_lima', 'papeletas SAT');
  const callaoPap = buildPapeletas(api, 'mun_callao', 'papeletas Callao');
  const atuPap = buildPapeletas(api, 'atu', 'papeletas ATU');
  const sutran = buildSutran(api);
  const transportes = buildTransportes(api);
  const siniestros = buildSiniestros(api);
  const activaciones = buildActivaciones(api);

  const liensStatus = api.gravamenes ? semaforoToStatus(api.gravamenes.semaforo) : ('PENDING' as FieldStatus);

  const observations = (api.observaciones_analista || []).map(o =>
    typeof o === 'string' ? o : o.texto
  );

  const code = `VL-${plate.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

  return {
    plate: plate.toUpperCase(),
    emissionDate: format(now, "dd/MM/yyyy") + ' — ' + format(now, "HH:mm 'h'"),
    code,
    vehicleDescription,

    fields: [
      { key: 'ownerHistory', label: 'Historial de propietarios', ...owner },
      { key: 'lastTransfer', label: 'Fecha ultima transferencia', ...transfer },
      { key: 'sunarpLiens', label: 'Gravamenes SUNARP / SIGM', ...grav },
      { key: 'satCaptureOrder', label: 'Orden de captura SAT', ...captura },
      { key: 'vehicleTax', label: 'Impuesto vehicular', ...impuesto },
      { key: 'satTickets', label: 'Papeletas SAT / Callao / ATU', ...combinePapeletas(satPap, callaoPap, atuPap) },
      { key: 'sutranTickets', label: 'Infracciones SUTRAN', ...sutran },
      { key: 'soat', label: 'SOAT', status: soat.status, badgeText: soat.badgeText, text: soat.text },
      { key: 'techReview', label: 'Revision tecnica (CITV)', status: citv.status, badgeText: citv.badgeText, text: citv.text },
      { key: 'siniestroSoat', label: 'Siniestros con cobertura SOAT', ...siniestros },
      { key: 'accidentHistory', label: 'Activaciones de seguro vehicular', ...activaciones },
      { key: 'gasConversion', label: 'Conversion a GNV', ...gnv },
      { key: 'transportRegistry', label: 'Registro de transportes', ...transportes },
    ],

    vehicleMain: v ? [
      { label: 'Placa', value: plate.toUpperCase() },
      { label: 'Tipo de uso', value: v.uso || '' },
      { label: 'Categoria', value: v.categoria || '' },
      { label: 'Carroceria', value: comp['Tipo Carrocería'] || comp['Tipo Carroceria'] || '' },
      { label: 'Marca', value: v.marca || '' },
      { label: 'Modelo', value: v.modelo || '' },
      { label: 'N.° version', value: comp['Nro. Versión'] || comp['Nro. Version'] || '' },
      { label: 'Año modelo / fabricacion', value: [v.anio_modelo, v.anio_fabricacion].filter(Boolean).join(' / ') },
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
      { label: 'Formula rodante', value: t0?.formula_rodante || comp['Fórmula Rodante'] || comp['Formula Rodante'] || '' },
      { label: 'Peso neto / bruto', value: [t0?.peso_neto || comp['Peso Neto'], t0?.peso_bruto || comp['Peso Bruto']].filter(Boolean).join(' / ') },
      { label: 'Carga util', value: t0?.carga_util || comp['Carga Util'] || '' },
      { label: 'Long. / Ancho / Alto', value: [t0?.longitud || comp['Longitud'], t0?.ancho || comp['Ancho'], t0?.altura || comp['Altura']].filter(Boolean).join(' / ') },
      { label: 'Inmatriculacion', value: hist[0]?.fecha || '' },
      { label: 'Adquisicion titular actual', value: hist[hist.length - 1]?.fecha || '' },
      { label: 'N.° de partida', value: [comp['Partida'], comp['Oficina Registral'] ? `— Of. ${comp['Oficina Registral']}` : ''].filter(Boolean).join(' ') },
    ] : undefined,

    owners: hist.map((h, i) => {
      const isJuridica = /\b(S\.?A\.?C?\.?|E\.?I\.?R\.?L\.?|S\.?R\.?L\.?|S\.?A\.?|CORP|LLC|INC)\b/i.test(h.nombre);
      const isSociedad = !isJuridica && /\bY\b/.test(h.nombre) && h.nombre.split(/\bY\b/).length === 2;
      return {
        number: i + 1,
        name: h.nombre,
        document: `${h.tipo_documento}\n${h.documento}`,
        acquisitionDate: h.fecha,
        timeAsOwner: shortenTime(h.tiempo_como_propietario),
        price: h.precio,
        title: h.titulo,
        tags: [
          i === 0 ? (isJuridica ? '1.ª inscripción · P. Jurídica' : '1.ª inscripción') : undefined,
          isSociedad ? 'Sociedad conyugal' : undefined,
          (h.estado === 'Titular vigente' || i === hist.length - 1) ? 'Titular vigente' : undefined,
        ].filter(Boolean) as string[],
      };
    }),
    ownershipNote: api.titularidad?.nota_titular_vigente || '',

    registryEntries: (() => {
      const apiEntries = (api.asientos_registrales?.lista || []).map(a => {
        let act = a.acto;
        const ownerMatch = hist.find(h => h.fecha === a.fecha);
        if (ownerMatch && !/primera inscripci[oó]n/i.test(a.acto)) {
          const parts = ownerMatch.nombre.split(/\s+/);
          const apellidos = parts.slice(0, 2).join(' ');
          if (apellidos) act = `${a.acto} (${apellidos})`;
        }
        return { date: a.fecha, act, title: a.titulo, asiento: a.asiento };
      });
      // Fill missing owners (media acta: same título, no matching asiento)
      for (const h of hist) {
        const hasEntry = apiEntries.some(e => e.title === h.titulo && e.date === h.fecha);
        if (!hasEntry && h.titulo) {
          const parts = h.nombre.split(/\s+/);
          const apellidos = parts.slice(0, 2).join(' ');
          // Insert after the entry with the same título
          const idx = apiEntries.findIndex(e => e.title === h.titulo);
          const entry = { date: h.fecha || apiEntries[idx]?.date || '', act: `Compraventa (${apellidos})`, title: h.titulo, asiento: apiEntries[idx]?.asiento || '' };
          if (idx >= 0) apiEntries.splice(idx + 1, 0, entry);
          else apiEntries.push(entry);
        }
      }
      return apiEntries.map((e, i) => ({ number: i + 1, date: e.date, act: e.act, title: e.title }));
    })(),
    registryNote: boldKeyPhrases(buildRegistryNote(api).detail),
    registryNoteStatus: buildRegistryNote(api).status as 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING',
    registryNoteTitle: buildRegistryNote(api).title,

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
      const anios = api.impuesto_vehicular?.anios || [];
      if (anios.length === 0) {
        if (!api2?.sat_tributos?.contribuyentes?.length) return [];
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
        let amount = a.monto || '';
        let contributor = a.contribuyente || '';
        if (api2?.sat_tributos?.contribuyentes) {
          let yearSum = 0;
          for (const c of api2.sat_tributos.contribuyentes) {
            if (!contributor) contributor = c.nombre || '';
            for (const t of c.tributos || []) {
              const tYear = t['Año'] || t.anio || '';
              if (tYear === a.anio) {
                if (!amount) yearSum += parseFloat((t.Pagado || t.pagado || '0').replace(/,/g, ''));
                if (!contributor) contributor = c.nombre || '';
              }
            }
          }
          if (!amount && yearSum > 0) amount = `S/ ${yearSum.toFixed(2)}`;
        }
        return { year: a.anio, contributor, amount, status, statusText };
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
    taxCriteria: api.impuesto_vehicular?.criterio_aplicado || '',
    taxReminder: api.impuesto_vehicular?.recordatorio || '**Requisito de transferencia:** el pago del impuesto vehicular es un requisito para la transferencia vehicular notarial. Cualquier deuda pendiente debe regularizarse antes de realizar la transferencia.',
    taxSource: 'SAT — Lima',

    debts: buildDebtsTable(api, now, api2),
    debtsNote: 'Para cada papeleta se recomienda solicitar el **detalle por infracción**: código de falta (p. ej. M16, M10, G47), fecha, importe, gastos y **monto con descuento por pronto pago**. La consulta rápida suele entregar solo el total; el detalle se obtiene en el portal del SAT o de la municipalidad correspondiente.',
    debtsSource: 'SAT — Lima · Mun. del Callao · ATU · SUTRAN',

    insurance: buildInsuranceTable(api, api2?.citv?.certificado, api2),
    soatBreakdown: (api.desglose_soat || []).map(d => {
      const acc = parseInt(d.nro_accidentes, 10) || 0;
      const vigente = (d.estado || '').toLowerCase().includes('vigente');
      return {
        compania: d.compania || '',
        uso: d.uso || '',
        vigencia: `${d.vigencia_desde} — ${d.vigencia_hasta}`,
        certificado: d.nro_poliza || d.nro_certificado || '',
        accidentes: acc,
        estado: vigente ? 'VIGENTE' : 'VENCIDO',
        status: (vigente ? 'OK' : 'PENDING') as FieldStatus,
      };
    }),
    soatBreakdownNote: (() => {
      const soats = api.desglose_soat || [];
      if (soats.length === 0) return undefined;
      const totalAcc = soats.reduce((s, d) => s + (parseInt(d.nro_accidentes, 10) || 0), 0);
      return `Total de siniestros con cobertura SOAT: **${totalAcc}** en los últimos 5 años.`;
    })(),
    insuranceNote: 'La consulta APESEG refleja el estado del SOAT a la fecha de emision; el certificado CITV proviene del registro de la entidad certificadora.',
    insuranceSource: 'APESEG · MTC — CITV',

    claims: buildClaimsTable(api),
    activationsTable: (api.desglose_soat || [])
      .filter(d => parseInt(d.nro_accidentes, 10) > 0)
      .map(d => {
        let period = '';
        if (d.vigencia) {
          const years = d.vigencia.match(/(\d{4})/g);
          if (years && years.length >= 2) period = `${years[0]}–${years[1]}`;
          else if (years) period = years[0];
        } else {
          const yFrom = d.vigencia_desde?.match(/(\d{4})/)?.[1];
          const yTo = d.vigencia_hasta?.match(/(\d{4})/)?.[1];
          if (yFrom && yTo) period = `${yFrom}–${yTo}`;
          else if (yFrom) period = yFrom;
        }
        return {
          insurer: d.compania || '',
          policyNumber: d.nro_poliza || d.nro_certificado || '',
          period,
          count: parseInt(d.nro_accidentes, 10) || 0,
        };
      }),
    claimsNote: 'Nota: se distingue entre siniestros con cobertura SOAT (lesiones a personas) y activaciones de seguro vehicular (daños materiales atendidos por la poliza, generalmente eventos menores).',
    claimsSource: 'SBS',

    gnvItems: (api.conversion_gnv || []).map(g => {
      const st = semaforoToStatus(g.semaforo);
      let statusText = 'NO APLICA';
      if (g.semaforo !== 'gris') {
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
        concept: g.concepto === 'infogas' ? 'Conversion a GNV' : g.concepto === 'fise' ? 'Subsidio FISE' : g.concepto,
        entity: g.concepto === 'infogas' ? 'InfoGas' : g.concepto === 'fise' ? 'FISE' : g.concepto,
        result: cleanResultText(g.resultado),
        status: st,
        statusText,
      };
    }),
    gnvSource: 'InfoGas · FISE',

    conclusionText: boldConclusionText(api.conclusion?.texto || '', code),
    disclaimer: `**Sobre este informe.** Documento elaborado por VERIFICARLO a partir de consultas a fuentes oficiales para el vehiculo de placa ${plate.toUpperCase()}, emitido el ${format(now, "dd/MM/yyyy 'a las' HH:mm 'h'")}. La informacion registral proviene de copia informativa de SUNARP, que solo tiene fines informativos y no constituye publicidad registral ni reemplaza un certificado vigente para tramites. Los resultados de deudas, infracciones y vigencias corresponden a la fecha de consulta y pueden variar.`,

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
