// ============================================
// PDFEstimatedCost - Costo estimado de reparaciones
// Diseño destacado con mejor jerarquía visual
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../styles/pdfStyles';

interface PDFEstimatedCostProps {
  estimatedCost: number;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderGray,
  },
  header: {
    backgroundColor: colors.graphite,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerIconText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.graphite,
  },
  headerTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  body: {
    backgroundColor: colors.offWhite,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currency: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.graphite,
    marginRight: 4,
  },
  amount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.graphite,
  },
  hint: {
    flex: 1,
    marginLeft: 16,
  },
  hintText: {
    fontSize: 8,
    color: colors.charcoal,
    lineHeight: 1.4,
  },
  hintHighlight: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.graphite,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.brand,
  },
});

export default function PDFEstimatedCost({ estimatedCost }: PDFEstimatedCostProps) {
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('es-PE', { minimumFractionDigits: 2 });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>$</Text>
          </View>
          <Text style={styles.headerTitle}>Costo Estimado de Reparaciones</Text>
        </View>
        <View style={styles.body}>
          <View style={styles.accentBar} />
          <View style={styles.costContainer}>
            <Text style={styles.currency}>S/</Text>
            <Text style={styles.amount}>{formatAmount(estimatedCost)}</Text>
          </View>
          <View style={styles.hint}>
            <Text style={styles.hintText}>
              <Text style={styles.hintHighlight}>Negocie este monto </Text>
              como descuento del precio de venta del vehículo.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
