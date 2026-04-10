/**
 * Definición de las fuentes legales a capturar
 * Estructura jerárquica: Categorías padre -> Fuentes hijo
 * Este archivo es compartido entre cliente y servidor
 */

export interface LegalSource {
  id: string;
  name: string;
  description: string;
  url: string;
  required: boolean;
  tooltip?: string;
  maxImages?: number; // Número máximo de imágenes permitidas (default: 1)
}

export interface LegalCategory {
  id: string;
  name: string; // Nombre de la categoría padre
  section: 'legal' | 'infractions'; // "Documentación Legal" o "Infracciones y registros"
  sources: LegalSource[];
}

export const LEGAL_CATEGORIES: LegalCategory[] = [
  // ====== DOCUMENTACIÓN LEGAL ======
  {
    id: 'historial_propietarios',
    name: 'Historial de Propietarios',
    section: 'legal',
    sources: [
      {
        id: 'sunarp',
        name: 'SUNARP',
        description: 'Obtener los números de títulos, para saber el historial de propietarios, fecha de compra. Ver si tiene gravamen o modificaciones (cambio de motor/gas, etc)',
        url: 'https://sprl.sunarp.gob.pe/sprl/main/partidas-base-grafica-registral',
        required: true,
        maxImages: 5,
      },
      {
        id: 'siguelo',
        name: 'SIGUELO',
        description: 'Ver más información sobre los títulos, el precio al que lo compraron.',
        url: 'https://sigueloplus.sunarp.gob.pe/siguelo/',
        required: true,
        maxImages: 5,
      },
    ],
  },
  {
    id: 'gravamenes_sunat',
    name: 'Gravámenes SUNAT',
    section: 'legal',
    sources: [
      {
        id: 'sigm',
        name: 'SIGM',
        description: 'Gravámenes',
        url: 'https://sigm.sunarp.gob.pe/garantias-mobiliarias/inicio',
        required: true,
        tooltip: 'Gravámenes',
        maxImages: 5,
      },
    ],
  },
  {
    id: 'orden_captura_sunat',
    name: 'Orden de Captura SUNAT',
    section: 'legal',
    sources: [
      {
        id: 'captura_sat_lima',
        name: 'Captura SAT Lima',
        description: 'Verificar si tiene orden de captura en Lima',
        url: 'https://www.sat.gob.pe/VirtualSAT/principal.aspx?mysession=Wo6btvLxWZq6%2fzn85z5%2fD%2b35ItMPLtLJw9PWbLw%2bDKk%3d',
        required: true,
        maxImages: 5,
      },
    ],
  },
  {
    id: 'soat',
    name: 'SOAT',
    section: 'legal',
    sources: [
      {
        id: 'soat_consulta',
        name: 'SOAT',
        description: 'Verificar si el SOAT está vigente',
        url: 'https://www.apeseg.org.pe/consultas-soat/',
        required: true,
        maxImages: 5,
      },
    ],
  },
  {
    id: 'revision_tecnica',
    name: 'Revisión Técnica',
    section: 'legal',
    sources: [
      {
        id: 'mtc_revision',
        name: 'Revisión Técnica',
        description: 'Verificar si tiene revisión técnica actualizada',
        url: 'https://rec.mtc.gob.pe/Citv/ArConsultaCitv',
        required: true,
        maxImages: 5,
      },
    ],
  },
  {
    id: 'impuesto_vehicular',
    name: 'Impuesto Vehicular',
    section: 'legal',
    sources: [
      {
        id: 'sat_lima_impuesto',
        name: 'SAT Lima',
        description: 'Verificar si hay impuesto vehicular pendiente, o deuda de una papeleta',
        url: 'https://www.sat.gob.pe/pagosenlinea/',
        required: true,
        maxImages: 5,
      },
    ],
  },
  {
    id: 'conversion_gas',
    name: 'Conversión de Gas',
    section: 'legal',
    sources: [
      {
        id: 'infogas',
        name: 'Infogas',
        description: 'Verificar si el vehículo tiene gas',
        url: 'https://infogas.com.pe/consulta-placa/',
        required: false,
        maxImages: 5,
      },
    ],
  },

  // ====== INFRACCIONES Y REGISTROS ======
  {
    id: 'papeletas_sat',
    name: 'Papeletas SAT',
    section: 'infractions',
    sources: [
      {
        id: 'papeletas_sat_lima',
        name: 'Papeletas SAT Lima',
        description: 'Verificar si tiene papeletas en SAT LIMA',
        url: 'https://www.sat.gob.pe/VirtualSAT/principal.aspx?mysession=Wo6btvLxWZq6%2fzn85z5%2fD0C3YWoA3XCIYXe%2bnWUQMTw%3d',
        required: true,
      },
    ],
  },
  {
    id: 'papeletas_callao',
    name: 'Papeletas Callao',
    section: 'infractions',
    sources: [
      {
        id: 'papeletas_callao',
        name: 'Papeletas Callao',
        description: 'Verificar si tiene papeletas en el Callao',
        url: 'https://pagopapeletascallao.pe/',
        required: true,
      },
    ],
  },
  {
    id: 'papeletas_atu',
    name: 'Papeletas ATU',
    section: 'infractions',
    sources: [
      {
        id: 'atu',
        name: 'ATU',
        description: 'Papeletas en ATU',
        url: 'https://pasarela.atu.gob.pe/#',
        required: false,
      },
    ],
  },
  {
    id: 'papeletas_sutran',
    name: 'Papeletas SUTRAN',
    section: 'infractions',
    sources: [
      {
        id: 'verifica_infraccion_sutran',
        name: 'Verifica Infracción',
        description: 'Verificar infracciones SUTRAN',
        url: 'https://www.sutran.gob.pe/consultas/record-de-infracciones/record-de-infracciones/',
        required: false,
      },
      {
        id: 'sutran',
        name: 'SUTRAN',
        description: 'Verificar papeletas en SUTRAN',
        url: 'https://www.sutran.gob.pe/consultas/record-de-infracciones/record-de-infracciones/',
        required: false,
      },
    ],
  },
  {
    id: 'registro_transportes',
    name: 'Registro de Transportes',
    section: 'infractions',
    sources: [
      {
        id: 'taxi',
        name: 'TAXI',
        description: 'Es taxi',
        url: 'https://sistemas.atu.gob.pe/ConsultaVehiculo',
        required: false,
      },
    ],
  },
  {
    id: 'siniestralidad',
    name: 'Siniestralidad',
    section: 'infractions',
    sources: [
      {
        id: 'siniestro_soat',
        name: 'Siniestro SOAT',
        description: 'Verificar siniestros SOAT o siniestros vehiculares',
        url: 'https://servicios.sbs.gob.pe/reportesoat/BusquedaPlaca',
        required: false,
      },
    ],
  },
] as const;

// Generar array plano de todas las fuentes (para compatibilidad con código existente)
export const LEGAL_SOURCES = LEGAL_CATEGORIES.flatMap(category =>
  category.sources.map(source => ({
    ...source,
    categoryId: category.id,
    categoryName: category.name,
    section: category.section,
  }))
);

export type LegalSourceId = typeof LEGAL_SOURCES[number]['id'];
