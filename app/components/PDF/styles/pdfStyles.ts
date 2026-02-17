// ============================================
// Estilos compartidos para componentes PDF
// Paleta: Amarillo VerifiCARLO, Gris Grafito, Negro, Blanco
// ============================================

import { StyleSheet } from '@react-pdf/renderer';

// Colores de marca VerifiCARLO - Paleta profesional
export const colors = {
  // Primarios
  brand: '#F5D849',           // Amarillo VerifiCARLO
  brandDark: '#D4B83D',       // Amarillo oscuro

  // Neutros
  graphite: '#2D2D2D',        // Gris grafito (títulos)
  charcoal: '#404040',        // Gris carbón (texto principal)
  slate: '#6B7280',           // Gris pizarra (texto secundario)
  silver: '#9CA3AF',          // Gris plata (texto terciario)

  // Fondos
  white: '#FFFFFF',
  offWhite: '#FAFAFA',
  lightGray: '#F3F4F6',
  borderGray: '#E5E7EB',

  // Estados semánticos (sutiles)
  success: '#059669',         // Verde esmeralda
  successBg: '#ECFDF5',
  warning: '#D97706',         // Ámbar
  warningBg: '#FFFBEB',
  danger: '#DC2626',          // Rojo
  dangerBg: '#FEF2F2',

  black: '#000000',
};

// Función helper para obtener colores de veredicto
export function getVerdictConfig(status: string): {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  switch (status) {
    case 'OK':
      return {
        label: 'RECOMENDADO',
        description: 'Este vehículo cumple con los estándares de seguridad y funcionamiento. Puede proceder con la compra con confianza.',
        color: colors.success,
        bgColor: colors.successBg,
        borderColor: colors.success,
      };
    case 'WARNING':
      return {
        label: 'RECOMENDADO CON RESERVAS',
        description: 'Este vehículo presenta observaciones menores que no afectan la seguridad inmediata. Recomendamos negociar las reparaciones antes de la compra.',
        color: colors.warning,
        bgColor: colors.warningBg,
        borderColor: colors.warning,
      };
    case 'CRITICAL':
      return {
        label: 'NO RECOMENDADO',
        description: 'Este vehículo presenta defectos que comprometen la seguridad o requieren reparaciones significativas. No recomendamos la compra en las condiciones actuales.',
        color: colors.danger,
        bgColor: colors.dangerBg,
        borderColor: colors.danger,
      };
    default:
      return {
        label: 'PENDIENTE',
        description: 'La inspección no ha sido completada.',
        color: colors.slate,
        bgColor: colors.lightGray,
        borderColor: colors.borderGray,
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
