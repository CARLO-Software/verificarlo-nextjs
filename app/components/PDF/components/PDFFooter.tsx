// ============================================
// PDFFooter - Firma y pie de página
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../styles/pdfStyles';

interface PDFFooterProps {
  inspectorName: string;
  completedAt: string;
  pageNumber?: number;
  totalPages?: number;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderGray,
  },
  signatureBox: {
    width: '45%',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.charcoal,
    marginBottom: 6,
    height: 24,
  },
  signatureLabel: {
    fontSize: 7,
    color: colors.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  signatureValue: {
    fontSize: 9,
    color: colors.graphite,
    fontWeight: 'bold',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderGray,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLogo: {
    width: 14,
    height: 14,
    backgroundColor: colors.brand,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  footerLogoText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.graphite,
  },
  footerText: {
    fontSize: 7,
    color: colors.slate,
  },
  pageNumber: {
    fontSize: 7,
    color: colors.slate,
  },
  disclaimer: {
    fontSize: 6,
    color: colors.silver,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 1.4,
  },
});

export default function PDFFooter({
  inspectorName,
  completedAt,
  pageNumber,
  totalPages,
}: PDFFooterProps) {
  return (
    <View style={styles.container}>
      {/* Sección de firma - solo en la última página */}
      {(!totalPages || pageNumber === totalPages) && (
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Inspector</Text>
            <Text style={styles.signatureValue}>{inspectorName}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Fecha de Inspección</Text>
            <Text style={styles.signatureValue}>{completedAt}</Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.footerLogo}>
            <Text style={styles.footerLogoText}>V</Text>
          </View>
          <Text style={styles.footerText}>
            VerifiCARLO | www.verificarlo.pe
          </Text>
        </View>
        {pageNumber && totalPages && (
          <Text style={styles.pageNumber}>
            {pageNumber} / {totalPages}
          </Text>
        )}
      </View>

      <Text style={styles.disclaimer}>
        Este informe refleja el estado del vehículo al momento de la inspección.
        VerifiCARLO no se responsabiliza por cambios posteriores.
      </Text>
    </View>
  );
}
