// ============================================
// PDFHeader - Logo y encabezado del informe
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../styles/pdfStyles';

interface PDFHeaderProps {
  reportCode: string;
  date: string;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  brandTagline: {
    fontSize: 8,
    color: colors.gray[500],
    marginTop: 2,
  },
  infoSection: {
    alignItems: 'flex-end',
  },
  reportCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  reportDate: {
    fontSize: 9,
    color: colors.gray[500],
    marginTop: 4,
  },
  title: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.gray[700],
    marginTop: 2,
  },
});

export default function PDFHeader({ reportCode, date }: PDFHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.logoSection}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>V</Text>
        </View>
        <View>
          <Text style={styles.brandName}>VerifiCARLO</Text>
          <Text style={styles.brandTagline}>Inspecciones Vehiculares Profesionales</Text>
        </View>
      </View>
      <View style={styles.infoSection}>
        <Text style={styles.reportCode}>{reportCode}</Text>
        <Text style={styles.title}>INFORME DE INSPECCION</Text>
        <Text style={styles.reportDate}>{date}</Text>
      </View>
    </View>
  );
}
