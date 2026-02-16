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
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  signatureBox: {
    width: '45%',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[400],
    marginBottom: 8,
    height: 30,
  },
  signatureLabel: {
    fontSize: 8,
    color: colors.gray[500],
    textAlign: 'center',
  },
  signatureValue: {
    fontSize: 9,
    color: colors.gray[700],
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLogo: {
    width: 16,
    height: 16,
    backgroundColor: colors.primary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  footerLogoText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },
  footerText: {
    fontSize: 7,
    color: colors.gray[400],
  },
  pageNumber: {
    fontSize: 8,
    color: colors.gray[400],
  },
  disclaimer: {
    fontSize: 7,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 8,
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
      {/* Sección de firma - solo en la última página si hay múltiples */}
      {(!totalPages || pageNumber === totalPages) && (
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Firma del Inspector</Text>
            <Text style={styles.signatureValue}>{inspectorName}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Fecha y Hora</Text>
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
            VerifiCARLO - Inspecciones Vehiculares Profesionales | www.verificarlo.pe
          </Text>
        </View>
        {pageNumber && totalPages && (
          <Text style={styles.pageNumber}>
            Pagina {pageNumber} de {totalPages}
          </Text>
        )}
      </View>

      <Text style={styles.disclaimer}>
        Este informe es valido unicamente para el vehiculo y fecha indicados.
        La inspeccion se realizo siguiendo los estandares de calidad de VerifiCARLO.
      </Text>
    </View>
  );
}
