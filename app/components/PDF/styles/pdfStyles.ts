// ============================================
// Estilos compartidos para componentes PDF
// REDISEÑO: Sistema de colores estricto para decisión clara
// Rojo = Crítico | Amarillo = Observación | Verde = OK | Gris = Neutro
// ============================================

import { StyleSheet } from '@react-pdf/renderer';

// Sistema de colores estricto - Solo 4 significados semánticos
export const colors = {
  // MARCA
  brand: '#F5D849',              // Amarillo VerifiCARLO (solo branding)
  brandDark: '#C9A900',          // Amarillo para texto sobre blanco

  // NEUTROS (para texto y estructura)
  graphite: '#1F2937',           // Títulos y texto principal
  charcoal: '#374151',           // Texto secundario
  slate: '#6B7280',              // Texto terciario
  silver: '#9CA3AF',             // Texto muy sutil

  // FONDOS
  white: '#FFFFFF',
  offWhite: '#F9FAFB',
  lightGray: '#F3F4F6',
  borderGray: '#E5E7EB',

  // ============================================
  // SEMÁFORO DE DECISIÓN (colores protagonistas)
  // ============================================

  // ROJO - Defectos críticos (NO COMPRAR)
  danger: '#DC2626',             // Rojo vibrante para máxima visibilidad
  dangerDark: '#B91C1C',         // Rojo para texto
  dangerBg: '#FEF2F2',
  dangerBgStrong: '#FEE2E2',     // Fondo más intenso para banners
  dangerBorder: '#FECACA',

  // AMARILLO - Observaciones (NEGOCIAR)
  warning: '#D97706',            // Ámbar para observaciones
  warningDark: '#B45309',        // Ámbar para texto
  warningBg: '#FFFBEB',
  warningBgStrong: '#FEF3C7',    // Fondo más intenso para banners
  warningBorder: '#FDE68A',

  // VERDE - Todo OK (COMPRA SEGURA)
  success: '#059669',            // Verde para aprobado
  successDark: '#047857',        // Verde para texto
  successBg: '#ECFDF5',
  successBgStrong: '#D1FAE5',    // Fondo más intenso para banners
  successBorder: '#A7F3D0',

  black: '#000000',
};

// Configuración de veredicto - Mensajes claros y directos
// Ahora acepta el veredicto del mecánico y opcionalmente información de hallazgos críticos
export function getVerdictConfig(
  status: string,
  estimatedCost?: number | null,
  verdictInfo?: {
    mechanicalVerdict?: string;
    hasSiniestro?: boolean;
    hasKilometrajeAdulterado?: boolean;
  }
): {
  label: string;
  subtitle: string;
  description: string;
  color: string;
  colorDark: string;
  bgColor: string;
  bgColorStrong: string;
  borderColor: string;
  icon: string;
} {
  // Si hay veredicto del mecánico, usarlo en lugar del status calculado
  const verdict = verdictInfo?.mechanicalVerdict || status;
  const hasSiniestro = verdictInfo?.hasSiniestro || false;
  const hasKilometrajeAdulterado = verdictInfo?.hasKilometrajeAdulterado || false;

  switch (verdict) {
    case 'APROBADO':
    case 'OK':
      return {
        label: 'APROBADO',
        subtitle: 'El vehículo está en óptimas condiciones',
        description: 'Es una buena oportunidad de compra.',
        color: colors.success,
        colorDark: colors.successDark,
        bgColor: colors.successBg,
        bgColorStrong: colors.successBgStrong,
        borderColor: colors.successBorder,
        icon: '✓',
      };
    case 'OBSERVADO':
    case 'WARNING':
      return {
        label: 'OBSERVADO',
        subtitle: estimatedCost
          ? `Descuento sugerido: S/ ${estimatedCost.toLocaleString('es-PE')}`
          : 'Se encontraron defectos menores',
        description: 'Se sugiere negociar el precio con el vendedor.',
        color: colors.warning,
        colorDark: colors.warningDark,
        bgColor: colors.warningBg,
        bgColorStrong: colors.warningBgStrong,
        borderColor: colors.warningBorder,
        icon: '!',
      };
    case 'NO_APROBADO':
    case 'CRITICAL':
      // Construir descripción basada en hallazgos críticos
      let description = 'No se recomienda comprarlo.';
      if (hasSiniestro && hasKilometrajeAdulterado) {
        description = 'El vehículo ha tenido un siniestro y el kilometraje está adulterado. No se recomienda comprarlo.';
      } else if (hasSiniestro) {
        description = 'El vehículo ha tenido un siniestro. No se recomienda comprarlo.';
      } else if (hasKilometrajeAdulterado) {
        description = 'El vehículo tiene el kilometraje adulterado. No se recomienda comprarlo.';
      }

      return {
        label: 'NO APROBADO',
        subtitle: estimatedCost
          ? `Reparaciones estimadas: S/ ${estimatedCost.toLocaleString('es-PE')}+`
          : hasSiniestro || hasKilometrajeAdulterado
            ? 'Hallazgos críticos detectados'
            : 'Defectos críticos detectados',
        description,
        color: colors.danger,
        colorDark: colors.dangerDark,
        bgColor: colors.dangerBg,
        bgColorStrong: colors.dangerBgStrong,
        borderColor: colors.dangerBorder,
        icon: '✕',
      };
    default:
      return {
        label: 'PENDIENTE',
        subtitle: 'Inspección en proceso',
        description: 'La inspección no ha sido completada.',
        color: colors.slate,
        colorDark: colors.slate,
        bgColor: colors.lightGray,
        bgColorStrong: colors.lightGray,
        borderColor: colors.borderGray,
        icon: '?',
      };
  }
}

// Indicador de categoría (semáforo visual)
export function getCategoryIndicator(status: string): {
  color: string;
  bgColor: string;
  label: string;
} {
  switch (status) {
    case 'OK':
      return {
        color: colors.success,
        bgColor: colors.successBg,
        label: 'OK',
      };
    case 'WARNING':
    case 'OBSERVACION':
      return {
        color: colors.warning,
        bgColor: colors.warningBg,
        label: 'Observaciones',
      };
    case 'CRITICAL':
    case 'DEFECTO':
      return {
        color: colors.danger,
        bgColor: colors.dangerBg,
        label: 'Defectos',
      };
    default:
      return {
        color: colors.silver,
        bgColor: colors.lightGray,
        label: '-',
      };
  }
}

// Colores para badges de estado
export function getStatusColor(status: string): {
  bg: string;
  bgStrong: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'OK':
      return {
        bg: colors.successBg,
        bgStrong: colors.successBgStrong,
        text: colors.successDark,
        border: colors.successBorder,
      };
    case 'WARNING':
    case 'OBSERVACION':
      return {
        bg: colors.warningBg,
        bgStrong: colors.warningBgStrong,
        text: colors.warningDark,
        border: colors.warningBorder,
      };
    case 'CRITICAL':
    case 'DEFECTO':
      return {
        bg: colors.dangerBg,
        bgStrong: colors.dangerBgStrong,
        text: colors.dangerDark,
        border: colors.dangerBorder,
      };
    default:
      return {
        bg: colors.lightGray,
        bgStrong: colors.lightGray,
        text: colors.slate,
        border: colors.borderGray,
      };
  }
}

// Texto de estado para badges
export function getStatusText(status: string): string {
  switch (status) {
    case 'OK':
      return 'OK';
    case 'WARNING':
    case 'OBSERVACION':
      return 'OBSERVACIÓN';
    case 'CRITICAL':
    case 'DEFECTO':
      return 'DEFECTO';
    default:
      return '-';
  }
}

// Estilos base del documento
export const baseStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: colors.white,
    padding: 30,
    paddingBottom: 70,
    fontFamily: 'Helvetica',
  },
  section: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  col: {
    flexDirection: 'column',
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
});

// Tipografía consistente
export const typography = StyleSheet.create({
  // Títulos
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.graphite,
    marginBottom: 8,
  },
  h2: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.graphite,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  h3: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 4,
  },
  // Cuerpo de texto
  body: {
    fontSize: 9,
    color: colors.charcoal,
    lineHeight: 1.5,
  },
  bodySmall: {
    fontSize: 8,
    color: colors.charcoal,
    lineHeight: 1.4,
  },
  // Texto secundario
  small: {
    fontSize: 7,
    color: colors.slate,
  },
  // Labels y valores
  label: {
    fontSize: 7,
    color: colors.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: colors.graphite,
    fontWeight: 'bold',
  },
  // Números destacados
  bigNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.graphite,
  },
});
