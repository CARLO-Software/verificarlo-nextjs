// ============================================
// PDFCriticalFindings - Hallazgos que requieren atención
// Rediseño: Costo prominente + lista compacta de problemas
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../styles/pdfStyles';

interface Finding {
  category: string;
  item: string;
  severity: 'DEFECTO' | 'OBSERVACION';
  comment?: string;
}

interface PDFCriticalFindingsProps {
  findings: Finding[];
  estimatedCost?: number | null;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  // Sección de costo (prominente)
  costSection: {
    backgroundColor: colors.graphite,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 8,
    color: colors.silver,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  costValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.brand,
    marginBottom: 4,
  },
  costHint: {
    fontSize: 8,
    color: colors.white,
    textAlign: 'center',
  },
  // Sección de hallazgos
  findingsSection: {
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 8,
    overflow: 'hidden',
  },
  findingsHeader: {
    backgroundColor: colors.offWhite,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGray,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerIconText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.graphite,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  findingsContent: {
    padding: 12,
  },
  findingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGray,
  },
  findingRowLast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
    marginTop: 2,
  },
  bulletDefecto: {
    backgroundColor: colors.danger,
  },
  bulletObservacion: {
    backgroundColor: colors.warning,
  },
  findingContent: {
    flex: 1,
  },
  findingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  findingItem: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.graphite,
    flex: 1,
  },
  findingCategory: {
    fontSize: 7,
    color: colors.slate,
    textTransform: 'uppercase',
    marginLeft: 8,
  },
  findingComment: {
    fontSize: 8,
    color: colors.charcoal,
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  // Leyenda
  legend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderGray,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  legendText: {
    fontSize: 7,
    color: colors.slate,
  },
});

export default function PDFCriticalFindings({
  findings,
  estimatedCost,
}: PDFCriticalFindingsProps) {
  if (!findings || findings.length === 0) {
    return null;
  }

  // Ordenar: primero defectos, luego observaciones
  const sortedFindings = [...findings].sort((a, b) => {
    if (a.severity === 'DEFECTO' && b.severity !== 'DEFECTO') return -1;
    if (a.severity !== 'DEFECTO' && b.severity === 'DEFECTO') return 1;
    return 0;
  });

  const defectosCount = findings.filter((f) => f.severity === 'DEFECTO').length;
  const observacionesCount = findings.filter((f) => f.severity === 'OBSERVACION').length;

  const formatCurrency = (amount: number) => {
    return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
  };

  return (
    <View style={styles.container}>
      {/* Costo estimado prominente */}
      {estimatedCost !== null && estimatedCost !== undefined && estimatedCost > 0 && (
        <View style={styles.costSection}>
          <Text style={styles.costLabel}>Costo Estimado de Reparaciones</Text>
          <Text style={styles.costValue}>{formatCurrency(estimatedCost)}</Text>
          <Text style={styles.costHint}>
            Use este monto como base de negociación con el vendedor
          </Text>
        </View>
      )}

      {/* Lista de hallazgos */}
      <View style={styles.findingsSection}>
        <View style={styles.findingsHeader}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>!</Text>
          </View>
          <Text style={styles.headerTitle}>
            Hallazgos que requieren atención ({findings.length})
          </Text>
        </View>

        <View style={styles.findingsContent}>
          {sortedFindings.map((finding, index) => {
            const isLast = index === sortedFindings.length - 1;
            const isDefecto = finding.severity === 'DEFECTO';

            return (
              <View
                key={`${finding.category}-${finding.item}-${index}`}
                style={isLast ? styles.findingRowLast : styles.findingRow}
              >
                <View
                  style={[
                    styles.bullet,
                    isDefecto ? styles.bulletDefecto : styles.bulletObservacion,
                  ]}
                />
                <View style={styles.findingContent}>
                  <View style={styles.findingHeader}>
                    <Text style={styles.findingItem}>{finding.item}</Text>
                    <Text style={styles.findingCategory}>{finding.category}</Text>
                  </View>
                  {finding.comment && (
                    <Text style={styles.findingComment}>{finding.comment}</Text>
                  )}
                </View>
              </View>
            );
          })}

          {/* Leyenda */}
          <View style={styles.legend}>
            {defectosCount > 0 && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                <Text style={styles.legendText}>Defecto ({defectosCount})</Text>
              </View>
            )}
            {observacionesCount > 0 && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                <Text style={styles.legendText}>Observación ({observacionesCount})</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
