// ============================================
// PDFChecklist - Checklist detallado
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
    marginBottom: 15,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  category: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.gray[700],
    backgroundColor: colors.gray[100],
    padding: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  itemsContainer: {
    paddingLeft: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  itemName: {
    flex: 3,
    fontSize: 9,
    color: colors.gray[700],
  },
  itemStatus: {
    flex: 1,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  itemComment: {
    flex: 2,
    fontSize: 8,
    color: colors.gray[500],
    fontStyle: 'italic',
  },
});

// Mapeo de nombres de items para mostrar
const ITEM_NAMES: Record<string, string> = {
  // Legal
  'legal-tarjeta-propiedad': 'Tarjeta de propiedad',
  'legal-soat': 'SOAT vigente',
  'legal-revision-tecnica': 'Revision tecnica',
  'legal-placas': 'Placas del vehiculo',
  'legal-siniestros': 'Registro de siniestros',
  // Mecanica
  'mec-motor': 'Estado del motor',
  'mec-transmision': 'Transmision',
  'mec-frenos': 'Sistema de frenos',
  'mec-suspension': 'Suspension',
  'mec-direccion': 'Direccion',
  'mec-escape': 'Sistema de escape',
  'mec-refrigeracion': 'Sistema de refrigeracion',
  'mec-bateria': 'Bateria',
  'mec-luces': 'Sistema de luces',
  'mec-llantas': 'Llantas',
  // Carroceria
  'car-pintura': 'Pintura general',
  'car-golpes': 'Golpes y abolladuras',
  'car-oxidacion': 'Oxidacion',
  'car-parabrisas': 'Parabrisas',
  'car-vidrios': 'Vidrios laterales',
  'car-espejos': 'Espejos',
  'car-puertas': 'Puertas',
  'car-capo': 'Capo',
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
      <Text style={styles.title}>CHECKLIST DE INSPECCION</Text>
      {categories.map((category) => (
        <View key={category.name} style={styles.category}>
          <Text style={styles.categoryTitle}>{category.name}</Text>
          <View style={styles.itemsContainer}>
            {category.items.map((item) => {
              const statusColors = getStatusColor(item.status);
              return (
                <View key={item.id} style={styles.item}>
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
    'Mecanica': [],
    'Carroceria': [],
    'Interior': [],
  };

  for (const [itemId, result] of Object.entries(checklistResults)) {
    if (!result || !result.status) continue;

    let categoryName = 'Legal';
    if (itemId.startsWith('mec-')) categoryName = 'Mecanica';
    else if (itemId.startsWith('car-')) categoryName = 'Carroceria';
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
