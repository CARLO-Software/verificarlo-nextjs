// ============================================
// PDFCategoryResults - Resumen visual por categoría
// Sistema de semáforo sin puntajes numéricos
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, getCategoryIndicator } from '../styles/pdfStyles';

interface CategoryResult {
  name: string;
  score: number;
  status: string;
  itemsOk?: number;
  itemsObs?: number;
  itemsDef?: number;
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
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 6,
    padding: 10,
    backgroundColor: colors.white,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.graphite,
  },
  statusLabel: {
    fontSize: 8,
    marginBottom: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotFilled: {
    // color se aplica dinámicamente
  },
  dotEmpty: {
    backgroundColor: colors.borderGray,
  },
});

// Calcular dots basado en el score (5 dots)
function getScoreDots(score: number): number {
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  if (score > 0) return 1;
  return 0;
}

export default function PDFCategoryResults({ categories }: PDFCategoryResultsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumen por Categoría</Text>
      <View style={styles.grid}>
        {categories.map((category) => {
          const indicator = getCategoryIndicator(category.status);
          const filledDots = getScoreDots(category.score);

          return (
            <View key={category.name} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View
                  style={[styles.indicator, { backgroundColor: indicator.color }]}
                />
                <Text style={styles.categoryName}>{category.name}</Text>
              </View>
              <Text style={[styles.statusLabel, { color: indicator.color }]}>
                {indicator.label}
              </Text>
              <View style={styles.dotsContainer}>
                {[1, 2, 3, 4, 5].map((dotIndex) => (
                  <View
                    key={dotIndex}
                    style={[
                      styles.dot,
                      dotIndex <= filledDots
                        ? { backgroundColor: indicator.color }
                        : styles.dotEmpty,
                    ]}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
