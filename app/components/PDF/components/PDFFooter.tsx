// ============================================
// PDFFooter - Firma y pie de página (credibilidad reforzada)
// Rediseño: Más elementos de autoridad y verificabilidad
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../styles/pdfStyles';

interface PDFFooterProps {
  inspectorName: string;
  completedAt: string;
  pageNumber?: number;
  totalPages?: number;
  reportCode?: string;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: colors.brand,
  },
  signatureBox: {
    width: '30%',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.charcoal,
    marginBottom: 4,
    height: 16,
  },
  signatureLabel: {
    fontSize: 6,
    color: colors.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  signatureValue: {
    fontSize: 8,
    color: colors.graphite,
    fontWeight: 'bold',
    marginTop: 2,
  },
  // Sección de verificación
  verificationBox: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.offWhite,
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.borderGray,
  },
  verificationLabel: {
    fontSize: 5,
    color: colors.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  verificationUrl: {
    fontSize: 6,
    color: colors.graphite,
    fontWeight: 'bold',
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
  footerContact: {
    fontSize: 6,
    color: colors.silver,
    marginLeft: 8,
  },
  pageNumber: {
    fontSize: 7,
    color: colors.slate,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 5,
    color: colors.silver,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 1.4,
  },
});

export default function PDFFooter({
  inspectorName,
  completedAt,
  pageNumber,
  totalPages,
}: PDFFooterProps) {
  const isLastPage = !totalPages || pageNumber === totalPages;

  return (
    <View style={styles.container}>
      {/* Sección de firma - solo en la última página */}
      {isLastPage && (
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Inspector Certificado</Text>
            <Text style={styles.signatureValue}>{inspectorName}</Text>
          </View>

          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Fecha y Hora</Text>
            <Text style={styles.signatureValue}>{completedAt}</Text>
          </View>

          <View style={styles.verificationBox}>
            <Text style={styles.verificationLabel}>Verificar este informe en</Text>
            <Text style={styles.verificationUrl}>verificarlo.pe/validar</Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.footerLogo}>
            <Text style={styles.footerLogoText}>V</Text>
          </View>
          <Text style={styles.footerText}>VerifiCARLO</Text>
          <Text style={styles.footerContact}>soporte@verificarlo.pe</Text>
        </View>
        {pageNumber && totalPages && (
          <Text style={styles.pageNumber}>
            Página {pageNumber} de {totalPages}
          </Text>
        )}
      </View>

      <Text style={styles.disclaimer}>
        Este informe refleja las condiciones del vehículo al momento de la inspección
        visual. VerifiCARLO no se responsabiliza por defectos ocultos no detectables sin
        desmontaje, ni por cambios posteriores al vehículo. Inspección realizada según
        protocolo estandarizado de 50 puntos.
      </Text>
    </View>
  );
}
