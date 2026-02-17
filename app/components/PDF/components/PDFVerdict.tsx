// ============================================
// PDFVerdict - Veredicto principal del informe
// Reemplaza el ScoreCard numérico por un veredicto claro
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, getVerdictConfig } from '../styles/pdfStyles';

interface PDFVerdictProps {
  status: string;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  verdictBox: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  verdictLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  description: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 1.5,
    color: colors.charcoal,
    maxWidth: 400,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: colors.brand,
    marginVertical: 10,
  },
});

export default function PDFVerdict({ status }: PDFVerdictProps) {
  const config = getVerdictConfig(status);

  // Íconos según estado
  const getIconSymbol = () => {
    switch (status) {
      case 'OK':
        return '✓';
      case 'WARNING':
        return '!';
      case 'CRITICAL':
        return '✕';
      default:
        return '?';
    }
  };

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
        <View style={styles.labelContainer}>
          <View style={[styles.icon, { backgroundColor: config.color }]}>
            <Text style={styles.iconText}>{getIconSymbol()}</Text>
          </View>
          <Text style={[styles.verdictLabel, { color: config.color }]}>
            {config.label}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.description}>{config.description}</Text>
      </View>
    </View>
  );
}
