// ============================================
// PDFCategoryResults - Resultados por categoría
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, getStatusColor, getStatusText } from '../styles/pdfStyles';

interface CategoryResult {
  name: string;
  score: number;
  status: string;
}

interface PDFCategoryResultsProps {
  categories: CategoryResult[];
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 8,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.gray[600],
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  rowAlt: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    backgroundColor: colors.gray[50],
  },
  rowLast: {
    flexDirection: 'row',
    padding: 10,
  },
  cellCategory: {
    flex: 2,
  },
  cellScore: {
    flex: 1,
    alignItems: 'center',
  },
  cellStatus: {
    flex: 1.5,
    alignItems: 'flex-end',
  },
  categoryText: {
    fontSize: 10,
    color: colors.gray[800],
    fontWeight: 'bold',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

export default function PDFCategoryResults({ categories }: PDFCategoryResultsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RESULTADOS POR CATEGORIA</Text>
      <View style={styles.table}>
        <View style={styles.headerRow}>
          <View style={styles.cellCategory}>
            <Text style={styles.headerCell}>Categoria</Text>
          </View>
          <View style={styles.cellScore}>
            <Text style={styles.headerCell}>Puntaje</Text>
          </View>
          <View style={styles.cellStatus}>
            <Text style={styles.headerCell}>Estado</Text>
          </View>
        </View>
        {categories.map((category, index) => {
          const isLast = index === categories.length - 1;
          const isAlt = index % 2 === 1;
          const statusColors = getStatusColor(category.status);
          const statusText = getStatusText(category.status);

          return (
            <View
              key={category.name}
              style={isLast ? styles.rowLast : isAlt ? styles.rowAlt : styles.row}
            >
              <View style={styles.cellCategory}>
                <Text style={styles.categoryText}>{category.name}</Text>
              </View>
              <View style={styles.cellScore}>
                <Text style={styles.scoreText}>{category.score}/100</Text>
              </View>
              <View style={styles.cellStatus}>
                <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                  <Text style={[styles.statusText, { color: statusColors.text }]}>
                    {statusText}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
