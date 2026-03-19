/**
 * inspection-verdict.ts
 *
 * Helper centralizado para calcular el veredicto de una inspección
 * combinando puntaje y estado para dar una recomendación clara al cliente.
 *
 * Lógica:
 * - Sin defectos, sin observaciones → COMPRA SEGURA (verde)
 * - Sin defectos, con observaciones → COMPRA CON NEGOCIACIÓN (ámbar)
 * - Con defectos, puntaje >= 70 → COMPRA CON NEGOCIACIÓN (ámbar)
 * - Con defectos, puntaje < 70 → NO COMPRAR (rojo)
 */

export type VerdictType = 'SAFE' | 'NEGOTIATE' | 'DONT_BUY' | 'PENDING';

export interface VerdictConfig {
  type: VerdictType;
  label: string;
  subtitle: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: '✓' | '⚠' | '✗' | '⏳';
}

/**
 * Calcula el veredicto de una inspección basado en puntaje y estado.
 *
 * @param score - Puntaje general (0-100) o null si aún no está disponible
 * @param status - Estado del resultado: 'PENDING' | 'OK' | 'WARNING' | 'CRITICAL'
 *                 También acepta: 'APPROVED' | 'APPROVED_WITH_OBSERVATIONS' | 'REJECTED'
 * @returns Configuración completa del veredicto para mostrar en UI
 */
export function getVerdict(
  score: number | null,
  status: string | null
): VerdictConfig {
  // Si no hay puntaje o estado, está pendiente
  if (score === null || !status) {
    return {
      type: 'PENDING',
      label: 'Pendiente',
      subtitle: 'La inspección aún no ha sido completada',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
      icon: '⏳',
    };
  }

  // Normalizar estado a formato interno
  const normalizedStatus = normalizeStatus(status);

  // Sin defectos (OK/APPROVED)
  if (normalizedStatus === 'OK') {
    return {
      type: 'SAFE',
      label: 'COMPRA SEGURA',
      subtitle: 'El vehículo pasó la inspección sin defectos',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300',
      icon: '✓',
    };
  }

  // Con observaciones pero sin defectos críticos (WARNING/APPROVED_WITH_OBSERVATIONS)
  if (normalizedStatus === 'WARNING') {
    return {
      type: 'NEGOTIATE',
      label: 'COMPRA CON NEGOCIACIÓN',
      subtitle: 'Negocie descuento por las observaciones encontradas',
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
      borderColor: 'border-amber-300',
      icon: '⚠',
    };
  }

  // Con defectos (CRITICAL/REJECTED) - evaluar según puntaje
  if (normalizedStatus === 'CRITICAL') {
    if (score >= 70) {
      return {
        type: 'NEGOTIATE',
        label: 'COMPRA CON NEGOCIACIÓN',
        subtitle: 'Se encontraron defectos menores. Negocie el precio',
        color: 'text-amber-700',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-300',
        icon: '⚠',
      };
    }

    return {
      type: 'DONT_BUY',
      label: 'NO COMPRAR',
      subtitle: 'Se encontraron defectos importantes. No recomendamos la compra',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300',
      icon: '✗',
    };
  }

  // Fallback para estados desconocidos
  return {
    type: 'PENDING',
    label: 'Pendiente',
    subtitle: 'Estado no determinado',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: '⏳',
  };
}

/**
 * Normaliza diferentes formatos de estado a un formato interno consistente.
 */
function normalizeStatus(status: string): 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING' {
  const upperStatus = status.toUpperCase();

  // Mapeo de estados
  const statusMap: Record<string, 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING'> = {
    // Formato interno
    'OK': 'OK',
    'WARNING': 'WARNING',
    'CRITICAL': 'CRITICAL',
    'PENDING': 'PENDING',
    // Formato de InspectionResultStatus (Prisma)
    'APPROVED': 'OK',
    'APPROVED_WITH_OBSERVATIONS': 'WARNING',
    'REJECTED': 'CRITICAL',
  };

  return statusMap[upperStatus] || 'PENDING';
}

/**
 * Obtiene el color de fondo del gradiente para el header según el veredicto.
 */
export function getVerdictGradient(type: VerdictType): string {
  const gradients: Record<VerdictType, string> = {
    'SAFE': 'from-green-500 to-emerald-500',
    'NEGOTIATE': 'from-amber-500 to-yellow-500',
    'DONT_BUY': 'from-red-500 to-rose-500',
    'PENDING': 'from-gray-400 to-gray-500',
  };
  return gradients[type];
}

/**
 * Configuración para la lista de inspecciones (formato compacto).
 */
export function getVerdictBadgeConfig(
  score: number | null,
  status: string | null
): { label: string; className: string } {
  const verdict = getVerdict(score, status);

  const classMap: Record<VerdictType, string> = {
    'SAFE': 'bg-green-100 text-green-800 border-green-300',
    'NEGOTIATE': 'bg-amber-100 text-amber-800 border-amber-300',
    'DONT_BUY': 'bg-red-100 text-red-800 border-red-300',
    'PENDING': 'bg-gray-100 text-gray-700 border-gray-300',
  };

  return {
    label: verdict.label,
    className: classMap[verdict.type],
  };
}

/**
 * Información sobre cómo se calcula cada categoría de puntaje.
 */
export type ScoreCategory = 'legal' | 'mechanical' | 'body' | 'interior' | 'roadTest' | 'overall';

export interface ScoreCategoryInfo {
  title: string;
  description: string;
  items: string[];
}

const scoreCategoryDescriptions: Record<ScoreCategory, ScoreCategoryInfo> = {
  legal: {
    title: 'Revisión Legal',
    description: 'Verificamos el estado documental y legal del vehículo.',
    items: [
      'Tarjeta de propiedad válida',
      'Sin multas pendientes',
      'Sin restricciones judiciales',
      'Historial de propietarios',
      'Verificación SUNARP',
    ],
  },
  mechanical: {
    title: 'Revisión Mecánica',
    description: 'Evaluamos el funcionamiento técnico del vehículo.',
    items: [
      'Motor y transmisión',
      'Sistema de frenos',
      'Suspensión y dirección',
      'Sistema eléctrico',
      'Diagnóstico computarizado (OBD)',
    ],
  },
  body: {
    title: 'Carrocería',
    description: 'Inspeccionamos el estado físico exterior del vehículo.',
    items: [
      'Pintura y acabados',
      'Detección de choques previos',
      'Estado de vidrios y lunas',
      'Medición de espesores',
    ],
  },
  interior: {
    title: 'Interior',
    description: 'Evaluamos el estado del habitáculo y equipamiento.',
    items: [
      'Tablero e instrumentos',
      'Asientos y tapicería',
      'Sistema de aire acondicionado',
      'Equipamiento eléctrico (vidrios, espejos, seguros)',
      'Maletero y compartimentos',
    ],
  },
  roadTest: {
    title: 'Prueba de Ruta',
    description: 'Evaluamos el comportamiento del vehículo en movimiento.',
    items: [
      'Arranque y ralentí',
      'Cambios de marcha',
      'Dirección y alineación',
      'Frenado y ABS',
      'Ruidos y vibraciones',
    ],
  },
  overall: {
    title: 'Puntaje General',
    description: 'Cada área se evalúa de 0 a 100 puntos. El puntaje general es un promedio ponderado:',
    items: [
      'Legal aporta el 30% al puntaje final',
      'Mecánica aporta el 40% al puntaje final',
      'Carrocería aporta el 30% al puntaje final',
    ],
  },
};

/**
 * Obtiene la información descriptiva de una categoría de puntaje.
 */
export function getScoreCategoryInfo(category: ScoreCategory): ScoreCategoryInfo {
  return scoreCategoryDescriptions[category];
}

/**
 * Obtiene todas las categorías con su información.
 */
export function getAllScoreCategoriesInfo(): Record<ScoreCategory, ScoreCategoryInfo> {
  return scoreCategoryDescriptions;
}
