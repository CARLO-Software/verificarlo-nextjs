// ============================================
// PDFScoreCard - Puntaje general
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, getStatusColor, getStatusText } from '../styles/pdfStyles';

interface PDFScoreCardProps {
  score: number;
  status: string;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  scoreText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scoreMax: {
    fontSize: 10,
    color: colors.gray[400],
  },
  scoreLabel: {
    color: colors.white,
  },
  scoreLabelTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreLabelSubtitle: {
    fontSize: 9,
    opacity: 0.8,
  },
  statusSection: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

export default function PDFScoreCard({ score, status }: PDFScoreCardProps) {
  const statusColors = getStatusColor(status);
  const statusText = getStatusText(status);

  return (
    <View style={styles.container}>
      <View style={styles.scoreSection}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreText}>{score}</Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>
        <View style={styles.scoreLabel}>
          <Text style={styles.scoreLabelTitle}>Puntaje General</Text>
          <Text style={styles.scoreLabelSubtitle}>
            Evaluacion integral del vehiculo
          </Text>
        </View>
      </View>
      <View style={styles.statusSection}>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.text }]}>
            {statusText}
          </Text>
        </View>
      </View>
    </View>
  );
}
