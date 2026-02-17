// ============================================
// PDFCriticalFindings - Hallazgos que requieren atención
// Muestra defectos y observaciones importantes de forma prominente
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
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: colors.graphite,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerIconText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.graphite,
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    padding: 12,
    backgroundColor: colors.offWhite,
  },
  findingRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGray,
  },
  findingRowLast: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
    marginTop: 3,
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
  findingCategory: {
    fontSize: 7,
    color: colors.slate,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  findingItem: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.graphite,
    marginBottom: 2,
  },
  findingComment: {
    fontSize: 8,
    color: colors.charcoal,
    fontStyle: 'italic',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  severityDefecto: {
    backgroundColor: colors.dangerBg,
  },
  severityObservacion: {
    backgroundColor: colors.warningBg,
  },
  severityText: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  severityTextDefecto: {
    color: colors.danger,
  },
  severityTextObservacion: {
    color: colors.warning,
  },
  costSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderGray,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 9,
    color: colors.charcoal,
  },
  costValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.graphite,
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 9,
    color: colors.slate,
  },
});

export default function PDFCriticalFindings({
  findings,
  estimatedCost,
}: PDFCriticalFindingsProps) {
  // Solo mostrar si hay hallazgos
  if (!findings || findings.length === 0) {
    return null;
  }

  // Ordenar: primero defectos, luego observaciones
  const sortedFindings = [...findings].sort((a, b) => {
    if (a.severity === 'DEFECTO' && b.severity !== 'DEFECTO') return -1;
    if (a.severity !== 'DEFECTO' && b.severity === 'DEFECTO') return 1;
    return 0;
  });

  const formatCurrency = (amount: number) => {
    return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>!</Text>
        </View>
        <Text style={styles.headerTitle}>Hallazgos que requieren atención</Text>
      </View>

      <View style={styles.content}>
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
                <Text style={styles.findingCategory}>{finding.category}</Text>
                <Text style={styles.findingItem}>{finding.item}</Text>
                {finding.comment && (
                  <Text style={styles.findingComment}>{finding.comment}</Text>
                )}
              </View>
              <View
                style={[
                  styles.severityBadge,
                  isDefecto ? styles.severityDefecto : styles.severityObservacion,
                ]}
              >
                <Text
                  style={[
                    styles.severityText,
                    isDefecto
                      ? styles.severityTextDefecto
                      : styles.severityTextObservacion,
                  ]}
                >
                  {isDefecto ? 'Defecto' : 'Observación'}
                </Text>
              </View>
            </View>
          );
        })}

        {estimatedCost !== null && estimatedCost !== undefined && estimatedCost > 0 && (
          <View style={styles.costSection}>
            <Text style={styles.costLabel}>Costo estimado de reparaciones:</Text>
            <Text style={styles.costValue}>{formatCurrency(estimatedCost)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
