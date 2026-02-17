// ============================================
// PDFSummary - Resumen ejecutivo y documentos
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
    marginBottom: 16,
  },
  section: {
    marginBottom: 12,
  },
  title: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.graphite,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 6,
    padding: 10,
  },
  text: {
    fontSize: 9,
    color: colors.charcoal,
    lineHeight: 1.5,
  },
  documentsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  documentCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
  },
  documentValid: {
    borderColor: colors.success,
    backgroundColor: colors.successBg,
  },
  documentInvalid: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  documentIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  documentTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.graphite,
  },
  documentStatus: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  documentExpiry: {
    fontSize: 7,
    color: colors.slate,
  },
});

export default function PDFSummary({
  executiveSummary,
  recommendations,
  soatValid,
  soatExpiryDate,
  technicalReviewValid,
  technicalReviewExpiryDate,
}: PDFSummaryProps) {
  // Solo mostrar documentos si hay al menos uno configurado
  const showDocuments = soatValid !== undefined || technicalReviewValid !== undefined;

  return (
    <View style={styles.container}>
      {/* Estado de documentos */}
      {showDocuments && (
        <View style={styles.section}>
          <Text style={styles.title}>Documentación</Text>
          <View style={styles.documentsGrid}>
            <View
              style={[
                styles.documentCard,
                soatValid ? styles.documentValid : styles.documentInvalid,
              ]}
            >
              <View style={styles.documentHeader}>
                <View
                  style={[
                    styles.documentIndicator,
                    { backgroundColor: soatValid ? colors.success : colors.danger },
                  ]}
                />
                <Text style={styles.documentTitle}>SOAT</Text>
              </View>
              <Text
                style={[
                  styles.documentStatus,
                  { color: soatValid ? colors.success : colors.danger },
                ]}
              >
                {soatValid ? 'Vigente' : 'No vigente'}
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
              <View style={styles.documentHeader}>
                <View
                  style={[
                    styles.documentIndicator,
                    { backgroundColor: technicalReviewValid ? colors.success : colors.danger },
                  ]}
                />
                <Text style={styles.documentTitle}>Revisión Técnica</Text>
              </View>
              <Text
                style={[
                  styles.documentStatus,
                  { color: technicalReviewValid ? colors.success : colors.danger },
                ]}
              >
                {technicalReviewValid ? 'Vigente' : 'No vigente'}
              </Text>
              {technicalReviewExpiryDate && (
                <Text style={styles.documentExpiry}>Vence: {technicalReviewExpiryDate}</Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Resumen ejecutivo */}
      {executiveSummary && (
        <View style={styles.section}>
          <Text style={styles.title}>Observaciones del Inspector</Text>
          <View style={styles.card}>
            <Text style={styles.text}>{executiveSummary}</Text>
          </View>
        </View>
      )}

      {/* Recomendaciones */}
      {recommendations && (
        <View style={styles.section}>
          <Text style={styles.title}>Recomendaciones</Text>
          <View style={styles.card}>
            <Text style={styles.text}>{recommendations}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
