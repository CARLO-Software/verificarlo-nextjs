// ============================================
// PDFChecklist - Detalle de inspección con CARDS
// REDISEÑO: Cada categoría es un card limpio
// Bullets por severidad, OK en lista compacta
// ============================================

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
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
  photosByItem?: Record<string, string[]>;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.graphite,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  // Card de categoría
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  // Header del card
  cardHeader: {
    backgroundColor: colors.graphite,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Badges en header
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: colors.white,
  },
  // Cuerpo del card
  cardBody: {
    padding: 12,
  },
  // Sección de defectos
  defectsSection: {
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  // Items con bullet
  bulletList: {
    paddingLeft: 14,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 8,
    marginTop: 4,
  },
  bulletContent: {
    flex: 1,
  },
  bulletTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.graphite,
  },
  bulletComment: {
    fontSize: 8,
    color: colors.charcoal,
    marginTop: 2,
    lineHeight: 1.4,
  },
  // Sección OK compacta
  okSection: {
    backgroundColor: colors.successBg,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  okHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  okIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  okIconText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.white,
  },
  okTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.successDark,
  },
  okList: {
    fontSize: 8,
    color: colors.charcoal,
    lineHeight: 1.5,
  },
  // Card cuando TODO OK
  allOkCard: {
    backgroundColor: colors.successBgStrong,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  allOkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  allOkIconText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  allOkTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.successDark,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  allOkText: {
    fontSize: 8,
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 1.5,
  },
  // No aplica
  noAplicaSection: {
    backgroundColor: colors.lightGray,
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  noAplicaTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    color: colors.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  noAplicaList: {
    fontSize: 7,
    color: colors.slate,
    lineHeight: 1.4,
  },
  // Fotos
  photosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    marginLeft: 12,
  },
  photo: {
    width: 110,
    height: 82,
    borderRadius: 4,
    objectFit: 'cover',
    borderWidth: 1,
    borderColor: colors.borderGray,
  },
  morePhotos: {
    fontSize: 7,
    color: colors.slate,
    marginTop: 4,
    marginLeft: 12,
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
  'mec-prueba-gas': 'Prueba de gas',
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
  'car-focos-halogenados': 'Focos halógenos reglamentarios',
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

export default function PDFChecklist({ categories, photosByItem = {} }: PDFChecklistProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Detalle de Inspección</Text>

      {categories.map((category) => {
        // Separar items por estado
        const defectos = category.items.filter((i) => i.status === 'DEFECTO');
        const observaciones = category.items.filter((i) => i.status === 'OBSERVACION');
        const okItems = category.items.filter((i) => i.status === 'OK');
        const noAplica = category.items.filter((i) => i.status === 'NO_APLICA');

        const hasDefects = defectos.length > 0;
        const hasObservations = observaciones.length > 0;
        const hasProblems = hasDefects || hasObservations;

        // Si todo está OK, mostrar card especial
        if (!hasProblems && okItems.length > 0) {
          return (
            <View key={category.name} style={styles.allOkCard}>
              <View style={styles.allOkIcon}>
                <Text style={styles.allOkIconText}>✓</Text>
              </View>
              <Text style={styles.allOkTitle}>{category.name}</Text>
              <Text style={styles.allOkText}>
                {okItems.length} puntos revisados - Todo en buen estado
              </Text>
            </View>
          );
        }

        return (
          <View key={category.name} style={styles.card} wrap={false}>
            {/* Header del card */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{category.name}</Text>
              <View style={styles.badgesRow}>
                {hasDefects && (
                  <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                    <Text style={styles.badgeText}>
                      {defectos.length} defecto{defectos.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
                {hasObservations && (
                  <View style={[styles.badge, { backgroundColor: colors.warning }]}>
                    <Text style={styles.badgeText}>
                      {observaciones.length} obs.
                    </Text>
                  </View>
                )}
                {okItems.length > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.success }]}>
                    <Text style={styles.badgeText}>{okItems.length} OK</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Cuerpo del card */}
            <View style={styles.cardBody}>
              {/* Defectos */}
              {hasDefects && (
                <View style={styles.defectsSection}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionDot, { backgroundColor: colors.danger }]} />
                    <Text style={[styles.sectionTitle, { color: colors.dangerDark }]}>
                      Defectos Detectados
                    </Text>
                  </View>
                  <View style={styles.bulletList}>
                    {defectos.map((item) => {
                      const itemPhotos = photosByItem[item.id] || [];
                      return (
                        <View key={item.id}>
                          <View style={styles.bulletItem}>
                            <View style={[styles.bullet, { backgroundColor: colors.danger }]} />
                            <View style={styles.bulletContent}>
                              <Text style={styles.bulletTitle}>{item.name}</Text>
                              {item.comment && (
                                <Text style={styles.bulletComment}>{item.comment}</Text>
                              )}
                            </View>
                          </View>
                          {itemPhotos.length > 0 && (
                            <>
                              <View style={styles.photosRow}>
                                {itemPhotos.slice(0, 3).map((url, idx) => (
                                  <Image key={idx} src={url} style={styles.photo} />
                                ))}
                              </View>
                              {itemPhotos.length > 3 && (
                                <Text style={styles.morePhotos}>
                                  +{itemPhotos.length - 3} foto(s) adicional(es)
                                </Text>
                              )}
                            </>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Observaciones */}
              {hasObservations && (
                <View style={styles.defectsSection}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionDot, { backgroundColor: colors.warning }]} />
                    <Text style={[styles.sectionTitle, { color: colors.warningDark }]}>
                      Observaciones
                    </Text>
                  </View>
                  <View style={styles.bulletList}>
                    {observaciones.map((item) => {
                      const itemPhotos = photosByItem[item.id] || [];
                      return (
                        <View key={item.id}>
                          <View style={styles.bulletItem}>
                            <View style={[styles.bullet, { backgroundColor: colors.warning }]} />
                            <View style={styles.bulletContent}>
                              <Text style={styles.bulletTitle}>{item.name}</Text>
                              {item.comment && (
                                <Text style={styles.bulletComment}>{item.comment}</Text>
                              )}
                            </View>
                          </View>
                          {itemPhotos.length > 0 && (
                            <>
                              <View style={styles.photosRow}>
                                {itemPhotos.slice(0, 3).map((url, idx) => (
                                  <Image key={idx} src={url} style={styles.photo} />
                                ))}
                              </View>
                              {itemPhotos.length > 3 && (
                                <Text style={styles.morePhotos}>
                                  +{itemPhotos.length - 3} foto(s) adicional(es)
                                </Text>
                              )}
                            </>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Items OK */}
              {okItems.length > 0 && (
                <View style={styles.okSection}>
                  <View style={styles.okHeader}>
                    <View style={styles.okIcon}>
                      <Text style={styles.okIconText}>✓</Text>
                    </View>
                    <Text style={styles.okTitle}>
                      En buen estado ({okItems.length})
                    </Text>
                  </View>
                  <Text style={styles.okList}>
                    {okItems.map((item) => item.name).join(' • ')}
                  </Text>
                </View>
              )}

              {/* No aplica */}
              {noAplica.length > 0 && (
                <View style={styles.noAplicaSection}>
                  <Text style={styles.noAplicaTitle}>
                    No aplica ({noAplica.length})
                  </Text>
                  <Text style={styles.noAplicaList}>
                    {noAplica.map((item) => item.name).join(' • ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// NOTA: Ya no existe "Prueba de Ruta" como subcategoría separada.
// Todos los items mec-* van bajo "Mecánica".

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
  };

  for (const [itemId, result] of Object.entries(checklistResults)) {
    if (!result || !result.status) continue;

    // Determinar la categoría del item por prefijo
    let categoryName = 'Legal';

    if (itemId.startsWith('mec-')) {
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

    // Determinar categoría por prefijo
    let categoryName = 'Legal';
    if (itemId.startsWith('mec-')) {
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
