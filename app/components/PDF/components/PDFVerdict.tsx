// ============================================
// PDFVerdict - Veredicto principal del informe
// Rediseño: Más compacto y profesional
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, getVerdictConfig } from '../styles/pdfStyles';

interface PDFVerdictProps {
  status: string;
  estimatedCost?: number | null;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  verdictBox: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  textContainer: {
    flex: 1,
  },
  verdictLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  subtitle: {
    fontSize: 8,
    lineHeight: 1.3,
  },
});

export default function PDFVerdict({ status, estimatedCost }: PDFVerdictProps) {
  const config = getVerdictConfig(status, estimatedCost);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.verdictBox,
          {
            borderColor: config.borderColor,
            backgroundColor: config.bgColor,
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
          <Text style={styles.iconText}>{config.icon}</Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.verdictLabel, { color: config.color }]}>
            {config.label}
          </Text>
          <Text style={[styles.subtitle, { color: config.color }]}>
            {config.subtitle}
          </Text>
        </View>
      </View>
    </View>
  );
}
