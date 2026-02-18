// ============================================
// PDFHeader - Cabecera del informe
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../styles/pdfStyles';

interface PDFHeaderProps {
  reportCode: string;
  date: string;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.brand,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 36,
    height: 36,
    backgroundColor: colors.brand,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.graphite,
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.graphite,
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 7,
    color: colors.slate,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoSection: {
    alignItems: 'flex-end',
  },
  reportCode: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.graphite,
    marginBottom: 2,
  },
  date: {
    fontSize: 8,
    color: colors.slate,
  },
});

export default function PDFHeader({ reportCode, date }: PDFHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoSection}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>V</Text>
        </View>
        <View>
          <Text style={styles.brandName}>VerifiCARLO</Text>
          <Text style={styles.brandTagline}>Inspección Vehicular</Text>
        </View>
      </View>
      <View style={styles.infoSection}>
        <Text style={styles.reportCode}>{reportCode}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
    </View>
  );
}
