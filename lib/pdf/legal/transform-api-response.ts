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
    anios: { anio: string; estado: string; semaforo: string }[];
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
    .replace(/\s*\([^)]*=[^)]*\)/g, '')
    .replace(/\s*\([^)]*:\s*[^)]*=[^)]*\)/g, '')
    .replace(/\s*\w+:\s*\w+=\w+/g, '')
    .replace(/\.\s*\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
  // Improve common terse outputs
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

function buildLastTransfer(api: ApiResponse) {
  const hist = api.titularidad?.historial;
  if (!hist?.length) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'Sin datos de transferencia.', extraInfo: undefined };
  const last = hist[hist.length - 1];
  return {
    status: 'OK' as FieldStatus,
    badgeText: 'SIN PROBLEMAS',
    text: `Compraventa registrada el ${last.fecha}.`,
    extraInfo: last.precio !== 'N/A' ? `Monto: ${last.precio}` : undefined,
  };
}

function buildGravamenes(api: ApiResponse) {
  const g = api.gravamenes;
  if (!g) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'No se pudo consultar gravámenes.' };
  const status = semaforoToStatus(g.semaforo);
  let badgeText = 'LIBRE';
  if (status === 'CRITICAL') {
    const lower = g.estado.toLowerCase();
    if (lower.includes('embargo')) badgeText = 'EMBARGO';
    else if (lower.includes('medida') || lower.includes('cautelar')) badgeText = 'MEDIDA CAUTELAR';
    else badgeText = 'CON GRAVAMEN';
  } else if (status === 'WARNING') badgeText = 'CON CARGA';
  return { status, badgeText, text: g.detalle || g.estado };
}

function buildCaptura(api: ApiResponse) {
  const d = findDeuda(api.deudas_multas_capturas, 'sat_captura') ?? findDeuda(api.deudas_multas_capturas, 'sat_lima');
  if (!d) {
    const captura = api.deudas_multas_capturas?.find(x => x.fuente.includes('captura'));
    if (!captura) return { status: 'OK' as FieldStatus, badgeText: 'OK', text: 'No presenta orden de captura.' };
    return { status: semaforoToStatus(captura.semaforo), badgeText: captura.semaforo === 'verde' ? 'OK' : 'CON CAPTURA', text: cleanResultText(captura.resultado) };
  }
  const status = semaforoToStatus(d.semaforo);
  return { status, badgeText: status === 'OK' ? 'OK' : 'CON CAPTURA', text: cleanResultText(d.resultado) };
}

function buildImpuesto(api: ApiResponse) {
  const imp = api.impuesto_vehicular;
  if (!imp) return { status: 'PENDING' as FieldStatus, badgeText: 'SIN REGISTRO', text: 'No se ubicó registro de pago.' };
  const pendientes = imp.anios.filter(a => a.semaforo !== 'verde');
  if (pendientes.length === 0) return { status: 'OK' as FieldStatus, badgeText: 'PAGADO', text: `${imp.anios.length} año${imp.anios.length > 1 ? 's' : ''} verificado${imp.anios.length > 1 ? 's' : ''}. Deuda S/ 0.00.` };
  const allRed = pendientes.every(a => a.semaforo === 'rojo');
  return {
    status: (allRed ? 'CRITICAL' : 'WARNING') as FieldStatus,
    badgeText: allRed ? 'CON DEUDA' : 'PARCIAL',
    text: `${pendientes.length} año${pendientes.length > 1 ? 's' : ''} con deuda pendiente. ${imp.criterio_aplicado || ''}`.trim(),
  };
}

function buildPapeletas(api: ApiResponse, fuente: string, label: string) {
  const d = findDeuda(api.deudas_multas_capturas, fuente);
  if (!d) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: `No se pudo consultar ${label}.` };
  const status = semaforoToStatus(d.semaforo);
  let badgeText = 'OK';
  if (status === 'CRITICAL') {
    const match = d.resultado.match(/S\/\s*[\d,.]+/);
    badgeText = match ? `${match[0]} PENDIENTE` : 'CON DEUDA';
  } else if (status === 'WARNING') badgeText = 'REVISAR';
  return { status, badgeText, text: cleanResultText(d.resultado) };
}

function buildSutran(api: ApiResponse) {
  const d = findDeuda(api.deudas_multas_capturas, 'sutran_record') ?? findDeuda(api.deudas_multas_capturas, 'sutran');
  if (!d) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'No se pudo consultar SUTRAN.' };
  const status = semaforoToStatus(d.semaforo);
  return { status, badgeText: status === 'OK' ? 'OK' : status === 'WARNING' ? 'REVISAR' : 'PENDIENTES', text: cleanResultText(d.resultado) };
}

function buildSoat(api: ApiResponse) {
  const soat = api.desglose_soat?.[0];
  if (!soat) return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'APESEG no respondió.', expiryDate: undefined };
  const hasta = soat.vigencia_hasta;
  const expiry = parseDate(hasta);
  const now = new Date();
  let status: FieldStatus = 'OK';
  let badgeText = 'VIGENTE';
  if (!expiry || expiry < now) { status = 'CRITICAL'; badgeText = 'NO VIGENTE'; }
  else {
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
    if (daysLeft <= 30) { status = 'WARNING'; badgeText = 'VENCE PRONTO'; }
  }
  return { status, badgeText, text: `${soat.compania}. Vigente del ${soat.vigencia_desde} al ${soat.vigencia_hasta}. Certificado: ${soat.nro_certificado}.`, expiryDate: hasta };
}

function buildRevisionTecnica(api: ApiResponse) {
  const srs = api.seguros_revision_siniestros;
  const citv = srs?.find(s => s.concepto === 'citv');
  if (citv) {
    const status = semaforoToStatus(citv.semaforo);
    let badgeText = 'VIGENTE';
    if (status === 'CRITICAL') badgeText = 'VENCIDO';
    else if (status === 'WARNING') badgeText = 'VENCE PRONTO';
    else if (status === 'PENDING') badgeText = 'NO EXIGIBLE';
    return { status, badgeText, text: cleanResultText(citv.resultado) };
  }
  if (api.revision_tecnica) {
    const rt = api.revision_tecnica as { estado: string; semaforo: string; detalle?: string; vigencia_hasta?: string };
    const status = semaforoToStatus(rt.semaforo);
    let badgeText = 'VIGENTE';
    if (status === 'CRITICAL') badgeText = 'VENCIDO';
    else if (status === 'WARNING') badgeText = rt.detalle?.toLowerCase().includes('observ') ? 'CON OBSERV.' : 'VENCE PRONTO';
    return { status, badgeText, text: cleanResultText(rt.detalle || rt.estado) };
  }
  return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'Portal MTC no respondió.' };
}

function buildSiniestros(api: ApiResponse) {
  const srs = api.seguros_revision_siniestros;
  const sin = srs?.find(s => s.concepto === 'siniestros_soat');
  if (sin) {
    const status = semaforoToStatus(sin.semaforo);
    const match = sin.resultado.match(/(\d+)\s*(?:siniestro|accidente)/i);
    const count = match ? parseInt(match[1], 10) : 0;
    return { status, badgeText: status === 'OK' ? 'OK' : `${count} SINIESTRO${count !== 1 ? 'S' : ''}`, text: cleanResultText(sin.resultado) };
  }
  const soat = api.desglose_soat?.[0];
  if (soat) {
    const acc = parseInt(soat.nro_accidentes, 10) || 0;
    if (acc === 0) return { status: 'OK' as FieldStatus, badgeText: 'OK', text: '0 siniestros SOAT registrados.' };
    return { status: (acc >= 3 ? 'CRITICAL' : 'WARNING') as FieldStatus, badgeText: `${acc} SINIESTRO${acc > 1 ? 'S' : ''}`, text: `${acc} siniestro${acc > 1 ? 's' : ''} SOAT registrado${acc > 1 ? 's' : ''}.` };
  }
  return { status: 'PENDING' as FieldStatus, badgeText: 'NO CONSULTADO', text: 'SBS no respondió.' };
}

function buildActivaciones(api: ApiResponse) {
  const srs = api.seguros_revision_siniestros;
  const act = srs?.find(s => s.concepto === 'accidentes_seguro_vehicular');
  if (act) {
    const status = semaforoToStatus(act.semaforo);
    const match = act.resultado.match(/(\d+)\s*activacion/i);
    const count = match ? parseInt(match[1], 10) : 0;
    return { status, badgeText: status === 'OK' ? 'OK' : status === 'PENDING' ? 'SIN REGISTRO' : `${count} ACTIV.`, text: cleanResultText(act.resultado) };
  }
  return { status: 'PENDING' as FieldStatus, badgeText: 'SIN REGISTRO', text: 'SBS no respondió.' };
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

function buildDebtsTable(api: ApiResponse, now: Date): TableEntry[] {
  const dmc = api.deudas_multas_capturas || [];
  const debts: TableEntry[] = [];

  const captura = dmc.find(d => d.fuente.includes('captura'));
  let capturaResult = captura?.resultado;
  if (!capturaResult) {
    // Extract captura info from sat_lima combined result
    const satEntry = dmc.find(d => d.fuente === 'sat_lima');
    const capturaMatch = satEntry?.resultado.match(/Sin orden de captura[^.)]*/i);
    capturaResult = capturaMatch ? capturaMatch[0] : `No tiene orden de captura en la provincia de Lima (al ${format(now, 'dd/MM/yyyy')}).`;
  }
  debts.push({
    concept: 'Orden de captura',
    entity: 'SAT Lima',
    result: cleanResultText(capturaResult),
    status: captura ? semaforoToStatus(captura.semaforo) : 'OK',
    statusText: captura && captura.semaforo !== 'verde' ? 'CON CAPTURA' : 'OK',
  });

  const sat = dmc.find(d => d.fuente === 'sat_lima');
  if (sat) {
    const st = semaforoToStatus(sat.semaforo);
    const match = sat.resultado.match(/S\/\s*[\d,.]+/);
    // Extract only the papeletas part if the result combines papeletas + captura
    const papeletasPart = sat.resultado.split(/\.\s*Sin orden de captura/i)[0];
    debts.push({ concept: 'Papeletas', entity: 'SAT Lima', result: cleanResultText(papeletasPart), status: st, statusText: st === 'OK' ? 'OK' : st === 'WARNING' ? 'REVISAR' : match ? `${match[0]} PENDIENTE` : 'PENDIENTE' });
  }

  const callao = dmc.find(d => d.fuente === 'mun_callao');
  if (callao) {
    const st = semaforoToStatus(callao.semaforo);
    const match = callao.resultado.match(/S\/\s*[\d,.]+/);
    debts.push({ concept: 'Papeletas', entity: 'Mun. del Callao', result: cleanResultText(callao.resultado), status: st, statusText: st === 'OK' ? 'OK' : st === 'WARNING' ? 'REVISAR' : match ? `${match[0]} PENDIENTE` : 'PENDIENTE' });
  }

  const atu = dmc.find(d => d.fuente === 'atu');
  if (atu) {
    const st = semaforoToStatus(atu.semaforo);
    const match = atu.resultado.match(/S\/\s*[\d,.]+/);
    debts.push({ concept: 'Infracciones', entity: 'ATU', result: cleanResultText(atu.resultado), status: st, statusText: st === 'OK' ? 'OK' : st === 'WARNING' ? 'REVISAR' : match ? `${match[0]} PENDIENTE` : 'PENDIENTE' });
  }

  const sutran = dmc.find(d => d.fuente === 'sutran_record');
  if (sutran) {
    const st = semaforoToStatus(sutran.semaforo);
    const match = sutran.resultado.match(/S\/\s*[\d,.]+/);
    debts.push({ concept: 'Infracciones', entity: 'SUTRAN', result: cleanResultText(sutran.resultado), status: st, statusText: st === 'OK' ? 'OK' : st === 'WARNING' ? 'REVISAR' : match ? `${match[0]} PENDIENTE` : 'PENDIENTE' });
  }

  return debts;
}

function buildInsuranceTable(api: ApiResponse): TableEntry[] {
  const items: TableEntry[] = [];
  const srs = api.seguros_revision_siniestros || [];
  const soatDetail = api.desglose_soat?.[0];

  const soat = srs.find(s => s.concepto === 'soat');
  if (soat) {
    const st = semaforoToStatus(soat.semaforo);
    items.push({
      concept: 'SOAT', entity: soatDetail ? `APESEG / ${soatDetail.compania}` : 'APESEG',
      result: cleanResultText(soat.resultado), status: st,
      statusText: st === 'OK' ? 'VIGENTE' : st === 'WARNING' ? 'VENCE PRONTO' : st === 'CRITICAL' ? 'NO VIGENTE' : 'SIN REGISTRO',
    });
  }

  const citv = srs.find(s => s.concepto === 'citv');
  if (citv) {
    const st = semaforoToStatus(citv.semaforo);
    let citvText = 'VIGENTE';
    if (st === 'CRITICAL') citvText = citv.resultado.toLowerCase().includes('sin registro') ? 'SIN REGISTRO' : 'VENCIDO';
    else if (st === 'WARNING') citvText = citv.resultado.toLowerCase().includes('observ') ? 'CON OBSERV.' : 'VENCE PRONTO';
    else if (st === 'PENDING') citvText = citv.resultado.toLowerCase().includes('no exigible') ? 'NO EXIGIBLE' : 'NO CONSULTADO';
    items.push({
      concept: 'Revision tecnica (CITV)', entity: 'MTC',
      result: cleanResultText(citv.resultado), status: st, statusText: citvText,
    });
  }

  return items;
}

function buildClaimsTable(api: ApiResponse): TableEntry[] {
  const items: TableEntry[] = [];
  const srs = api.seguros_revision_siniestros || [];

  const sin = srs.find(s => s.concepto === 'siniestros_soat');
  if (sin) {
    const st = semaforoToStatus(sin.semaforo);
    items.push({ concept: 'Siniestros con cobertura SOAT', entity: 'SBS', result: cleanResultText(sin.resultado), status: st, statusText: st === 'OK' ? 'OK' : 'SINIESTROS' });
  }

  const act = srs.find(s => s.concepto === 'accidentes_seguro_vehicular');
  if (act) {
    const st = semaforoToStatus(act.semaforo);
    const match = act.resultado.match(/(\d+)\s*activacion/i);
    const count = match ? parseInt(match[1], 10) : 0;
    items.push({ concept: 'Activaciones de seguro vehicular', entity: 'SBS', result: cleanResultText(act.resultado), status: st, statusText: st === 'OK' ? 'OK' : st === 'PENDING' ? 'SIN REGISTRO' : `${count} ACTIV.` });
  }

  return items;
}

const NON_ORDINARY_ACTS = ['sucesión', 'sucesion', 'anticipo de legítima', 'anticipo de legitima', 'dación en pago', 'dacion en pago', 'remate judicial', 'adjudicación', 'adjudicacion'];
const LIEN_ACTS = ['constitución de garantía', 'constitucion de garantia', 'levantamiento de garantía', 'levantamiento de garantia', 'embargo', 'levantamiento de embargo'];

function buildRegistryNote(api: ApiResponse): { status: FieldStatus; title: string; detail: string } {
  const entries = api.asientos_registrales?.lista || [];
  const pendientes = api.asientos_registrales?.nota_titulos_pendientes || '';
  const hasPending = pendientes.length > 0;
  const hasNonOrdinary = entries.some(e => NON_ORDINARY_ACTS.some(act => e.acto.toLowerCase().includes(act)));
  const hasHistoricalLien = entries.some(e => LIEN_ACTS.some(act => e.acto.toLowerCase().includes(act)));

  if (hasPending) return { status: 'WARNING', title: 'TÍTULO PENDIENTE', detail: pendientes };
  if (hasNonOrdinary) return { status: 'WARNING', title: 'ACTO NO ORDINARIO', detail: 'Al menos un asiento es sucesión, anticipo de legítima, dación en pago, remate judicial o adjudicación. Puede requerir documentación adicional.' };
  if (hasHistoricalLien) return { status: 'WARNING', title: 'CARGA HISTÓRICA', detail: 'Al menos un asiento registra constitución o levantamiento de garantía/embargo, ya resuelto (sin vigencia).' };
  return { status: 'OK', title: 'SIN PENDIENTES', detail: 'No hay títulos pendientes de inscripción y todos los asientos son actos ordinarios.' };
}

export function transformApiResponse(api: ApiResponse, plate: string): LegalReportData {
  const now = toZonedTime(new Date(), 'America/Lima');
  const v = api.vehiculo;
  const comp = parseDatosComplementarios(v?.datos_complementarios_partida);
  const vehicleDescription = v ? `${v.marca} ${v.modelo} ${v.anio_modelo}` : plate;
  const hist = api.titularidad?.historial || [];

  const owner = buildOwnerHistory(api);
  const transfer = buildLastTransfer(api);
  const grav = buildGravamenes(api);
  const captura = buildCaptura(api);
  const soat = buildSoat(api);
  const citv = buildRevisionTecnica(api);
  const impuesto = buildImpuesto(api);
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
      { key: 'satTickets', label: 'Papeletas SAT / Callao / ATU', ...satPap },
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
      { label: 'Potencia motor', value: comp['Potencia Motor'] || '' },
      { label: 'N.° de cilindros', value: comp['Nro. Cilindros'] || '' },
      { label: 'Cilindrada', value: comp['Cilindrada'] || '' },
      { label: 'N.° de asientos', value: comp['Nro. Asientos'] || '' },
      { label: 'Formula rodante', value: comp['Fórmula Rodante'] || comp['Formula Rodante'] || '' },
      { label: 'Peso neto / bruto', value: [comp['Peso Neto'], comp['Peso Bruto']].filter(Boolean).join(' / ') },
      { label: 'Carga util', value: comp['Carga Util'] || '' },
      { label: 'Long. / Ancho / Alto', value: [comp['Longitud'], comp['Ancho'], comp['Altura']].filter(Boolean).join(' / ') },
      { label: 'Inmatriculacion', value: hist[0]?.fecha || '' },
      { label: 'Adquisicion titular actual', value: hist[hist.length - 1]?.fecha || '' },
      { label: 'N.° de partida', value: [comp['Partida'], comp['Oficina Registral'] ? `— Of. ${comp['Oficina Registral']}` : ''].filter(Boolean).join(' ') },
    ] : undefined,

    owners: hist.map((h, i) => {
      const isSociedad = /\bY\b/.test(h.nombre) && h.nombre.split(/\bY\b/).length === 2;
      return {
        number: i + 1,
        name: h.nombre,
        document: `${h.tipo_documento} ${h.documento}`,
        acquisitionDate: h.fecha,
        timeAsOwner: h.tiempo_como_propietario,
        price: h.precio,
        title: h.titulo,
        tags: [
          i === 0 ? '1.ª inscripcion' : undefined,
          isSociedad ? 'Sociedad conyugal' : undefined,
          h.estado === 'Titular vigente' ? 'Titular vigente' : undefined,
        ].filter(Boolean) as string[],
      };
    }),
    ownershipNote: api.titularidad?.nota_titular_vigente || '',

    registryEntries: (api.asientos_registrales?.lista || []).map((a, i) => {
      let act = a.acto;
      const ownerMatch = hist.find(h => h.fecha === a.fecha);
      if (ownerMatch) {
        const parts = ownerMatch.nombre.split(/\s+/);
        const apellidos = parts.slice(0, 2).join(' ');
        if (apellidos) act = `${a.acto} (${apellidos})`;
      }
      return { number: i + 1, date: a.fecha, act, title: a.titulo };
    }),
    registryNote: buildRegistryNote(api).detail,
    registryNoteStatus: buildRegistryNote(api).status as 'OK' | 'WARNING' | 'CRITICAL',
    registryNoteTitle: buildRegistryNote(api).title,

    liensStatus,
    liensTitle: liensStatus === 'OK' || liensStatus === 'PENDING'
      ? 'NO REGISTRA AFECTACIONES VIGENTES'
      : 'REGISTRA AFECTACIONES VIGENTES',
    liensDetail: api.gravamenes?.detalle || '',
    liensSource: 'SUNARP · SIGM',

    taxYears: (api.impuesto_vehicular?.anios || []).map(a => {
      const st = semaforoToStatus(a.semaforo);
      const estado = (a.estado || '').toLowerCase();
      let statusText = 'PAGADO';
      if (st === 'CRITICAL') statusText = 'PENDIENTE';
      else if (st === 'WARNING') statusText = estado.includes('vencer') ? 'POR VENCER' : 'PENDIENTE';
      else if (st === 'PENDING') statusText = estado.includes('no exigible') ? 'NO EXIGIBLE' : 'SIN REGISTRO';
      return { year: a.anio, contributor: '', amount: '', status: st, statusText };
    }),
    taxCriteria: api.impuesto_vehicular?.criterio_aplicado || '',
    taxReminder: api.impuesto_vehicular?.recordatorio || 'Requisito de transferencia: el pago del impuesto vehicular es un requisito para la transferencia vehicular notarial. Cualquier deuda pendiente debe regularizarse antes de realizar la transferencia.',
    taxSource: 'SAT — Lima',

    debts: buildDebtsTable(api, now),
    debtsNote: 'Para cada papeleta se recomienda solicitar el detalle por infraccion: codigo de falta, fecha, importe, gastos y monto con descuento por pronto pago.',
    debtsSource: 'SAT — Lima · Mun. del Callao · ATU · SUTRAN',

    insurance: buildInsuranceTable(api),
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

    conclusionText: api.conclusion?.texto || '',
    disclaimer: `Sobre este informe. Documento elaborado por VERIFICARLO a partir de consultas a fuentes oficiales para el vehiculo de placa ${plate.toUpperCase()}, emitido el ${format(now, "dd/MM/yyyy 'a las' HH:mm 'h'")}. La informacion registral proviene de copia informativa de SUNARP, que solo tiene fines informativos y no constituye publicidad registral ni reemplaza un certificado vigente para tramites. Los resultados de deudas, infracciones y vigencias corresponden a la fecha de consulta y pueden variar.`,

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
