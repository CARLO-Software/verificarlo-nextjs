// ============================================
// PDFSummary - Resumen y recomendaciones
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../styles/pdfStyles';

interface PDFSummaryProps {
  executiveSummary?: string | null;
  recommendations?: string | null;
  estimatedRepairCost?: number | null;
  soatValid?: boolean;
  soatExpiryDate?: string | null;
  technicalReviewValid?: boolean;
  technicalReviewExpiryDate?: string | null;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  section: {
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.gray[700],
    marginBottom: 6,
  },
  text: {
    fontSize: 9,
    color: colors.gray[600],
    lineHeight: 1.5,
  },
  card: {
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  documentsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  documentCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 8,
    padding: 10,
  },
  documentValid: {
    borderColor: colors.success,
    backgroundColor: '#F0FDF4',
  },
  documentInvalid: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  documentTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.gray[700],
    marginBottom: 4,
  },
  documentStatus: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  documentStatusValid: {
    color: colors.success,
  },
  documentStatusInvalid: {
    color: colors.danger,
  },
  documentExpiry: {
    fontSize: 8,
    color: colors.gray[500],
    marginTop: 4,
  },
  costCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400E',
  },
  costValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
  },
});

export default function PDFSummary({
  executiveSummary,
  recommendations,
  estimatedRepairCost,
  soatValid,
  soatExpiryDate,
  technicalReviewValid,
  technicalReviewExpiryDate,
}: PDFSummaryProps) {
  const formatCurrency = (amount: number) => {
    return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RESUMEN DE LA INSPECCION</Text>

      {/* Estado de documentos */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Estado de Documentos</Text>
        <View style={styles.documentsContainer}>
          <View
            style={[
              styles.documentCard,
              soatValid ? styles.documentValid : styles.documentInvalid,
            ]}
          >
            <Text style={styles.documentTitle}>SOAT</Text>
            <Text
              style={[
                styles.documentStatus,
                soatValid ? styles.documentStatusValid : styles.documentStatusInvalid,
              ]}
            >
              {soatValid ? 'VIGENTE' : 'NO VIGENTE'}
            </Text>
            {soatExpiryDate && (
              <Text style={styles.documentExpiry}>Vence: {soatExpiryDate}</Text>
            )}
          </View>
          <View
            style={[
              styles.documentCard,
              technicalReviewValid ? styles.documentValid : styles.documentInvalid,
            ]}
          >
            <Text style={styles.documentTitle}>Revision Tecnica</Text>
            <Text
              style={[
                styles.documentStatus,
                technicalReviewValid
                  ? styles.documentStatusValid
                  : styles.documentStatusInvalid,
              ]}
            >
              {technicalReviewValid ? 'VIGENTE' : 'NO VIGENTE'}
            </Text>
            {technicalReviewExpiryDate && (
              <Text style={styles.documentExpiry}>Vence: {technicalReviewExpiryDate}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Resumen ejecutivo */}
      {executiveSummary && (
        <View style={styles.section}>
          <Text style={styles.subtitle}>Resumen Ejecutivo</Text>
          <View style={styles.card}>
            <Text style={styles.text}>{executiveSummary}</Text>
          </View>
        </View>
      )}

      {/* Recomendaciones */}
      {recommendations && (
        <View style={styles.section}>
          <Text style={styles.subtitle}>Recomendaciones</Text>
          <View style={styles.card}>
            <Text style={styles.text}>{recommendations}</Text>
          </View>
        </View>
      )}

      {/* Costo estimado */}
      {estimatedRepairCost !== null && estimatedRepairCost !== undefined && estimatedRepairCost > 0 && (
        <View style={styles.costCard}>
          <Text style={styles.costLabel}>Costo Estimado de Reparaciones</Text>
          <Text style={styles.costValue}>{formatCurrency(estimatedRepairCost)}</Text>
        </View>
      )}
    </View>
  );
}
