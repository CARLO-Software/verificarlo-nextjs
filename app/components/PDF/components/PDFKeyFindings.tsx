// ============================================
// PDFKeyFindings - Resumen de hallazgos clave
// Muestra: Defectos, Observaciones, Estado Legal, Issues Críticos
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../styles/pdfStyles';

interface KeyFinding {
  category: string;
  item: string;
  severity: 'DEFECTO' | 'OBSERVACION';
  comment?: string;
}

type DocStatus = 'valid' | 'invalid' | 'na';

interface PDFKeyFindingsProps {
  defectCount: number;
  observationCount: number;
  okCount: number;
  soatValid?: boolean;
  soatStatus?: DocStatus;
  technicalReviewValid?: boolean;
  technicalReviewStatus?: DocStatus;
  criticalFindings?: KeyFinding[];
  estimatedCost?: number | null;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  title: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.graphite,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  // Grid de 4 métricas
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  // Sección de hallazgos críticos
  criticalSection: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: 6,
    padding: 10,
  },
  criticalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  criticalIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  criticalIconText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },
  criticalTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.dangerDark,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  criticalList: {
    paddingLeft: 4,
  },
  criticalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  criticalBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.danger,
    marginRight: 8,
    marginTop: 4,
  },
  criticalText: {
    flex: 1,
    fontSize: 8,
    color: colors.dangerDark,
    lineHeight: 1.4,
  },
  criticalCategory: {
    fontSize: 7,
    color: colors.slate,
    marginTop: 2,
    lineHeight: 1.3,
  },
  // Estado de documentos
  docsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  docBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  docDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  docText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  docStatus: {
    fontSize: 7,
    marginLeft: 4,
  },
});

export default function PDFKeyFindings({
  defectCount,
  observationCount,
  okCount,
  soatValid,
  soatStatus,
  technicalReviewValid,
  technicalReviewStatus,
  criticalFindings = [],
  estimatedCost,
}: PDFKeyFindingsProps) {
  const totalPoints = defectCount + observationCount + okCount;
  const hasLegalInfo = soatStatus !== undefined || technicalReviewStatus !== undefined ||
    soatValid !== undefined || technicalReviewValid !== undefined;

  // Determinar el estado efectivo del documento
  const getEffectiveStatus = (status?: DocStatus, valid?: boolean): DocStatus => {
    if (status) return status;
    if (valid !== undefined) return valid ? 'valid' : 'invalid';
    return 'invalid';
  };

  const effectiveSoatStatus = getEffectiveStatus(soatStatus, soatValid);
  const effectiveTechStatus = getEffectiveStatus(technicalReviewStatus, technicalReviewValid);

  // Configuración de colores y texto según estado
  const getDocConfig = (status: DocStatus) => {
    switch (status) {
      case 'valid':
        return {
          bg: colors.successBg,
          border: colors.successBorder,
          dot: colors.success,
          text: colors.successDark,
          label: 'Vigente',
        };
      case 'na':
        return {
          bg: colors.lightGray,
          border: colors.borderGray,
          dot: colors.silver,
          text: colors.slate,
          label: 'No aplica',
        };
      default: // 'invalid'
        return {
          bg: colors.dangerBg,
          border: colors.dangerBorder,
          dot: colors.danger,
          text: colors.dangerDark,
          label: 'No vigente',
        };
    }
  };

  const soatConfig = getDocConfig(effectiveSoatStatus);
  const techConfig = getDocConfig(effectiveTechStatus);
  const topCriticalFindings = criticalFindings
    .filter((f) => f.severity === 'DEFECTO')
    .slice(0, 3);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumen de Hallazgos</Text>

      {/* Grid de métricas */}
      <View style={styles.metricsGrid}>
        {/* Defectos */}
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: defectCount > 0 ? colors.dangerBgStrong : colors.lightGray,
              borderColor: defectCount > 0 ? colors.dangerBorder : colors.borderGray,
            },
          ]}
        >
          <Text
            style={[
              styles.metricNumber,
              { color: defectCount > 0 ? colors.danger : colors.silver },
            ]}
          >
            {defectCount}
          </Text>
          <Text
            style={[
              styles.metricLabel,
              { color: defectCount > 0 ? colors.dangerDark : colors.slate },
            ]}
          >
            Defectos
          </Text>
        </View>

        {/* Observaciones */}
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: observationCount > 0 ? colors.warningBgStrong : colors.lightGray,
              borderColor: observationCount > 0 ? colors.warningBorder : colors.borderGray,
            },
          ]}
        >
          <Text
            style={[
              styles.metricNumber,
              { color: observationCount > 0 ? colors.warning : colors.silver },
            ]}
          >
            {observationCount}
          </Text>
          <Text
            style={[
              styles.metricLabel,
              { color: observationCount > 0 ? colors.warningDark : colors.slate },
            ]}
          >
            Observaciones
          </Text>
        </View>

        {/* OK */}
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: colors.successBg,
              borderColor: colors.successBorder,
            },
          ]}
        >
          <Text style={[styles.metricNumber, { color: colors.success }]}>
            {okCount}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.successDark }]}>
            OK
          </Text>
        </View>

        {/* Total */}
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: colors.offWhite,
              borderColor: colors.borderGray,
            },
          ]}
        >
          <Text style={[styles.metricNumber, { color: colors.graphite }]}>
            {totalPoints}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.slate }]}>
            Puntos
          </Text>
        </View>
      </View>

      {/* Estado de documentos */}
      {hasLegalInfo && (
        <View style={styles.docsRow}>
          {(soatStatus !== undefined || soatValid !== undefined) && (
            <View
              style={[
                styles.docBadge,
                {
                  backgroundColor: soatConfig.bg,
                  borderColor: soatConfig.border,
                },
              ]}
            >
              <View
                style={[
                  styles.docDot,
                  { backgroundColor: soatConfig.dot },
                ]}
              />
              <Text
                style={[
                  styles.docText,
                  { color: soatConfig.text },
                ]}
              >
                SOAT
              </Text>
              <Text
                style={[
                  styles.docStatus,
                  { color: soatConfig.text },
                ]}
              >
                {soatConfig.label}
              </Text>
            </View>
          )}
          {(technicalReviewStatus !== undefined || technicalReviewValid !== undefined) && (
            <View
              style={[
                styles.docBadge,
                {
                  backgroundColor: techConfig.bg,
                  borderColor: techConfig.border,
                },
              ]}
            >
              <View
                style={[
                  styles.docDot,
                  { backgroundColor: techConfig.dot },
                ]}
              />
              <Text
                style={[
                  styles.docText,
                  { color: techConfig.text },
                ]}
              >
                Rev. Técnica
              </Text>
              <Text
                style={[
                  styles.docStatus,
                  { color: techConfig.text },
                ]}
              >
                {techConfig.label}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Hallazgos críticos destacados */}
      {topCriticalFindings.length > 0 && (
        <View style={[styles.criticalSection, { marginTop: hasLegalInfo ? 10 : 0 }]}>
          <View style={styles.criticalHeader}>
            <View style={styles.criticalIcon}>
              <Text style={styles.criticalIconText}>!</Text>
            </View>
            <Text style={styles.criticalTitle}>
              Problemas Críticos Detectados
            </Text>
          </View>
          <View style={styles.criticalList}>
            {topCriticalFindings.map((finding, index) => (
              <View key={index} style={styles.criticalItem}>
                <View style={styles.criticalBullet} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.criticalText}>
                    {finding.item}
                    {finding.comment ? `: ${finding.comment}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
