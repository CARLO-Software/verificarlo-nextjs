/**
 * LegalReportPDF - Documento PDF del informe legal
 * Diseño profesional estilo Canva con:
 * - Portada con logo, placa y bandera peruana
 * - Resumen del vehículo con iconos de estado
 * - Capturas de cada fuente legal
 */

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Registrar fuentes
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff', fontWeight: 700 },
  ],
});

// Colores del diseño
const colors = {
  black: '#111827',
  white: '#FFFFFF',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  green: '#22C55E',
  yellow: '#F59E0B',
  red: '#EF4444',
  primary: '#FBBF24', // Amarillo VerifiCARLO
};

// Estilos
const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    fontFamily: 'Inter',
    padding: 0,
  },

  // === PORTADA ===
  coverPage: {
    flex: 1,
    backgroundColor: colors.black,
    padding: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverLogo: {
    width: 200,
    marginBottom: 40,
  },
  coverTitle: {
    fontSize: 42,
    fontWeight: 700,
    color: colors.white,
    marginBottom: 16,
    letterSpacing: 2,
  },
  coverSubtitle: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: 60,
    letterSpacing: 1,
  },
  coverPlateContainer: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 8,
    marginBottom: 40,
  },
  coverPlate: {
    fontSize: 36,
    fontWeight: 700,
    color: colors.black,
    letterSpacing: 4,
  },
  coverFlag: {
    width: 60,
    height: 40,
    marginBottom: 40,
  },
  coverDate: {
    fontSize: 14,
    color: colors.gray,
  },
  coverFooter: {
    position: 'absolute',
    bottom: 50,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coverFooterText: {
    fontSize: 10,
    color: colors.gray,
  },

  // === PÁGINA DE RESUMEN ===
  summaryPage: {
    flex: 1,
    padding: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.lightGray,
  },
  headerLogo: {
    width: 120,
  },
  headerInfo: {
    alignItems: 'flex-end',
  },
  headerPlate: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.black,
  },
  headerDate: {
    fontSize: 10,
    color: colors.gray,
    marginTop: 4,
  },

  // Título de sección (negro con texto blanco)
  sectionTitle: {
    backgroundColor: colors.black,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 0,
  },
  sectionTitleText: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.white,
    letterSpacing: 1,
  },

  // Tabla de resumen
  summaryTable: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderTopWidth: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    minHeight: 50,
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryIcon: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
  },
  summaryName: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  summaryNameText: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.black,
  },
  summaryDescription: {
    flex: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.lightGray,
  },
  summaryDescriptionText: {
    fontSize: 10,
    color: colors.gray,
    lineHeight: 1.4,
  },

  // Iconos de estado
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconOK: {
    backgroundColor: colors.green,
  },
  statusIconWARNING: {
    backgroundColor: colors.yellow,
  },
  statusIconCRITICAL: {
    backgroundColor: colors.red,
  },
  statusIconPENDING: {
    backgroundColor: colors.gray,
  },
  statusIconText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: 700,
  },

  // Sección de observaciones
  observationsSection: {
    marginTop: 30,
  },
  observationsContent: {
    backgroundColor: colors.lightGray,
    padding: 20,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  observationsText: {
    fontSize: 11,
    color: colors.black,
    lineHeight: 1.6,
  },

  // === PÁGINAS DE CAPTURAS ===
  screenshotPage: {
    flex: 1,
    padding: 40,
  },
  screenshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  screenshotTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.black,
  },
  screenshotSource: {
    fontSize: 10,
    color: colors.gray,
  },
  screenshotImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 10,
  },
  screenshotImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  screenshotFooter: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  screenshotFooterText: {
    fontSize: 9,
    color: colors.gray,
  },

  // Footer de todas las páginas
  pageFooter: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageNumber: {
    fontSize: 10,
    color: colors.gray,
  },
});

// Tipos
export interface LegalReportField {
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';
  text: string;
}

export interface LegalReportData {
  inspectionId: number;
  plate: string;
  vehicleDescription: string;
  clientName: string;
  date: string;

  // Campos del informe legal
  fields: {
    key: string;
    label: string;
    status: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';
    text: string;
  }[];

  // Observaciones generales
  otherObservations: string;

  // Capturas de pantalla
  screenshots: {
    sourceId: string;
    sourceName: string;
    imageUrl: string;
  }[];
}

// Componente para el icono de estado
function StatusIcon({ status }: { status: string }) {
  const getSymbol = () => {
    switch (status) {
      case 'OK':
        return '✓';
      case 'WARNING':
        return '!';
      case 'CRITICAL':
        return '✗';
      default:
        return '?';
    }
  };

  const getStyle = () => {
    switch (status) {
      case 'OK':
        return styles.statusIconOK;
      case 'WARNING':
        return styles.statusIconWARNING;
      case 'CRITICAL':
        return styles.statusIconCRITICAL;
      default:
        return styles.statusIconPENDING;
    }
  };

  return (
    <View style={[styles.statusIcon, getStyle()]}>
      <Text style={styles.statusIconText}>{getSymbol()}</Text>
    </View>
  );
}

// Componente principal del PDF
export default function LegalReportPDF({ data }: { data: LegalReportData }) {
  // Logo desde el sitio en producción (NEXTAUTH_URL debe apuntar al dominio desplegado)
  const logoUrl = `${process.env.NEXTAUTH_URL}/assets/images/verificarlo-logo.png`;
  // Bandera peruana desde Wikipedia
  const flagUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Flag_of_Peru.svg/200px-Flag_of_Peru.svg.png';

  return (
    <Document>
      {/* PÁGINA 1: PORTADA */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          {/* Logo */}
          <Image src={logoUrl} style={styles.coverLogo} />

          {/* Título */}
          <Text style={styles.coverTitle}>INFORME LEGAL</Text>
          <Text style={styles.coverSubtitle}>VERIFICACIÓN VEHICULAR</Text>

          {/* Placa */}
          <View style={styles.coverPlateContainer}>
            <Text style={styles.coverPlate}>{data.plate || 'SIN PLACA'}</Text>
          </View>

          {/* Bandera */}
          <Image src={flagUrl} style={styles.coverFlag} />

          {/* Fecha */}
          <Text style={styles.coverDate}>{data.date}</Text>

          {/* Footer */}
          <View style={styles.coverFooter}>
            <Text style={styles.coverFooterText}>verificarlo.pe</Text>
            <Text style={styles.coverFooterText}>Inspección #{data.inspectionId}</Text>
          </View>
        </View>
      </Page>

      {/* PÁGINA 2: RESUMEN DEL VEHÍCULO */}
      <Page size="A4" style={styles.page}>
        <View style={styles.summaryPage}>
          {/* Header */}
          <View style={styles.header}>
            <Image src={logoUrl} style={styles.headerLogo} />
            <View style={styles.headerInfo}>
              <Text style={styles.headerPlate}>{data.plate}</Text>
              <Text style={styles.headerDate}>{data.date}</Text>
            </View>
          </View>

          {/* Vehículo Info */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 12, color: colors.gray, marginBottom: 4 }}>
              Vehículo
            </Text>
            <Text style={{ fontSize: 16, fontWeight: 700, color: colors.black }}>
              {data.vehicleDescription}
            </Text>
            <Text style={{ fontSize: 11, color: colors.gray, marginTop: 4 }}>
              Cliente: {data.clientName}
            </Text>
          </View>

          {/* Título de Resumen */}
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>RESUMEN DEL VEHÍCULO</Text>
          </View>

          {/* Tabla de Resumen */}
          <View style={styles.summaryTable}>
            {data.fields.map((field, index) => {
              const isLast = index === data.fields.length - 1;
              return (
                <View
                  key={field.key}
                  style={isLast ? [styles.summaryRow, styles.summaryRowLast] : styles.summaryRow}
                >
                  <View style={styles.summaryIcon}>
                    <StatusIcon status={field.status} />
                  </View>
                  <View style={styles.summaryName}>
                    <Text style={styles.summaryNameText}>{field.label}</Text>
                  </View>
                  <View style={styles.summaryDescription}>
                    <Text style={styles.summaryDescriptionText}>
                      {field.text || 'Sin observaciones'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Observaciones */}
          {data.otherObservations && (
            <View style={styles.observationsSection}>
              <View style={styles.sectionTitle}>
                <Text style={styles.sectionTitleText}>OBSERVACIONES</Text>
              </View>
              <View style={styles.observationsContent}>
                <Text style={styles.observationsText}>
                  {data.otherObservations}
                </Text>
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={styles.pageFooter}>
            <Text style={styles.pageNumber}>verificarlo.pe</Text>
            <Text style={styles.pageNumber}>Página 2</Text>
          </View>
        </View>
      </Page>

      {/* PÁGINAS DE CAPTURAS */}
      {data.screenshots.map((screenshot, index) => (
        <Page key={screenshot.sourceId} size="A4" style={styles.page}>
          <View style={styles.screenshotPage}>
            {/* Header */}
            <View style={styles.screenshotHeader}>
              <View>
                <Text style={styles.screenshotTitle}>{screenshot.sourceName}</Text>
                <Text style={styles.screenshotSource}>
                  Captura de consulta oficial
                </Text>
              </View>
              <Image src={logoUrl} style={{ width: 80 }} />
            </View>

            {/* Imagen */}
            <View style={styles.screenshotImageContainer}>
              <Image src={screenshot.imageUrl} style={styles.screenshotImage} />
            </View>

            {/* Footer */}
            <View style={styles.screenshotFooter}>
              <Text style={styles.screenshotFooterText}>
                Placa: {data.plate} | {data.date}
              </Text>
              <Text style={styles.screenshotFooterText}>
                Página {index + 3}
              </Text>
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
}
