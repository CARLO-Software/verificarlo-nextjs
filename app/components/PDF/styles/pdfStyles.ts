// ============================================
// Estilos compartidos para componentes PDF
// ============================================

import { StyleSheet } from '@react-pdf/renderer';

// Colores de marca VerifiCARLO
export const colors = {
  primary: '#1E3A8A',      // Azul oscuro
  primaryLight: '#3B82F6', // Azul claro
  secondary: '#10B981',    // Verde
  accent: '#F59E0B',       // Naranja/Amarillo
  danger: '#EF4444',       // Rojo
  warning: '#F59E0B',      // Amarillo
  success: '#10B981',      // Verde
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  white: '#FFFFFF',
  black: '#000000',
};

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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  h2: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[800],
    marginBottom: 8,
  },
  h3: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gray[700],
    marginBottom: 6,
  },
  body: {
    fontSize: 10,
    color: colors.gray[700],
    lineHeight: 1.4,
  },
  small: {
    fontSize: 8,
    color: colors.gray[500],
  },
  label: {
    fontSize: 9,
    color: colors.gray[500],
    marginBottom: 2,
  },
  value: {
    fontSize: 11,
    color: colors.gray[800],
    fontWeight: 'bold',
  },
});

// Estilos de tablas
export const tableStyles = StyleSheet.create({
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    padding: 8,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.gray[700],
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    padding: 8,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    padding: 8,
    backgroundColor: colors.gray[50],
  },
  tableCell: {
    fontSize: 9,
    color: colors.gray[700],
  },
});

// Estilos de badges de estado
export const badgeStyles = StyleSheet.create({
  badgeBase: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  badgeOk: {
    backgroundColor: '#D1FAE5',
    color: colors.success,
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  badgeCritical: {
    backgroundColor: '#FEE2E2',
    color: colors.danger,
  },
  badgePending: {
    backgroundColor: colors.gray[100],
    color: colors.gray[500],
  },
});

// Estilos de tarjetas
export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.gray[800],
  },
});

// Estilos del score card
export const scoreCardStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scoreLabel: {
    fontSize: 10,
    color: colors.white,
    opacity: 0.9,
  },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

// Función helper para obtener color según estado
export function getStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'OK':
      return { bg: '#D1FAE5', text: colors.success };
    case 'WARNING':
    case 'OBSERVACION':
      return { bg: '#FEF3C7', text: '#D97706' };
    case 'CRITICAL':
    case 'DEFECTO':
      return { bg: '#FEE2E2', text: colors.danger };
    default:
      return { bg: colors.gray[100], text: colors.gray[500] };
  }
}

// Función helper para obtener texto de estado
export function getStatusText(status: string): string {
  switch (status) {
    case 'OK':
      return 'APROBADO';
    case 'WARNING':
      return 'OBSERVACIONES';
    case 'CRITICAL':
      return 'NO APROBADO';
    default:
      return 'PENDIENTE';
  }
}
