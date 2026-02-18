// ============================================
// PDFCategoryResults - Resumen visual por categoría (simplificado)
// Rediseño: Sin dots, solo indicadores de estado claros
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../styles/pdfStyles';

interface CategoryResult {
  name: string;
  score: number;
  status: string;
  ok?: number;
  observaciones?: number;
  defectos?: number;
  total?: number;
}

interface PDFCategoryResultsProps {
  categories: CategoryResult[];
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.graphite,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  cardOk: {
    borderColor: colors.successBorder,
    backgroundColor: colors.successBg,
  },
  cardWarning: {
    borderColor: colors.warningBorder,
    backgroundColor: colors.warningBg,
  },
  cardCritical: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBg,
  },
  cardDefault: {
    borderColor: colors.borderGray,
    backgroundColor: colors.offWhite,
  },
  categoryName: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.graphite,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusIconText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  statusLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
    gap: 6,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 2,
  },
  statText: {
    fontSize: 6,
    color: colors.slate,
  },
});

function getStatusConfig(status: string, defectos?: number, observaciones?: number) {
  if (status === 'CRITICAL' || (defectos && defectos > 0)) {
    return {
      icon: '!',
      label: defectos === 1 ? '1 defecto' : `${defectos} defectos`,
      color: colors.danger,
      cardStyle: styles.cardCritical,
    };
  }
  if (status === 'WARNING' || (observaciones && observaciones > 0)) {
    return {
      icon: '!',
      label: observaciones === 1 ? '1 observación' : `${observaciones} obs.`,
      color: colors.warning,
      cardStyle: styles.cardWarning,
    };
  }
  return {
    icon: '✓',
    label: 'Sin problemas',
    color: colors.success,
    cardStyle: styles.cardOk,
  };
}

export default function PDFCategoryResults({ categories }: PDFCategoryResultsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumen por Categoría</Text>
      <View style={styles.grid}>
        {categories.map((category) => {
          const config = getStatusConfig(
            category.status,
            category.defectos,
            category.observaciones
          );

          return (
            <View key={category.name} style={[styles.categoryCard, config.cardStyle]}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <View style={[styles.statusIcon, { backgroundColor: config.color }]}>
                <Text style={styles.statusIconText}>{config.icon}</Text>
              </View>
              <Text style={[styles.statusLabel, { color: config.color }]}>
                {config.label}
              </Text>
              {/* Stats opcionales */}
              {(category.ok !== undefined || category.total !== undefined) && (
                <View style={styles.statsRow}>
                  {category.ok !== undefined && category.ok > 0 && (
                    <View style={styles.stat}>
                      <View
                        style={[styles.statDot, { backgroundColor: colors.success }]}
                      />
                      <Text style={styles.statText}>{category.ok} OK</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
