// ============================================
// PDFSummary - Notas del inspector
// REDISEÑO: Solo observaciones (docs están en KeyFindings)
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../styles/pdfStyles';

interface PDFSummaryProps {
  executiveSummary?: string | null;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  title: {
    fontSize: 9,
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
    padding: 12,
  },
  text: {
    fontSize: 9,
    color: colors.charcoal,
    lineHeight: 1.5,
  },
});

export default function PDFSummary({ executiveSummary }: PDFSummaryProps) {
  if (!executiveSummary) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notas del Inspector</Text>
      <View style={styles.card}>
        <Text style={styles.text}>{executiveSummary}</Text>
      </View>
    </View>
  );
}
