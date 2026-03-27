/**
 * Definición de las fuentes legales a capturar
 * Este archivo es compartido entre cliente y servidor
 */

export const LEGAL_SOURCES = [
  {
    id: 'sunarp_copia',
    name: 'SUNARP - Copia Informativa',
    description: 'Datos del propietario y características del vehículo',
    url: 'https://www.sunarp.gob.pe',
    required: true,
  },
  {
    id: 'sunarp_asientos',
    name: 'SUNARP - Lista de Asientos',
    description: 'Historial de inscripciones y transferencias',
    url: 'https://www.sunarp.gob.pe',
    required: true,
  },
  {
    id: 'sat_tributos',
    name: 'SAT Lima - Estado de Tributos',
    description: 'Deudas de impuesto vehicular',
    url: 'https://www.sat.gob.pe',
    required: true,
  },
  {
    id: 'sat_papeletas',
    name: 'SAT Lima - Papeletas',
    description: 'Infracciones de tránsito pendientes',
    url: 'https://www.sat.gob.pe',
    required: true,
  },
  {
    id: 'sat_captura',
    name: 'SAT Lima - Captura Vehicular',
    description: 'Verificar si tiene orden de captura',
    url: 'https://www.sat.gob.pe',
    required: true,
  },
  {
    id: 'mtc_revision',
    name: 'MTC - Revisión Técnica',
    description: 'Certificados de revisión técnica',
    url: 'https://portal.mtc.gob.pe',
    required: true,
  },
  {
    id: 'sutran_infracciones',
    name: 'SUTRAN - Infracciones',
    description: 'Infracciones en carreteras nacionales',
    url: 'https://www.sutran.gob.pe',
    required: false,
  },
  {
    id: 'apeseg_seguro',
    name: 'APESEG - Reporte Seguro',
    description: 'Historial de siniestralidad',
    url: 'https://www.apeseg.org.pe',
    required: false,
  },
  {
    id: 'soat_consulta',
    name: 'SOAT - Consulta',
    description: 'Vigencia del SOAT',
    url: 'https://www.soat.com.pe',
    required: true,
  },
  {
    id: 'infogas_estado',
    name: 'InfoGas - Estado GNV/GLP',
    description: 'Conversión a gas (si aplica)',
    url: 'https://www.infogas.com.pe',
    required: false,
  },
] as const;

export type LegalSourceId = typeof LEGAL_SOURCES[number]['id'];
