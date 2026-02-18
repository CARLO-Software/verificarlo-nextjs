// ============================================
// PDFInspectionCoverage - Resumen de cobertura de inspección
// Muestra: "X puntos inspeccionados" + resumen por categoría
// Incluye indicación de items "no aplica"
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../styles/pdfStyles';

interface CategorySummary {
  name: string;
  total: number;
  ok: number;
  observaciones: number;
  defectos: number;
  noAplica: number;
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';
}

interface PDFInspectionCoverageProps {
  totalPoints: number;
  totalNoAplica: number;
  categories: CategorySummary[];
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.graphite,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.brand,
  },
  headerText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.graphite,
  },
  headerSubtext: {
    fontSize: 8,
    color: colors.slate,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 6,
    padding: 8,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 7,
    fontWeight: 'bold',
    color: colors.graphite,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 2,
  },
  categoryNoAplica: {
    fontSize: 6,
    color: colors.slate,
    marginBottom: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 3,
  },
  statusText: {
    fontSize: 6,
    fontWeight: 'bold',
  },
});

function getStatusConfig(defectos: number, observaciones: number) {
  if (defectos > 0) {
    return {
      label: `${defectos} defecto${defectos > 1 ? 's' : ''}`,
      color: colors.danger,
      bgColor: colors.dangerBg,
    };
  }
  if (observaciones > 0) {
    return {
      label: `${observaciones} obs.`,
      color: colors.warning,
      bgColor: colors.warningBg,
    };
  }
  return {
    label: 'Todo OK',
    color: colors.success,
    bgColor: colors.successBg,
  };
}

export default function PDFInspectionCoverage({
  totalPoints,
  totalNoAplica,
  categories,
}: PDFInspectionCoverageProps) {
  const totalRevisados = totalPoints - totalNoAplica;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.checkIcon}>
            <Text style={styles.checkText}>✓</Text>
          </View>
          <Text style={styles.headerText}>{totalRevisados} PUNTOS REVISADOS</Text>
        </View>
        {totalNoAplica > 0 && (
          <Text style={styles.headerSubtext}>
            {totalNoAplica} no aplican a este vehículo
          </Text>
        )}
      </View>

      <View style={styles.grid}>
        {categories.map((category) => {
          const revisados = category.ok + category.observaciones + category.defectos;
          const statusConfig = getStatusConfig(category.defectos, category.observaciones);

          return (
            <View key={category.name} style={styles.categoryCard}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryCount}>
                {revisados}/{category.total}
              </Text>
              {category.noAplica > 0 && (
                <Text style={styles.categoryNoAplica}>
                  ({category.noAplica} no aplica)
                </Text>
              )}
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: statusConfig.bgColor },
                ]}
              >
                <View
                  style={[styles.statusDot, { backgroundColor: statusConfig.color }]}
                />
                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
