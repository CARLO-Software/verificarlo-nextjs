// ============================================
// Estilos compartidos para componentes PDF
// Paleta: Amarillo VerifiCARLO, Gris Grafito, Negro, Blanco
// Rediseño estratégico: Enfoque en decisión y claridad económica
// ============================================

import { StyleSheet } from '@react-pdf/renderer';

// Colores de marca VerifiCARLO - Paleta profesional refinada
export const colors = {
  // PRIMARIOS
  brand: '#F5D849',              // Amarillo VerifiCARLO
  brandDark: '#C9A900',          // Amarillo para texto sobre blanco
  graphite: '#1F2937',           // Gris grafito principal (más oscuro)

  // NEUTROS
  charcoal: '#374151',           // Gris carbón (texto principal)
  slate: '#6B7280',              // Gris pizarra (texto secundario)
  silver: '#9CA3AF',             // Gris plata (texto terciario)

  // FONDOS
  white: '#FFFFFF',
  offWhite: '#F9FAFB',
  lightGray: '#F3F4F6',
  borderGray: '#E5E7EB',

  // ESTADOS SEMÁNTICOS (protagonistas del informe)
  success: '#047857',            // Verde más profundo
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',

  warning: '#B45309',            // Ámbar más oscuro (legibilidad)
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',

  danger: '#B91C1C',             // Rojo más profundo
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',

  black: '#000000',
};

// Función helper para obtener colores de veredicto
// Rediseñado: Mensajes orientados a ACCIÓN, no solo estados
export function getVerdictConfig(status: string, estimatedCost?: number | null): {
  label: string;
  subtitle: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
} {
  switch (status) {
    case 'OK':
      return {
        label: 'COMPRA SEGURA',
        subtitle: 'Puede proceder con confianza',
        description: 'Sin reparaciones urgentes detectadas. El vehículo cumple con los estándares de seguridad y funcionamiento.',
        color: colors.success,
        bgColor: colors.successBg,
        borderColor: colors.successBorder,
        icon: '✓',
      };
    case 'WARNING':
      return {
        label: 'COMPRA CON NEGOCIACIÓN',
        subtitle: estimatedCost ? `Negocie S/ ${estimatedCost.toLocaleString('es-PE')} de descuento` : 'Negocie el precio antes de comprar',
        description: 'El vehículo presenta observaciones que no afectan la seguridad inmediata, pero requieren correcciones. Use el costo estimado como base de negociación.',
        color: colors.warning,
        bgColor: colors.warningBg,
        borderColor: colors.warningBorder,
        icon: '!',
      };
    case 'CRITICAL':
      return {
        label: 'NO COMPRAR',
        subtitle: estimatedCost ? `Riesgo de gastos mayores a S/ ${estimatedCost.toLocaleString('es-PE')}` : 'No recomendamos esta compra',
        description: 'El vehículo presenta defectos que comprometen la seguridad o requieren reparaciones significativas. No recomendamos la compra en las condiciones actuales.',
        color: colors.danger,
        bgColor: colors.dangerBg,
        borderColor: colors.dangerBorder,
        icon: '✕',
      };
    default:
      return {
        label: 'PENDIENTE',
        subtitle: 'Inspección en proceso',
        description: 'La inspección no ha sido completada.',
        color: colors.slate,
        bgColor: colors.lightGray,
        borderColor: colors.borderGray,
        icon: '?',
      };
  }
}

// Función helper para obtener color de categoría (semáforo)
export function getCategoryIndicator(status: string): {
  color: string;
  label: string;
} {
  switch (status) {
    case 'OK':
      return { color: colors.success, label: 'Sin problemas' };
    case 'WARNING':
    case 'OBSERVACION':
      return { color: colors.warning, label: 'Observaciones' };
    case 'CRITICAL':
    case 'DEFECTO':
      return { color: colors.danger, label: 'Requiere atención' };
    default:
      return { color: colors.silver, label: 'Pendiente' };
  }
}

// Función para badges de checklist
export function getStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'OK':
      return { bg: colors.successBg, text: colors.success };
    case 'WARNING':
    case 'OBSERVACION':
      return { bg: colors.warningBg, text: colors.warning };
    case 'CRITICAL':
    case 'DEFECTO':
      return { bg: colors.dangerBg, text: colors.danger };
    default:
      return { bg: colors.lightGray, text: colors.slate };
  }
}

// Función legacy para compatibilidad
export function getStatusText(status: string): string {
  switch (status) {
    case 'OK':
      return 'OK';
    case 'WARNING':
      return 'OBS';
    case 'CRITICAL':
      return 'DEF';
    default:
      return '-';
  }
}

// Estilos base del documento
export const baseStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: colors.white,
    padding: 40,
    fontFamily: 'Helvetica',
  },
  section: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  col: {
    flexDirection: 'column',
  },
});

// Estilos de tipografía
export const typography = StyleSheet.create({
  h1: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.graphite,
    marginBottom: 8,
  },
  h2: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.graphite,
    marginBottom: 6,
  },
  h3: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 4,
  },
  body: {
    fontSize: 9,
    color: colors.charcoal,
    lineHeight: 1.5,
  },
  small: {
    fontSize: 8,
    color: colors.slate,
  },
  label: {
    fontSize: 8,
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
});
