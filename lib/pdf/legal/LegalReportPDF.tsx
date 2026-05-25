/**
 * LegalReportPDF - Documento PDF del informe legal
 * Diseño con layout de 2 columnas para el resumen
 */

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';

// Nota: Helvetica es una fuente incorporada en @react-pdf/renderer, no necesita registrarse

// Colores del diseño
const colors = {
  black: '#1a1a1a',
  white: '#FFFFFF',
  gray: '#6B7280',
  lightGray: '#F5F5F5',
  green: '#22C55E',
  yellow: '#F59E0B',
  red: '#EF4444',
  primary: '#FBBF24',
};

// Estilos
const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    fontFamily: 'Helvetica',
    padding: 0,
  },

  // === PORTADA ===
  coverPage: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverLogo: {
    width: 180,
    marginBottom: 40,
  },
  coverLogoText: {
    fontSize: 48,
    fontWeight: 700,
    color: colors.black,
    marginBottom: 40,
    letterSpacing: 2,
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: 700,
    color: colors.black,
    marginBottom: 12,
    letterSpacing: 2,
  },
  coverSubtitle: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 50,
    letterSpacing: 1,
  },
  coverPlateContainer: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 6,
    marginBottom: 50,
  },
  coverPlate: {
    fontSize: 32,
    fontWeight: 700,
    color: colors.black,
    letterSpacing: 3,
  },
  coverDate: {
    fontSize: 12,
    color: colors.black,
  },
  coverFooter: {
    position: 'absolute',
    bottom: 40,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coverFooterText: {
    fontSize: 9,
    color: colors.black,
  },

  // === PÁGINA DE RESUMEN ===
  summaryPage: {
    flex: 1,
    padding: 30,
  },

  // Header del resumen con logo
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  summaryHeaderLeft: {
    flexDirection: 'column',
  },
  summaryHeaderTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.black,
    marginBottom: 4,
  },
  summaryHeaderSubtitle: {
    fontSize: 9,
    color: colors.gray,
  },
  summaryHeaderLogo: {
    width: 120,
    height: 'auto',
  },

  // Título de sección
  sectionTitle: {
    backgroundColor: colors.black,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 0,
  },
  sectionTitleText: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 1,
  },

  // Grid de 2 columnas
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderTopWidth: 0,
  },
  gridItem: {
    width: '50%',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    padding: 8,
    minHeight: 50,
  },
  gridItemRight: {
    borderLeftWidth: 1,
    borderLeftColor: '#E5E5E5',
  },
  // Fondos de estado para los items
  gridItemOK: {
    backgroundColor: '#F0FDF4', // Verde muy claro
  },
  gridItemWARNING: {
    backgroundColor: '#FFFBEB', // Amarillo muy claro
  },
  gridItemCRITICAL: {
    backgroundColor: '#FEF2F2', // Rojo muy claro
  },
  gridItemPENDING: {
    backgroundColor: colors.white,
  },

  // Icono y badge de estado
  iconContainer: {
    width: 36,
    height: 36,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fieldIcon: {
    width: 28,
    height: 28,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  checkBadgeOK: {
    backgroundColor: colors.green,
  },
  checkBadgeWARNING: {
    backgroundColor: colors.yellow,
  },
  checkBadgeCRITICAL: {
    backgroundColor: colors.red,
  },
  checkBadgePENDING: {
    backgroundColor: colors.gray,
  },
  checkText: {
    fontSize: 9,
    color: colors.white,
    fontWeight: 700,
  },

  // Contenido del item
  itemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  itemLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  itemLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: colors.black,
  },
  // Indicador de estado con icono
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 6,
    gap: 3,
  },
  statusIndicatorOK: {
    backgroundColor: colors.green,
  },
  statusIndicatorWARNING: {
    backgroundColor: colors.yellow,
  },
  statusIndicatorCRITICAL: {
    backgroundColor: colors.red,
  },
  statusIndicatorPENDING: {
    backgroundColor: colors.gray,
  },
  statusIcon: {
    fontSize: 8,
    fontWeight: 700,
    color: colors.white,
  },
  statusIndicatorText: {
    fontSize: 7,
    fontWeight: 700,
    color: colors.white,
  },
  itemText: {
    fontSize: 7,
    color: colors.gray,
    lineHeight: 1.3,
  },
  // Texto de observación con color según estado
  itemTextOK: {
    color: '#166534', // Verde oscuro
  },
  itemTextWARNING: {
    color: '#92400E', // Amarillo oscuro
  },
  itemTextCRITICAL: {
    color: '#991B1B', // Rojo oscuro
    fontWeight: 700,
  },
  // Información extra (fecha de vencimiento, monto, etc.)
  itemExtraInfo: {
    fontSize: 7,
    color: '#6366F1', // Púrpura
    marginTop: 2,
    fontWeight: 600,
  },

  // Sección de observaciones
  observationsSection: {
    marginTop: 12,
  },
  observationsContent: {
    backgroundColor: colors.lightGray,
    padding: 12,
    minHeight: 60,
  },
  observationsBullet: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletPoint: {
    fontSize: 8,
    marginRight: 6,
    color: colors.black,
  },
  observationsText: {
    fontSize: 8,
    color: colors.black,
    flex: 1,
    lineHeight: 1.4,
  },

  // Disclaimer
  disclaimer: {
    position: 'absolute',
    bottom: 25,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 8,
  },
  disclaimerText: {
    fontSize: 5.5,
    color: colors.gray,
    lineHeight: 1.4,
    marginBottom: 3,
  },

  // === PÁGINAS DE CAPTURAS ===
  screenshotPage: {
    flex: 1,
    padding: 30,
  },
  screenshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  screenshotLogo: {
    width: 70,
  },
  screenshotTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.black,
  },
  screenshotSource: {
    fontSize: 9,
    color: colors.gray,
  },
  screenshotImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    padding: 8,
  },
  screenshotImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  screenshotFooter: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  screenshotFooterText: {
    fontSize: 8,
    color: colors.gray,
  },

  // === PÁGINA DE CIERRE ===
  closingPage: {
    flex: 1,
    padding: 50,
    justifyContent: 'space-between',
  },
  closingHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  closingLogoText: {
    fontSize: 32,
    fontWeight: 700,
    color: colors.black,
    letterSpacing: 2,
  },
  closingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closingTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.black,
    marginBottom: 30,
    textAlign: 'center',
  },
  closingBox: {
    backgroundColor: colors.lightGray,
    padding: 30,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  closingLabel: {
    fontSize: 10,
    color: colors.gray,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  closingValue: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.black,
    marginBottom: 20,
  },
  closingDivider: {
    width: '60%',
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 20,
  },
  closingCompany: {
    fontSize: 12,
    color: colors.black,
    marginTop: 10,
  },
  closingCompanyName: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.black,
    marginTop: 6,
  },
  closingFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 20,
    alignItems: 'center',
  },
  closingFooterText: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 4,
  },
  closingFooterBold: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.black,
  },
  closingPageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 50,
    fontSize: 8,
    color: colors.gray,
  },
});

// Tipos
export interface LegalReportData {
  inspectionId: number;
  plate: string;
  vehicleDescription: string;
  clientName: string;
  date: string;
  fields: {
    key: string;
    label: string;
    status: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';
    text: string;
  }[];
  otherObservations: string;
  screenshots: {
    sourceId: string;
    sourceName: string;
    imageUrl: string;
  }[];
  inspectorName: string;
  totalPages: number;
  // Campos adicionales
  soatExpiryDate?: string | null;
  techReviewExpiryDate?: string | null;
  techReviewNotes?: string | null;
  lastTransferPrice?: string | null;
}

// Base URL para iconos
const ICONS_BASE_URL = 'https://verificarlo.com/assets/images/icons';

// Mapeo de campos a iconos
const FIELD_ICONS: Record<string, string> = {
  ownerHistory: `${ICONS_BASE_URL}/propietarios.png`,
  lastTransfer: `${ICONS_BASE_URL}/transferencia.png`,
  sunarpLiens: `${ICONS_BASE_URL}/gravamenes.png`,
  satCaptureOrder: `${ICONS_BASE_URL}/captura.png`,
  soat: `${ICONS_BASE_URL}/soat.png`,
  techReview: `${ICONS_BASE_URL}/revision.png`,
  vehicleTax: `${ICONS_BASE_URL}/impuesto.png`,
  gasConversion: `${ICONS_BASE_URL}/gas.png`,
  satTickets: `${ICONS_BASE_URL}/papeleta.png`,
  callaoTickets: `${ICONS_BASE_URL}/papeleta.png`,
  atuTickets: `${ICONS_BASE_URL}/papeleta.png`,
  sutranTickets: `${ICONS_BASE_URL}/sutran.png`,
  transportRegistry: `${ICONS_BASE_URL}/transporte.png`,
  siniestroSoat: `${ICONS_BASE_URL}/siniestro.png`,
  accidentHistory: `${ICONS_BASE_URL}/seguro.png`,
};

// Componente para el badge de estado
function StatusBadge({ status }: { status: string }) {
  const getSymbol = () => {
    switch (status) {
      case 'OK': return '√';
      case 'WARNING': return '!';
      case 'CRITICAL': return 'X';
      default: return '?';
    }
  };

  const getBadgeStyle = () => {
    switch (status) {
      case 'OK': return styles.checkBadgeOK;
      case 'WARNING': return styles.checkBadgeWARNING;
      case 'CRITICAL': return styles.checkBadgeCRITICAL;
      default: return styles.checkBadgePENDING;
    }
  };

  return (
    <View style={[styles.checkBadge, getBadgeStyle()]}>
      <Text style={styles.checkText}>{getSymbol()}</Text>
    </View>
  );
}

// Obtener el estilo de fondo según estado
function getItemBgStyle(status: string) {
  switch (status) {
    case 'OK': return styles.gridItemOK;
    case 'WARNING': return styles.gridItemWARNING;
    case 'CRITICAL': return styles.gridItemCRITICAL;
    default: return styles.gridItemPENDING;
  }
}

// Obtener el estilo del indicador según estado
function getStatusIndicatorStyle(status: string) {
  switch (status) {
    case 'OK': return styles.statusIndicatorOK;
    case 'WARNING': return styles.statusIndicatorWARNING;
    case 'CRITICAL': return styles.statusIndicatorCRITICAL;
    default: return styles.statusIndicatorPENDING;
  }
}

// Obtener el estilo del texto según estado
function getItemTextStyle(status: string) {
  switch (status) {
    case 'OK': return styles.itemTextOK;
    case 'WARNING': return styles.itemTextWARNING;
    case 'CRITICAL': return styles.itemTextCRITICAL;
    default: return {};
  }
}

// Obtener el texto e icono del indicador según estado
function getStatusLabel(status: string): { icon: string; text: string } {
  switch (status) {
    case 'OK': return { icon: '√', text: 'OK' };
    case 'WARNING': return { icon: '!', text: 'OBSERVACIÓN' };
    case 'CRITICAL': return { icon: 'X', text: 'CRÍTICO' };
    default: return { icon: '?', text: 'PENDIENTE' };
  }
}

// Obtener texto por defecto según estado
function getDefaultText(status: string): string {
  switch (status) {
    case 'OK': return 'Sin problemas detectados';
    case 'WARNING': return 'Requiere atención';
    case 'CRITICAL': return 'Problema detectado';
    default: return 'Pendiente de verificación';
  }
}

// Componente para cada item del grid
function GridItem({
  field,
  isRight,
  extraInfo
}: {
  field: { key: string; label: string; status: string; text: string };
  isRight: boolean;
  extraInfo?: string | null;
}) {
  const iconUrl = FIELD_ICONS[field.key];
  const baseStyle = isRight ? [styles.gridItem, styles.gridItemRight] : [styles.gridItem];
  const bgStyle = getItemBgStyle(field.status);
  const displayText = field.text || getDefaultText(field.status);

  return (
    <View style={[...baseStyle, bgStyle]}>
      <View style={styles.iconContainer}>
        {iconUrl && <Image src={iconUrl} style={styles.fieldIcon} />}
        <StatusBadge status={field.status} />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemLabelRow}>
          <Text style={styles.itemLabel}>{field.label}</Text>
          <View style={[styles.statusIndicator, getStatusIndicatorStyle(field.status)]}>
            <Text style={styles.statusIcon}>{getStatusLabel(field.status).icon}</Text>
            <Text style={styles.statusIndicatorText}>{getStatusLabel(field.status).text}</Text>
          </View>
        </View>
        <Text style={[styles.itemText, getItemTextStyle(field.status)]}>
          {displayText}
        </Text>
        {extraInfo && (
          <Text style={styles.itemExtraInfo}>{extraInfo}</Text>
        )}
      </View>
    </View>
  );
}

// Disclaimer text
const DISCLAIMER_LINES = [
  'i) El informe de CARLO se basa en información disponible a la fecha de emisión. Sin embargo, podría haber datos que no se hayan reportado o que se hayan actualizado después de esa fecha.',
  'ii) Usa la información del informe como una guía para conocer mejor el vehículo. Te ayudará a reducir riesgos y negociar un precio más justo. Complementa esto con una revisión mecánica.',
  'iii) El informe de CARLO incluye datos en tiempo real y de fuentes externas. Por esta razón, no puede garantizar ni certificar toda la información presentada.',
];

// Componente principal del PDF
export default function LegalReportPDF({ data }: { data: LegalReportData }) {
  // Logo negativo desde el sitio de producción
  const logoUrl = 'https://verificarlo.com/assets/images/negativo.png';

  // Organizar campos en pares para el grid de 2 columnas
  const fieldPairs: Array<[typeof data.fields[0], typeof data.fields[0] | null]> = [];
  for (let i = 0; i < data.fields.length; i += 2) {
    fieldPairs.push([data.fields[i], data.fields[i + 1] || null]);
  }

  return (
    <Document>
      {/* PÁGINA 1: PORTADA */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Text style={styles.coverLogoText}>VerifiCARLO</Text>

          <Text style={styles.coverTitle}>INFORME LEGAL</Text>
          <Text style={styles.coverSubtitle}>VERIFICACION VEHICULAR</Text>

          <View style={styles.coverPlateContainer}>
            <Text style={styles.coverPlate}>{data.plate || 'SIN PLACA'}</Text>
          </View>

          <Text style={styles.coverDate}>{data.date}</Text>

          <View style={styles.coverFooter}>
            <Text style={styles.coverFooterText}>verificarlo.com</Text>
            <Text style={styles.coverFooterText}>Inspeccion #{data.inspectionId}</Text>
          </View>
        </View>
      </Page>

      {/* PÁGINA 2: RESUMEN DEL VEHÍCULO (todo en una página) */}
      <Page size="A4" style={styles.page}>
        <View style={styles.summaryPage}>
          {/* Header con logo */}
          <View style={styles.summaryHeader}>
            <View style={styles.summaryHeaderLeft}>
              <Text style={styles.summaryHeaderTitle}>{data.vehicleDescription}</Text>
              <Text style={styles.summaryHeaderSubtitle}>Placa: {data.plate} | Cliente: {data.clientName}</Text>
            </View>
            <Image src="https://verificarlo.com/assets/images/negativo.png" style={styles.summaryHeaderLogo} />
          </View>

          {/* Título */}
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>RESUMEN DEL VEHICULO</Text>
          </View>

          {/* Grid de 2 columnas */}
          <View style={styles.gridContainer}>
            {fieldPairs.map((pair, index) => {
              // Función para obtener info extra según el campo
              const getExtraInfo = (field: typeof pair[0]) => {
                if (!field) return null;
                if (field.key === 'soat' && data.soatExpiryDate) {
                  return `Vence: ${data.soatExpiryDate}`;
                }
                if (field.key === 'techReview' && data.techReviewNotes) {
                  return data.techReviewNotes;
                }
                if (field.key === 'lastTransfer' && data.lastTransferPrice) {
                  return `Monto: ${data.lastTransferPrice}`;
                }
                return null;
              };

              return (
                <React.Fragment key={index}>
                  <GridItem field={pair[0]} isRight={false} extraInfo={getExtraInfo(pair[0])} />
                  {pair[1] && <GridItem field={pair[1]} isRight={true} extraInfo={getExtraInfo(pair[1])} />}
                  {!pair[1] && <View style={[styles.gridItem, styles.gridItemRight]} />}
                </React.Fragment>
              );
            })}
          </View>

          {/* Observaciones */}
          <View style={styles.observationsSection}>
            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>OTRAS OBSERVACIONES</Text>
            </View>
            <View style={styles.observationsContent}>
              {data.otherObservations ? (
                data.otherObservations.split('\n').map((line, i) => (
                  <View key={i} style={styles.observationsBullet}>
                    <Text style={styles.bulletPoint}>-</Text>
                    <Text style={styles.observationsText}>{line.trim()}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.observationsText}>Sin observaciones adicionales.</Text>
              )}
            </View>
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            {DISCLAIMER_LINES.map((line, i) => (
              <Text key={i} style={styles.disclaimerText}>{line}</Text>
            ))}
          </View>
        </View>
      </Page>

      {/* PÁGINAS DE CAPTURAS */}
      {data.screenshots.map((screenshot, index) => (
        <Page key={`${screenshot.sourceId}-${index}`} size="A4" style={styles.page}>
          <View style={styles.screenshotPage}>
            <View style={styles.screenshotHeader}>
              <View>
                <Text style={styles.screenshotTitle}>{screenshot.sourceName}</Text>
                <Text style={styles.screenshotSource}>Captura de consulta oficial</Text>
              </View>
              <Image src={logoUrl} style={styles.screenshotLogo} />
            </View>

            <View style={styles.screenshotImageContainer}>
              <Image src={screenshot.imageUrl} style={styles.screenshotImage} />
            </View>

            <View style={styles.screenshotFooter}>
              <Text style={styles.screenshotFooterText}>
                Placa: {data.plate} | {data.date}
              </Text>
              <Text style={styles.screenshotFooterText}>
                Pagina {index + 3}
              </Text>
            </View>
          </View>
        </Page>
      ))}

      {/* PÁGINA DE CIERRE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.closingPage}>
          <View style={styles.closingHeader}>
            <Text style={styles.closingLogoText}>VerifiCARLO</Text>
          </View>

          <View style={styles.closingContent}>
            <Text style={styles.closingTitle}>FIN DEL INFORME LEGAL</Text>

            <View style={styles.closingBox}>
              <Text style={styles.closingLabel}>Elaborado por</Text>
              <Text style={styles.closingValue}>{data.inspectorName}</Text>

              <View style={styles.closingDivider} />

              <Text style={styles.closingLabel}>Empresa</Text>
              <Text style={styles.closingCompanyName}>CARLO S.A.C.</Text>
              <Text style={styles.closingCompany}>Servicios de Verificación Vehicular</Text>

              <View style={styles.closingDivider} />

              <Text style={styles.closingLabel}>Fecha de emisión</Text>
              <Text style={styles.closingValue}>{data.date}</Text>

              <Text style={styles.closingLabel}>Vehículo inspeccionado</Text>
              <Text style={styles.closingValue}>{data.plate}</Text>
            </View>
          </View>

          <View style={styles.closingFooter}>
            <Text style={styles.closingFooterText}>
              Este informe ha sido elaborado con información verificada en fuentes oficiales.
            </Text>
            <Text style={styles.closingFooterText}>
              Para consultas: contacto@verificarlo.com | www.verificarlo.com
            </Text>
            <Text style={styles.closingFooterBold}>
              Gracias por confiar en VerifiCARLO
            </Text>
          </View>

          <Text style={styles.closingPageNumber}>
            Pagina {data.totalPages}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
