// ============================================
// PDFChecklist - Checklist detallado (Página 2)
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, getStatusColor } from '../styles/pdfStyles';

interface ChecklistItem {
  id: string;
  name: string;
  status: string;
  comment?: string;
}

interface ChecklistCategory {
  name: string;
  items: ChecklistItem[];
}

interface PDFChecklistProps {
  categories: ChecklistCategory[];
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.graphite,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  category: {
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.white,
    backgroundColor: colors.graphite,
    padding: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  itemsContainer: {
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGray,
  },
  itemLast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  itemAlt: {
    backgroundColor: colors.offWhite,
  },
  itemName: {
    flex: 3,
    fontSize: 8,
    color: colors.charcoal,
  },
  itemStatus: {
    width: 40,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 6,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  itemComment: {
    flex: 2,
    fontSize: 7,
    color: colors.slate,
    fontStyle: 'italic',
    textAlign: 'right',
  },
});

// Mapeo de nombres de items
const ITEM_NAMES: Record<string, string> = {
  // Legal
  'legal-tarjeta-propiedad': 'Tarjeta de propiedad',
  'legal-soat': 'SOAT vigente',
  'legal-revision-tecnica': 'Revisión técnica',
  'legal-placas': 'Placas del vehículo',
  'legal-siniestros': 'Registro de siniestros',
  // Mecánica
  'mec-motor': 'Estado del motor',
  'mec-transmision': 'Transmisión',
  'mec-frenos': 'Sistema de frenos',
  'mec-suspension': 'Suspensión',
  'mec-direccion': 'Dirección',
  'mec-escape': 'Sistema de escape',
  'mec-refrigeracion': 'Sistema de refrigeración',
  'mec-bateria': 'Batería',
  'mec-luces': 'Sistema de luces',
  'mec-llantas': 'Llantas',
  // Carrocería
  'car-pintura': 'Pintura general',
  'car-golpes': 'Golpes y abolladuras',
  'car-oxidacion': 'Oxidación',
  'car-parabrisas': 'Parabrisas',
  'car-vidrios': 'Vidrios laterales',
  'car-espejos': 'Espejos',
  'car-puertas': 'Puertas',
  'car-capo': 'Capó',
  'car-maletero': 'Maletero',
  // Interior
  'int-tablero': 'Tablero',
  'int-asientos': 'Asientos',
  'int-cinturones': 'Cinturones de seguridad',
  'int-aire-acondicionado': 'Aire acondicionado',
  'int-audio': 'Sistema de audio',
  'int-ventanas': 'Elevalunas',
  'int-tapizado': 'Tapizado',
  'int-limpieza': 'Limpieza general',
};

function getItemName(id: string): string {
  return ITEM_NAMES[id] || id;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'OK':
      return 'OK';
    case 'OBSERVACION':
      return 'OBS';
    case 'DEFECTO':
      return 'DEF';
    case 'NO_APLICA':
      return 'N/A';
    default:
      return '-';
  }
}

export default function PDFChecklist({ categories }: PDFChecklistProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalle de Inspección</Text>
      {categories.map((category) => (
        <View key={category.name} style={styles.category}>
          <Text style={styles.categoryTitle}>{category.name}</Text>
          <View style={styles.itemsContainer}>
            {category.items.map((item, index) => {
              const isLast = index === category.items.length - 1;
              const isAlt = index % 2 === 1;
              const statusColors = getStatusColor(item.status);

              return (
                <View
                  key={item.id}
                  style={[
                    isLast ? styles.itemLast : styles.item,
                    isAlt && styles.itemAlt,
                  ]}
                >
                  <Text style={styles.itemName}>{getItemName(item.id)}</Text>
                  <View style={styles.itemStatus}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                      <Text style={[styles.statusText, { color: statusColors.text }]}>
                        {getStatusLabel(item.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemComment}>
                    {item.comment || ''}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

// Helper para transformar checklistResults al formato esperado
export function transformChecklistResults(
  checklistResults: Record<string, { status: string; comment?: string }>
): ChecklistCategory[] {
  const categoriesMap: Record<string, ChecklistItem[]> = {
    'Legal': [],
    'Mecánica': [],
    'Carrocería': [],
    'Interior': [],
  };

  for (const [itemId, result] of Object.entries(checklistResults)) {
    if (!result || !result.status) continue;

    let categoryName = 'Legal';
    if (itemId.startsWith('mec-')) categoryName = 'Mecánica';
    else if (itemId.startsWith('car-')) categoryName = 'Carrocería';
    else if (itemId.startsWith('int-')) categoryName = 'Interior';

    categoriesMap[categoryName].push({
      id: itemId,
      name: getItemName(itemId),
      status: result.status,
      comment: result.comment,
    });
  }

  return Object.entries(categoriesMap)
    .filter(([, items]) => items.length > 0)
    .map(([name, items]) => ({ name, items }));
}

// Extraer hallazgos críticos del checklist
export function extractCriticalFindings(
  checklistResults: Record<string, { status: string; comment?: string }>
): Array<{ category: string; item: string; severity: 'DEFECTO' | 'OBSERVACION'; comment?: string }> {
  const findings: Array<{ category: string; item: string; severity: 'DEFECTO' | 'OBSERVACION'; comment?: string }> = [];

  const categoryNames: Record<string, string> = {
    'legal-': 'Legal',
    'mec-': 'Mecánica',
    'car-': 'Carrocería',
    'int-': 'Interior',
  };

  for (const [itemId, result] of Object.entries(checklistResults)) {
    if (!result || !result.status) continue;
    if (result.status !== 'DEFECTO' && result.status !== 'OBSERVACION') continue;

    let categoryName = 'Legal';
    for (const [prefix, name] of Object.entries(categoryNames)) {
      if (itemId.startsWith(prefix)) {
        categoryName = name;
        break;
      }
    }

    findings.push({
      category: categoryName,
      item: getItemName(itemId),
      severity: result.status as 'DEFECTO' | 'OBSERVACION',
      comment: result.comment,
    });
  }

  return findings;
}
