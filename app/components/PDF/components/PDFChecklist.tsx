// ============================================
// PDFChecklist - Detalle de inspección (formato compacto)
// Rediseño: OBS/DEF con detalle, OK en texto corrido
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../styles/pdfStyles';

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
    marginBottom: 14,
  },
  categoryHeader: {
    // 📚 CONCEPTO CSS - Flex wrap:
    // Cambiamos a wrap para que si el contenido es largo, baje a la siguiente línea
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.graphite,
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    gap: 4,
  },
  categoryTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    // Ancho mínimo para evitar que el badge lo aplaste
    minWidth: 80,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    // Flex shrink para que se ajuste si no hay espacio
    flexShrink: 1,
  },
  categoryBadgeText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: colors.graphite,
  },
  // Hallazgos (defectos y observaciones)
  findingsContainer: {
    marginBottom: 8,
  },
  findingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.offWhite,
    borderRadius: 4,
    marginBottom: 4,
  },
  findingBullet: {
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
  findingName: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.graphite,
    marginBottom: 2,
  },
  findingComment: {
    fontSize: 7,
    color: colors.charcoal,
    fontStyle: 'italic',
  },
  findingSeverity: {
    fontSize: 6,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  severityDefecto: {
    backgroundColor: colors.dangerBg,
    color: colors.danger,
  },
  severityObservacion: {
    backgroundColor: colors.warningBg,
    color: colors.warning,
  },
  // Items OK (texto corrido)
  okSection: {
    backgroundColor: colors.successBg,
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  okHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  okIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  okIconText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.white,
  },
  okTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.success,
  },
  okText: {
    fontSize: 7,
    color: colors.charcoal,
    lineHeight: 1.6,
  },
  // Cuando todo está OK
  allOkSection: {
    backgroundColor: colors.successBg,
    borderRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  allOkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  allOkIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  allOkIconText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.white,
  },
  allOkTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.success,
  },
  allOkText: {
    fontSize: 7,
    color: colors.charcoal,
    lineHeight: 1.6,
  },
  // Estilos para items "No Aplica"
  noAplicaSection: {
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.borderGray,
    marginTop: 6,
  },
  noAplicaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  noAplicaIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.silver,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  noAplicaIconText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: colors.white,
  },
  noAplicaTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.slate,
  },
  noAplicaText: {
    fontSize: 7,
    color: colors.slate,
    lineHeight: 1.6,
  },
});

// Mapeo de nombres de items
const ITEM_NAMES: Record<string, string> = {
  // Legal - Documentación
  'legal-tarjeta-propiedad': 'Tarjeta de propiedad',
  'legal-revision-tecnica': 'Revisión técnica',
  'legal-soat': 'SOAT vigente',
  'legal-permiso-lunas': 'Permiso de lunas',
  'legal-manual-instrucciones': 'Manual de instrucciones',
  'legal-cartilla-servicio': 'Cartilla de servicio',
  // Legal - Identificación
  'legal-vin-placa': 'Coincidencia VIN/placa',
  // Legal - Accesorios
  'legal-llaves': '2 llaves',
  'legal-llanta-repuesto': 'Llanta de repuesto',
  'legal-tapa-maletera': 'Tapa de maletera',
  'legal-seguro-aros': 'Seguro de aros',
  // Mecánica - Motor
  'mec-sonidos-motor': 'Sonidos del motor',
  'mec-fugas-aceite': 'Fugas de aceite',
  'mec-fugas-refrigerante': 'Fugas de refrigerante',
  'mec-nivel-aceite-motor': 'Nivel de aceite motor',
  'mec-nivel-aceite-caja': 'Nivel de aceite de caja',
  'mec-nivel-refrigerante': 'Nivel de refrigerante',
  'mec-sin-manipulacion': 'Motor sin manipulación',
  'mec-estado-bateria': 'Estado de batería',
  // Mecánica - Parte inferior
  'mec-fugas-inferiores': 'Fugas inferiores',
  'mec-golpes-suspension': 'Golpes en suspensión',
  'mec-tubo-escape': 'Tubo de escape',
  'mec-oxido-estructural': 'Óxido estructural',
  // Mecánica - Suspensión y dirección
  'mec-funcionamiento-suspension': 'Estado de suspensión',
  'mec-direccion': 'Dirección',
  // Mecánica - Frenos
  'mec-funcionamiento-frenos': 'Funcionamiento de frenos',
  // Prueba de Ruta (se mueven de Mecánica a su propia categoría)
  'mec-vibracion-ruido-freno': 'Vibración al frenar',
  'mec-funcionamiento-caja': 'Transmisión',
  'mec-comportamiento-conduccion': 'Conducción general',
  // Carrocería - Estructura
  'car-alineacion-puertas': 'Alineación de puertas',
  'car-senales-accidentes': 'Señales de accidentes',
  'car-soldaduras-intervenciones': 'Soldaduras/intervenciones',
  // Carrocería - Pintura
  'car-estado-pintura': 'Estado de pintura',
  'car-rayones-golpes': 'Rayones o golpes',
  // Carrocería - Lunas
  'car-estado-parabrisas': 'Parabrisas',
  'car-lunas-laterales-trasera': 'Lunas laterales/trasera',
  // Carrocería - Luces
  'car-faros-delanteros': 'Faros delanteros',
  'car-faros-traseros': 'Faros traseros',
  // Carrocería - Neumáticos
  'car-estado-neumaticos': 'Neumáticos',
  'car-estado-aros': 'Aros',
  // Interior - Sistemas
  'int-revision-scanner': 'Revisión de scanner',
  'int-panel-multimedia': 'Panel multimedia',
  'int-comando-luces': 'Comando de luces',
  'int-aire-acondicionado': 'Aire acondicionado',
  'int-elevalunas': 'Elevalunas',
  'int-limpia-parabrisas': 'Limpia parabrisas',
  'int-asientos': 'Funcionalidad de asientos',
  // Interior - Seguridad
  'int-cinturones': 'Cinturones de seguridad',
  'int-testigos-airbag': 'Testigos de tablero',
  // Interior - Estética
  'int-estado-molduras': 'Molduras',
  'int-desgaste-asientos': 'Desgaste de asientos',
  'int-estado-alfombra': 'Alfombra',
  'int-estado-techo': 'Techo',
  // Legacy mappings
  'legal-placas': 'Placas del vehículo',
  'legal-siniestros': 'Registro de siniestros',
  'mec-motor': 'Estado del motor',
  'mec-transmision': 'Transmisión',
  'mec-frenos': 'Sistema de frenos',
  'mec-suspension': 'Suspensión',
  'mec-escape': 'Sistema de escape',
  'mec-refrigeracion': 'Sistema de refrigeración',
  'mec-bateria': 'Batería',
  'mec-luces': 'Sistema de luces',
  'mec-llantas': 'Llantas',
  'car-pintura': 'Pintura general',
  'car-golpes': 'Golpes y abolladuras',
  'car-oxidacion': 'Oxidación',
  'car-parabrisas': 'Parabrisas',
  'car-vidrios': 'Vidrios laterales',
  'car-espejos': 'Espejos',
  'car-puertas': 'Puertas',
  'car-capo': 'Capó',
  'car-maletero': 'Maletero',
  'int-tablero': 'Tablero',
  'int-audio': 'Sistema de audio',
  'int-ventanas': 'Elevalunas',
  'int-tapizado': 'Tapizado',
  'int-limpieza': 'Limpieza general',
};

function getItemName(id: string): string {
  return ITEM_NAMES[id] || id;
}

export default function PDFChecklist({ categories }: PDFChecklistProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalle de Inspección</Text>

      {categories.map((category) => {
        // Separar items por estado
        const defectos = category.items.filter((i) => i.status === 'DEFECTO');
        const observaciones = category.items.filter((i) => i.status === 'OBSERVACION');
        const okItems = category.items.filter((i) => i.status === 'OK');
        const noAplica = category.items.filter((i) => i.status === 'NO_APLICA');

        const hasProblems = defectos.length > 0 || observaciones.length > 0;
        const totalRevisados = defectos.length + observaciones.length + okItems.length;

        // Construir badge descriptivo
        const buildBadgeText = () => {
          const parts: string[] = [];

          if (defectos.length > 0) {
            parts.push(`${defectos.length} defecto${defectos.length > 1 ? 's' : ''}`);
          }
          if (observaciones.length > 0) {
            parts.push(`${observaciones.length} obs.`);
          }

          if (parts.length === 0) {
            return `Todo OK de ${totalRevisados} revisados`;
          }

          return `${parts.join(' + ')} de ${totalRevisados} revisados`;
        };

        return (
          <View key={category.name} style={styles.category}>
            {/* Header de categoría */}
            {/* 📚 CONCEPTO REACT - Estilos en línea con arreglos:
                En react-pdf puedes combinar estilos pasando un array [estilo1, estilo2] */}
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>
                {category.name}
              </Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {buildBadgeText()}
                </Text>
              </View>
            </View>

            {/* Defectos y observaciones con detalle */}
            {hasProblems && (
              <View style={styles.findingsContainer}>
                {defectos.map((item) => (
                  <View key={item.id} style={styles.findingRow}>
                    <View style={[styles.findingBullet, styles.bulletDefecto]} />
                    <View style={styles.findingContent}>
                      <Text style={styles.findingName}>{item.name}</Text>
                      {item.comment && (
                        <Text style={styles.findingComment}>{item.comment}</Text>
                      )}
                    </View>
                    <Text style={[styles.findingSeverity, styles.severityDefecto]}>
                      DEF
                    </Text>
                  </View>
                ))}
                {observaciones.map((item) => (
                  <View key={item.id} style={styles.findingRow}>
                    <View style={[styles.findingBullet, styles.bulletObservacion]} />
                    <View style={styles.findingContent}>
                      <Text style={styles.findingName}>{item.name}</Text>
                      {item.comment && (
                        <Text style={styles.findingComment}>{item.comment}</Text>
                      )}
                    </View>
                    <Text style={[styles.findingSeverity, styles.severityObservacion]}>
                      OBS
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Items OK en texto corrido */}
            {okItems.length > 0 && (
              <View style={hasProblems ? styles.okSection : styles.allOkSection}>
                <View style={hasProblems ? styles.okHeader : styles.allOkHeader}>
                  <View style={hasProblems ? styles.okIcon : styles.allOkIcon}>
                    <Text style={hasProblems ? styles.okIconText : styles.allOkIconText}>
                      ✓
                    </Text>
                  </View>
                  <Text style={hasProblems ? styles.okTitle : styles.allOkTitle}>
                    {hasProblems
                      ? `En buen estado (${okItems.length})`
                      : `Los ${okItems.length} puntos se encuentran en buen estado`}
                  </Text>
                </View>
                <Text style={hasProblems ? styles.okText : styles.allOkText}>
                  {okItems.map((item) => item.name).join(' • ')}
                </Text>
              </View>
            )}

            {/* 📚 CONCEPTO REACT - Renderizado condicional con && */}
            {/* Solo mostramos esta sección si hay items que no aplican */}
            {noAplica.length > 0 && (
              <View style={styles.noAplicaSection}>
                <View style={styles.noAplicaHeader}>
                  <View style={styles.noAplicaIcon}>
                    <Text style={styles.noAplicaIconText}>–</Text>
                  </View>
                  <Text style={styles.noAplicaTitle}>
                    No aplica ({noAplica.length})
                  </Text>
                </View>
                <Text style={styles.noAplicaText}>
                  {noAplica.map((item) => item.name).join(' • ')}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// Items que pertenecen a la categoría "Prueba de Ruta"
// 📚 CONCEPTO JAVASCRIPT - Set para búsquedas rápidas:
// Usamos Set en lugar de Array porque .has() es O(1) vs .includes() que es O(n)
const PRUEBA_RUTA_ITEMS = new Set([
  'mec-vibracion-ruido-freno',
  'mec-funcionamiento-caja',
  'mec-comportamiento-conduccion',
]);

// Helper para transformar checklistResults al formato esperado
export function transformChecklistResults(
  checklistResults: Record<string, { status: string; comment?: string }>
): ChecklistCategory[] {
  // 📚 CONCEPTO REACT - Organización de datos:
  // Definimos el orden de las categorías aquí
  const categoriesMap: Record<string, ChecklistItem[]> = {
    Legal: [],
    Mecánica: [],
    Carrocería: [],
    Interior: [],
    'Prueba de Ruta': [], // Nueva categoría
  };

  for (const [itemId, result] of Object.entries(checklistResults)) {
    if (!result || !result.status) continue;

    // Determinar la categoría del item
    let categoryName = 'Legal';

    // Primero verificamos si es un item de Prueba de Ruta
    if (PRUEBA_RUTA_ITEMS.has(itemId)) {
      categoryName = 'Prueba de Ruta';
    } else if (itemId.startsWith('mec-')) {
      categoryName = 'Mecánica';
    } else if (itemId.startsWith('car-')) {
      categoryName = 'Carrocería';
    } else if (itemId.startsWith('int-')) {
      categoryName = 'Interior';
    }

    categoriesMap[categoryName].push({
      id: itemId,
      name: getItemName(itemId),
      status: result.status,
      comment: result.comment,
    });
  }

  // Retornamos las categorías en el orden definido, filtrando las vacías
  return Object.entries(categoriesMap)
    .filter(([, items]) => items.length > 0)
    .map(([name, items]) => ({ name, items }));
}

// Extraer hallazgos críticos del checklist
export function extractCriticalFindings(
  checklistResults: Record<string, { status: string; comment?: string }>
): Array<{
  category: string;
  item: string;
  severity: 'DEFECTO' | 'OBSERVACION';
  comment?: string;
}> {
  const findings: Array<{
    category: string;
    item: string;
    severity: 'DEFECTO' | 'OBSERVACION';
    comment?: string;
  }> = [];

  for (const [itemId, result] of Object.entries(checklistResults)) {
    if (!result || !result.status) continue;
    if (result.status !== 'DEFECTO' && result.status !== 'OBSERVACION') continue;

    // Determinar categoría (misma lógica que transformChecklistResults)
    let categoryName = 'Legal';
    if (PRUEBA_RUTA_ITEMS.has(itemId)) {
      categoryName = 'Prueba de Ruta';
    } else if (itemId.startsWith('mec-')) {
      categoryName = 'Mecánica';
    } else if (itemId.startsWith('car-')) {
      categoryName = 'Carrocería';
    } else if (itemId.startsWith('int-')) {
      categoryName = 'Interior';
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

// Helper para calcular resumen por categoría
export function calculateCategorySummary(
  checklistResults: Record<string, { status: string; comment?: string }>
): Array<{
  name: string;
  total: number;
  ok: number;
  observaciones: number;
  defectos: number;
  noAplica: number;
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';
}> {
  const categories = transformChecklistResults(checklistResults);

  return categories.map((category) => {
    const ok = category.items.filter((i) => i.status === 'OK').length;
    const observaciones = category.items.filter((i) => i.status === 'OBSERVACION').length;
    const defectos = category.items.filter((i) => i.status === 'DEFECTO').length;
    const noAplica = category.items.filter((i) => i.status === 'NO_APLICA').length;
    const total = category.items.length;

    let status: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING' = 'OK';
    if (defectos > 0) status = 'CRITICAL';
    else if (observaciones > 0) status = 'WARNING';

    return {
      name: category.name,
      total,
      ok,
      observaciones,
      defectos,
      noAplica,
      status,
    };
  });
}
