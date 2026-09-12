/**
 * Transforma la respuesta de la API Python (POST /informe/placa)
 * al formato LegalReportData para generar el PDF.
 */

import { type LegalReportData } from './LegalReportPDF';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';

// Tipos del JSON de la API Python
interface ApiResponse {
  conclusion?: {
    etiqueta: string;
    texto: string;
  };
  resumen_situacion_legal?: {
    concepto: string;
    resultado: string;
    semaforo: string;
  }[];
  vehiculo?: {
    marca: string;
    modelo: string;
    anio_modelo: string;
    color?: string;
    nro_motor?: string;
    nro_vin?: string;
  };
  titularidad?: {
    historial: {
      nombre: string;
      fecha: string;
      precio: string;
    }[];
    nota_titular_vigente?: string;
  };
  gravamenes?: {
    estado: string;
    semaforo: string;
    detalle: string;
  };
  impuesto_vehicular?: {
    anios: {
      anio: string;
      estado: string;
      semaforo: string;
    }[];
    criterio_aplicado?: string;
  };
  deudas_multas_capturas?: {
    fuente: string;
    resultado: string;
    semaforo: string;
  }[];
  desglose_soat?: {
    compania: string;
    vigencia_desde: string;
    vigencia_hasta: string;
    nro_certificado: string;
    nro_accidentes: string;
  }[];
  // Campos que la API podría agregar en el futuro
  revision_tecnica?: {
    estado: string;
    semaforo: string;
    detalle?: string;
    vigencia_hasta?: string;
  };
  siniestros_soat?: {
    cantidad: number;
    semaforo: string;
    detalle?: string;
  };
  activaciones_seguro?: {
    cantidad: number;
    semaforo: string;
    detalle?: string;
  };
  conversion_gnv?: {
    estado: string;
    semaforo: string;
    detalle?: string;
  };
  registro_transportes?: {
    estado: string;
    semaforo: string;
    detalle?: string;
  };
  observaciones_analista?: string[];
  fuentes_consultadas?: string[];
}

type FieldStatus = 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';

function semaforoToStatus(semaforo: string): FieldStatus {
  switch (semaforo) {
    case 'verde': return 'OK';
    case 'amarillo': return 'WARNING';
    case 'rojo': return 'CRITICAL';
    default: return 'PENDING';
  }
}

function findDeuda(deudas: ApiResponse['deudas_multas_capturas'], fuente: string) {
  return deudas?.find(d => d.fuente === fuente);
}

// Concepto 1: Historial de propietarios
function buildOwnerHistory(api: ApiResponse): { status: FieldStatus; badgeText: string; text: string } {
  const hist = api.titularidad?.historial;
  if (!hist) return { status: 'PENDING', badgeText: 'NO CONSULTADO', text: 'No se pudo consultar historial de propietarios.' };

  const count = hist.length;
  let status: FieldStatus;
  let badgeText: string;

  if (count === 1) {
    status = 'OK';
    badgeText = '1 TITULAR';
  } else if (count <= 3) {
    status = 'OK';
    badgeText = `${count} TITULARES`;
  } else if (count <= 14) {
    status = 'WARNING';
    badgeText = `${count} TITULARES`;
  } else {
    status = 'CRITICAL';
    badgeText = `${count} TITULARES`;
  }

  const nota = api.titularidad?.nota_titular_vigente || '';
  const text = `${count} propietario${count > 1 ? 's' : ''} registrado${count > 1 ? 's' : ''}. ${nota}`.trim();
  return { status, badgeText, text };
}

// Concepto 2: Última transferencia
function buildLastTransfer(api: ApiResponse): { status: FieldStatus; badgeText: string; text: string; extraInfo?: string } {
  const hist = api.titularidad?.historial;
  if (!hist || hist.length === 0) return { status: 'PENDING', badgeText: 'NO CONSULTADO', text: 'Sin datos de transferencia.' };

  const last = hist[hist.length - 1];
  return {
    status: 'OK',
    badgeText: 'SIN PROBLEMAS',
    text: `Compraventa registrada el ${last.fecha}.`,
    extraInfo: last.precio !== 'N/A' ? `Monto: ${last.precio}` : undefined,
  };
}

// Concepto 3: Gravámenes SUNARP
function buildGravamenes(api: ApiResponse): { status: FieldStatus; badgeText: string; text: string } {
  const g = api.gravamenes;
  if (!g) return { status: 'PENDING', badgeText: 'NO CONSULTADO', text: 'No se pudo consultar gravámenes.' };

  const status = semaforoToStatus(g.semaforo);
  let badgeText = 'LIBRE';
  if (status === 'CRITICAL') {
    const lower = g.estado.toLowerCase();
    if (lower.includes('embargo')) badgeText = 'EMBARGO';
    else if (lower.includes('medida') || lower.includes('cautelar')) badgeText = 'MEDIDA CAUTELAR';
    else badgeText = 'CON GRAVAMEN';
  } else if (status === 'WARNING') {
    badgeText = 'CON CARGA';
  }

  return { status, badgeText, text: g.detalle || g.estado };
}

// Concepto 4: Orden de captura SAT
function buildCaptura(api: ApiResponse): { status: FieldStatus; badgeText: string; text: string } {
  const d = findDeuda(api.deudas_multas_capturas, 'sat_captura') ?? findDeuda(api.deudas_multas_capturas, 'sat_lima');
  if (!d) {
    const captura = api.deudas_multas_capturas?.find(x => x.fuente.includes('captura'));
    if (!captura) return { status: 'PENDING', badgeText: 'NO CONSULTADO', text: 'No se pudo consultar orden de captura.' };
    return { status: semaforoToStatus(captura.semaforo), badgeText: captura.semaforo === 'verde' ? 'OK' : 'CON CAPTURA', text: captura.resultado };
  }
  const status = semaforoToStatus(d.semaforo);
  return { status, badgeText: status === 'OK' ? 'OK' : 'CON CAPTURA', text: d.resultado };
}

// Concepto 5: Impuesto vehicular
function buildImpuesto(api: ApiResponse): { status: FieldStatus; badgeText: string; text: string } {
  const imp = api.impuesto_vehicular;
  if (!imp) return { status: 'PENDING', badgeText: 'SIN REGISTRO', text: 'No se ubicó registro de pago.' };

  const pendientes = imp.anios.filter(a => a.semaforo !== 'verde');
  if (pendientes.length === 0) {
    return { status: 'OK', badgeText: 'PAGADO', text: `${imp.anios.length} años verificados. Deuda S/ 0.00.` };
  }
  const allRed = pendientes.every(a => a.semaforo === 'rojo');
  return {
    status: allRed ? 'CRITICAL' : 'WARNING',
    badgeText: allRed ? 'CON DEUDA' : 'PARCIAL',
    text: `${pendientes.length} año${pendientes.length > 1 ? 's' : ''} con deuda pendiente. ${imp.criterio_aplicado || ''}`.trim(),
  };
}

// Concepto 6: Papeletas SAT / Callao / ATU
function buildPapeletas(api: ApiResponse, fuente: string, label: string): { status: FieldStatus; badgeText: string; text: string } {
  const d = findDeuda(api.deudas_multas_capturas, fuente);
  if (!d) return { status: 'PENDING', badgeText: 'NO CONSULTADO', text: `No se pudo consultar ${label}.` };

  const status = semaforoToStatus(d.semaforo);
  let badgeText = 'OK';
  if (status === 'CRITICAL') {
    const match = d.resultado.match(/S\/\s*[\d,.]+/);
    badgeText = match ? `${match[0]} PENDIENTE` : 'CON DEUDA';
  } else if (status === 'WARNING') {
    badgeText = 'REVISAR';
  }
  return { status, badgeText, text: d.resultado };
}

// Concepto 7: SUTRAN
function buildSutran(api: ApiResponse): { status: FieldStatus; badgeText: string; text: string } {
  const d = findDeuda(api.deudas_multas_capturas, 'sutran_record') ?? findDeuda(api.deudas_multas_capturas, 'sutran');
  if (!d) return { status: 'PENDING', badgeText: 'NO CONSULTADO', text: 'No se pudo consultar SUTRAN.' };

  const status = semaforoToStatus(d.semaforo);
  let badgeText = 'OK';
  if (status === 'CRITICAL') badgeText = 'PENDIENTES';
  else if (status === 'WARNING') badgeText = 'REVISAR';
  return { status, badgeText, text: d.resultado };
}

// Concepto 8: SOAT
function buildSoat(api: ApiResponse): { status: FieldStatus; badgeText: string; text: string; expiryDate?: string } {
  const soat = api.desglose_soat?.[0];
  if (!soat) return { status: 'PENDING', badgeText: 'NO CONSULTADO', text: 'APESEG no respondió.' };

  const hasta = soat.vigencia_hasta;
  const now = new Date();
  const expiry = parseDate(hasta);
  let status: FieldStatus = 'OK';
  let badgeText = 'VIGENTE';

  if (!expiry || expiry < now) {
    status = 'CRITICAL';
    badgeText = 'NO VIGENTE';
  } else {
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30) {
      status = 'WARNING';
      badgeText = 'VENCE PRONTO';
    }
  }

  const text = `${soat.compania}. Vigente del ${soat.vigencia_desde} al ${soat.vigencia_hasta}. Certificado: ${soat.nro_certificado}. Accidentes: ${soat.nro_accidentes}.`;
  return { status, badgeText, text, expiryDate: hasta };
}

// Concepto 9: Revisión técnica
function buildRevisionTecnica(api: ApiResponse): { status: FieldStatus; badgeText: string; text: string; expiryDate?: string } {
  if (api.revision_tecnica) {
    const rt = api.revision_tecnica;
    const status = semaforoToStatus(rt.semaforo);
    let badgeText = 'VIGENTE';
    if (status === 'CRITICAL') badgeText = 'VENCIDO';
    else if (status === 'WARNING') badgeText = rt.detalle?.toLowerCase().includes('observ') ? 'CON OBSERV.' : 'VENCE PRONTO';
    return { status, badgeText, text: rt.detalle || rt.estado, expiryDate: rt.vigencia_hasta };
  }
  // ponytail: API no trae revision_tecnica todavía, marcar como no consultado
  return { status: 'PENDING', badgeText: 'NO CONSULTADO', text: 'Portal MTC no respondió.' };
}

// Concepto 10: Siniestros SOAT
function buildSiniestros(api: ApiResponse): { status: FieldStatus; badgeText: string; text: string } {
  if (api.siniestros_soat) {
    const s = api.siniestros_soat;
    const status = semaforoToStatus(s.semaforo);
    let badgeText = 'OK';
    if (s.cantidad >= 3) badgeText = `${s.cantidad} SINIESTROS`;
    else if (s.cantidad >= 1) badgeText = `${s.cantidad} SINIESTRO${s.cantidad > 1 ? 'S' : ''}`;
    return { status, badgeText, text: s.detalle || `${s.cantidad} siniestros registrados.` };
  }
  const soat = api.desglose_soat?.[0];
  if (soat) {
    const acc = parseInt(soat.nro_accidentes, 10) || 0;
    if (acc === 0) return { status: 'OK', badgeText: 'OK', text: '0 siniestros SOAT registrados.' };
    return {
      status: acc >= 3 ? 'CRITICAL' : 'WARNING',
      badgeText: `${acc} SINIESTRO${acc > 1 ? 'S' : ''}`,
      text: `${acc} siniestro${acc > 1 ? 's' : ''} SOAT registrado${acc > 1 ? 's' : ''}.`,
    };
  }
  return { status: 'PENDING', badgeText: 'NO CONSULTADO', text: 'SBS no respondió.' };
}

// Concepto 11: Activaciones de seguro
function buildActivaciones(api: ApiResponse): { status: FieldStatus; badgeText: string; text: string } {
  if (api.activaciones_seguro) {
    const a = api.activaciones_seguro;
    const status = semaforoToStatus(a.semaforo);
    let badgeText = 'OK';
    if (a.cantidad >= 5) badgeText = `${a.cantidad} ACTIV.`;
    else if (a.cantidad >= 1) badgeText = `${a.cantidad} ACTIV.`;
    return { status, badgeText, text: a.detalle || `${a.cantidad} activaciones registradas.` };
  }
  return { status: 'PENDING', badgeText: 'NO CONSULTADO', text: 'SBS no respondió.' };
}

// Concepto 12: Conversión GNV
function buildGnv(api: ApiResponse): { status: FieldStatus; badgeText: string; text: string } {
  if (api.conversion_gnv) {
    const g = api.conversion_gnv;
    const status = semaforoToStatus(g.semaforo);
    const lower = (g.estado || '').toLowerCase();
    let badgeText = 'NO APLICA';
    if (lower.includes('habilitado')) badgeText = 'HABILITADO';
    else if (lower.includes('pagado') || lower.includes('saldado')) badgeText = 'PAGADO';
    else if (lower.includes('recaudando')) badgeText = 'RECAUDANDO';
    else if (status === 'WARNING') badgeText = 'REVISAR GNV';
    return { status, badgeText, text: g.detalle || g.estado };
  }
  // Si fuentes_consultadas incluye infogas/fise, la API lo consultó pero no trajo nada → no aplica
  if (api.fuentes_consultadas?.some(f => f === 'infogas' || f === 'fise')) {
    return { status: 'OK', badgeText: 'NO APLICA', text: 'No tiene conversión ni sistema GNV registrado.' };
  }
  return { status: 'PENDING', badgeText: 'NO CONSULTADO', text: 'InfoGas/FISE no respondió.' };
}

// Concepto 13: Registro de transportes
function buildTransportes(api: ApiResponse): { status: FieldStatus; badgeText: string; text: string } {
  if (api.registro_transportes) {
    const r = api.registro_transportes;
    const status = semaforoToStatus(r.semaforo);
    return { status, badgeText: status === 'OK' ? 'OK' : 'TRANSPORTE PÚB.', text: r.detalle || r.estado };
  }
  return { status: 'OK', badgeText: 'OK', text: 'Uso particular, sin pertenencia a transporte público.' };
}

function parseDate(dateStr: string): Date | null {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

export function transformApiResponse(api: ApiResponse, plate: string): LegalReportData {
  const now = toZonedTime(new Date(), 'America/Lima');
  const v = api.vehiculo;
  const vehicleDescription = v ? `${v.marca} ${v.modelo} ${v.anio_modelo}` : plate;

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

  const observations = api.observaciones_analista?.length
    ? api.observaciones_analista.join('\n')
    : api.conclusion?.texto || '';

  return {
    inspectionId: 0,
    plate: plate.toUpperCase(),
    vehicleDescription,
    clientName: 'Consulta Express',
    date: format(now, "dd 'de' MMMM 'de' yyyy 'a las' HH:mm 'hrs'", { locale: es }),
    conclusion: api.conclusion ? { label: api.conclusion.etiqueta, text: api.conclusion.texto } : undefined,
    vehicleDetails: v ? { color: v.color, nroMotor: v.nro_motor, nroVin: v.nro_vin } : undefined,
    fields: [
      { key: 'ownerHistory', label: 'Historial de Propietarios', ...owner },
      { key: 'lastTransfer', label: 'Última Transferencia', ...transfer },
      { key: 'sunarpLiens', label: 'Gravámenes SUNARP', ...grav },
      { key: 'satCaptureOrder', label: 'Orden de Captura SAT', ...captura },
      { key: 'soat', label: 'SOAT', status: soat.status, badgeText: soat.badgeText, text: soat.text },
      { key: 'techReview', label: 'Revisión Técnica', status: citv.status, badgeText: citv.badgeText, text: citv.text },
      { key: 'vehicleTax', label: 'Impuesto Vehicular', ...impuesto },
      { key: 'gasConversion', label: 'Conversión a Gas', ...gnv },
      { key: 'satTickets', label: 'Papeletas SAT', ...satPap },
      { key: 'callaoTickets', label: 'Papeletas Callao', ...callaoPap },
      { key: 'atuTickets', label: 'Papeletas ATU', ...atuPap },
      { key: 'sutranTickets', label: 'Infracciones SUTRAN', ...sutran },
      { key: 'transportRegistry', label: 'Registro de Transportes', ...transportes },
      { key: 'siniestroSoat', label: 'Siniestros SOAT', ...siniestros },
      { key: 'accidentHistory', label: 'Activaciones de Seguro', ...activaciones },
    ],
    otherObservations: observations,
    screenshots: [],
    inspectorName: 'Sistema Automatizado',
    totalPages: 3,
    soatExpiryDate: soat.expiryDate || null,
    techReviewExpiryDate: citv.expiryDate || null,
    lastTransferPrice: transfer.extraInfo ? transfer.extraInfo.replace('Monto: ', '') : null,
  };
}
