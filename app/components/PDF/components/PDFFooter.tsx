// ============================================
// PDFFooter - Firma y pie de página (credibilidad reforzada)
// Rediseño: Más elementos de autoridad y verificabilidad
//
// 📚 CONCEPTO REACT-PDF - Paginación Dinámica:
// react-pdf permite usar `render` prop en <Text> para acceder a
// pageNumber y totalPages dinámicamente. Esto es útil cuando
// el contenido puede generar múltiples páginas automáticamente.
// Sintaxis: <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
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
  // 📚 CONCEPTO REACT - Props booleanos opcionales:
  // En lugar de calcular si es última página, pasamos explícitamente
  // si queremos mostrar la firma. Esto es más claro y predecible.
  showSignature?: boolean;
}

const styles = StyleSheet.create({
  // Contenedor para la firma (posición arriba del footer básico)
  signatureContainer: {
    position: 'absolute',
    bottom: 65, // Arriba del footer básico
    left: 30,
    right: 30,
  },
  // Contenedor para el footer básico (se repite en todas las páginas con fixed)
  basicFooterContainer: {
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
  showSignature = false,
}: PDFFooterProps) {
  // 📚 CONCEPTO REACT - Valores por defecto en destructuración:
  // showSignature = false significa que si no se pasa, será false

  return (
    <>
      {/* 📚 CONCEPTO REACT-PDF - Prop `fixed`:
          El footer básico es fixed para que aparezca en TODAS las páginas
          generadas automáticamente (incluyendo las de wrap) */}
      <View style={styles.basicFooterContainer} fixed>
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.footerLogo}>
              <Text style={styles.footerLogoText}>V</Text>
            </View>
            <Text style={styles.footerText}>VerifiCARLO</Text>
            <Text style={styles.footerContact}>soporte@verificarlo.pe</Text>
          </View>
          {/* 📚 CONCEPTO REACT-PDF - Función render:
              Usamos `render` para obtener pageNumber y totalPages dinámicamente */}
          <Text
            style={styles.pageNumber}
            render={({ pageNumber: pn, totalPages: tp }) =>
              `Página ${pn} de ${tp}`
            }
          />
        </View>

        <Text style={styles.disclaimer}>
          Este informe refleja las condiciones del vehículo al momento de la inspección
          visual. VerifiCARLO no se responsabiliza por defectos ocultos no detectables sin
          desmontaje, ni por cambios posteriores al vehículo. Inspección realizada según
          protocolo estandarizado de 50 puntos.
        </Text>
      </View>

      {/* Sección de firma - NO es fixed, solo aparece una vez al final de la última página */}
      {showSignature && (
        <View style={styles.signatureContainer}>
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
        </View>
      )}
    </>
  );
}
