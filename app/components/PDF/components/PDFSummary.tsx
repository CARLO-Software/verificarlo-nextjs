// ============================================
// PDFSummary - Documentación y observaciones (compacto)
// Rediseño: Más conciso, documentos en línea
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../styles/pdfStyles';

interface PDFSummaryProps {
  executiveSummary?: string | null;
  recommendations?: string | null;
  soatValid?: boolean;
  soatExpiryDate?: string | null;
  technicalReviewValid?: boolean;
  technicalReviewExpiryDate?: string | null;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  section: {
    marginBottom: 8,
  },
  title: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.graphite,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  // Documentos en formato horizontal compacto
  documentsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  documentCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
  },
  documentValid: {
    borderColor: colors.successBorder,
    backgroundColor: colors.successBg,
  },
  documentInvalid: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBg,
  },
  documentIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  documentContent: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.graphite,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  documentStatus: {
    fontSize: 7,
    fontWeight: 'bold',
  },
  documentExpiry: {
    fontSize: 7,
    color: colors.slate,
    marginLeft: 4,
  },
  // Observaciones
  card: {
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 6,
    padding: 10,
  },
  text: {
    fontSize: 8,
    color: colors.charcoal,
    lineHeight: 1.5,
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
  const showDocuments = soatValid !== undefined || technicalReviewValid !== undefined;
  const hasContent = showDocuments || executiveSummary || recommendations;

  if (!hasContent) return null;

  return (
    <View style={styles.container}>
      {/* Estado de documentos (formato horizontal compacto) */}
      {showDocuments && (
        <View style={styles.section}>
          <Text style={styles.title}>Documentación</Text>
          <View style={styles.documentsRow}>
            {/* SOAT */}
            <View
              style={[
                styles.documentCard,
                soatValid ? styles.documentValid : styles.documentInvalid,
              ]}
            >
              <View
                style={[
                  styles.documentIndicator,
                  { backgroundColor: soatValid ? colors.success : colors.danger },
                ]}
              />
              <View style={styles.documentContent}>
                <Text style={styles.documentTitle}>SOAT</Text>
                <View style={styles.documentInfo}>
                  <Text
                    style={[
                      styles.documentStatus,
                      { color: soatValid ? colors.success : colors.danger },
                    ]}
                  >
                    {soatValid ? 'Vigente' : 'No vigente'}
                  </Text>
                  {soatExpiryDate && (
                    <Text style={styles.documentExpiry}>• Vence: {soatExpiryDate}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Revisión Técnica */}
            <View
              style={[
                styles.documentCard,
                technicalReviewValid ? styles.documentValid : styles.documentInvalid,
              ]}
            >
              <View
                style={[
                  styles.documentIndicator,
                  {
                    backgroundColor: technicalReviewValid
                      ? colors.success
                      : colors.danger,
                  },
                ]}
              />
              <View style={styles.documentContent}>
                <Text style={styles.documentTitle}>Revisión Técnica</Text>
                <View style={styles.documentInfo}>
                  <Text
                    style={[
                      styles.documentStatus,
                      { color: technicalReviewValid ? colors.success : colors.danger },
                    ]}
                  >
                    {technicalReviewValid ? 'Vigente' : 'No vigente'}
                  </Text>
                  {technicalReviewExpiryDate && (
                    <Text style={styles.documentExpiry}>
                      • Vence: {technicalReviewExpiryDate}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Observaciones del inspector */}
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
