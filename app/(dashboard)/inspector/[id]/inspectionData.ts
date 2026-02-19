// ============================================
// Tipos de Estado de Inspección
// ============================================
export type InspectionStatus = "OK" | "OBSERVACION" | "DEFECTO" | "NO_APLICA" | null;

// ============================================
// Interfaces
// ============================================
export interface InspectionItem {
  id: string;
  label: string;
}

export interface InspectionSection {
  id: string;
  title: string;
  items: InspectionItem[];
}

export interface InspectionCategory {
  id: string;
  title: string;
  icon: string;
  sections: InspectionSection[];
}

// ============================================
// Estado de cada ítem (para guardar)
// ============================================
export interface ItemResult {
  status: InspectionStatus;
  comment?: string;
}

export type InspectionResults = Record<string, ItemResult>;

// ============================================
// Datos de Inspección - 5 Categorías para el Inspector
// Orden: Legal > Mecánica > Prueba de Ruta > Carrocería > Interior
// ============================================
export const INSPECTION_CATEGORIES: InspectionCategory[] = [
  // ========== 1. LEGAL ==========
  {
    id: "legal",
    title: "Legal",
    icon: "document",
    sections: [
      {
        id: "legal-documentacion",
        title: "Documentación",
        items: [
          { id: "legal-tarjeta-propiedad", label: "Tarjeta de propiedad" },
          { id: "legal-revision-tecnica", label: "Certificado de revisión técnica vehicular" },
          { id: "legal-soat", label: "SOAT vigente" },
          { id: "legal-permiso-lunas", label: "Permiso de lunas polarizadas" },
          { id: "legal-manual-instrucciones", label: "Manual de instrucciones" },
          { id: "legal-cartilla-servicio", label: "Cartilla de servicio" },
        ],
      },
      {
        id: "legal-identificacion",
        title: "Identificación",
        items: [
          { id: "legal-vin-placa", label: "Coincidencia VIN / placa" },
        ],
      },
      {
        id: "legal-accesorios",
        title: "Accesorios y elementos obligatorios",
        items: [
          { id: "legal-llaves", label: "2 llaves disponibles" },
          { id: "legal-llanta-repuesto", label: "Llanta de repuesto con herramientas" },
          { id: "legal-tapa-maletera", label: "Tapa de maletera" },
          { id: "legal-seguro-aros", label: "Seguro de aros" },
        ],
      },
    ],
  },
  // ========== 2. MECÁNICA ==========
  {
    id: "mecanica",
    title: "Mecánica",
    icon: "engine",
    sections: [
      {
        id: "mecanica-motor",
        title: "Motor",
        items: [
          { id: "mec-sonidos-motor", label: "Sonidos del motor" },
          { id: "mec-fugas-aceite", label: "Fugas de aceite" },
          { id: "mec-fugas-refrigerante", label: "Fugas de refrigerante" },
          { id: "mec-nivel-aceite-motor", label: "Nivel de aceite motor" },
          { id: "mec-nivel-aceite-caja", label: "Nivel de aceite de caja" },
          { id: "mec-nivel-refrigerante", label: "Nivel de refrigerante" },
          { id: "mec-sin-manipulacion", label: "Motor sin señales de manipulación" },
          { id: "mec-estado-bateria", label: "Estado de batería" },
        ],
      },
      {
        id: "mecanica-parte-inferior",
        title: "Parte inferior del vehículo",
        items: [
          { id: "mec-fugas-inferiores", label: "Fugas inferiores de motor o transmisión" },
          { id: "mec-golpes-suspension", label: "Golpes en suspensión o estructura inferior" },
          { id: "mec-tubo-escape", label: "Estado del tubo de escape" },
          { id: "mec-oxido-estructural", label: "Señales de óxido estructural" },
        ],
      },
      {
        id: "mecanica-suspension-direccion",
        title: "Suspensión y dirección",
        items: [
          { id: "mec-funcionamiento-suspension", label: "Estado de suspensión" },
          { id: "mec-direccion", label: "Dirección" },
        ],
      },
      {
        id: "mecanica-frenos",
        title: "Sistema de frenos",
        items: [
          { id: "mec-funcionamiento-frenos", label: "Funcionamiento de frenos" },
        ],
      },
    ],
  },
  // ========== 3. PRUEBA DE RUTA ==========
  {
    id: "prueba-ruta",
    title: "Prueba de Ruta",
    icon: "road",
    sections: [
      {
        id: "prueba-ruta-conduccion",
        title: "Evaluación en conducción",
        items: [
          { id: "mec-vibracion-ruido-freno", label: "Vibración o ruido al frenar" },
          { id: "mec-funcionamiento-caja", label: "Funcionamiento de transmisión" },
          { id: "mec-comportamiento-conduccion", label: "Comportamiento general en conducción" },
        ],
      },
    ],
  },
  // ========== 4. CARROCERÍA ==========
  {
    id: "carroceria",
    title: "Carrocería",
    icon: "car",
    sections: [
      {
        id: "carroceria-estructura",
        title: "Estructura y alineación",
        items: [
          { id: "car-alineacion-puertas", label: "Alineación de puertas, capot y carrocería" },
          { id: "car-senales-accidentes", label: "Señales de accidentes o reparaciones" },
          { id: "car-soldaduras-intervenciones", label: "Soldaduras o intervenciones estructurales visibles" },
        ],
      },
      {
        id: "carroceria-pintura",
        title: "Pintura y superficie",
        items: [
          { id: "car-estado-pintura", label: "Estado general de pintura" },
          { id: "car-rayones-golpes", label: "Rayones o golpes visibles" },
        ],
      },
      {
        id: "carroceria-lunas",
        title: "Lunas y parabrisas",
        items: [
          { id: "car-estado-parabrisas", label: "Estado del parabrisas" },
          { id: "car-lunas-laterales-trasera", label: "Estado de lunas laterales y trasera" },
        ],
      },
      {
        id: "carroceria-luces",
        title: "Luces exteriores",
        items: [
          { id: "car-faros-delanteros", label: "Faros delanteros" },
          { id: "car-faros-traseros", label: "Faros traseros" },
        ],
      },
      {
        id: "carroceria-neumaticos",
        title: "Neumáticos y aros",
        items: [
          { id: "car-estado-neumaticos", label: "Estado de neumáticos" },
          { id: "car-estado-aros", label: "Estado de aros" },
        ],
      },
    ],
  },
  // ========== 5. INTERIOR ==========
  {
    id: "interior",
    title: "Interior",
    icon: "seat",
    sections: [
      {
        id: "interior-sistemas",
        title: "Sistemas funcionales",
        items: [
          { id: "int-revision-scanner", label: "Resultado de revisión de scanner" },
          { id: "int-panel-multimedia", label: "Funcionamiento de panel central / multimedia" },
          { id: "int-comando-luces", label: "Funcionamiento de comando de luces" },
          { id: "int-aire-acondicionado", label: "Funcionamiento de aire acondicionado" },
          { id: "int-elevalunas", label: "Funcionamiento de elevalunas" },
          { id: "int-limpia-parabrisas", label: "Funcionamiento de limpia parabrisas" },
          { id: "int-asientos", label: "Funcionalidad de asientos" },
        ],
      },
      {
        id: "interior-seguridad",
        title: "Seguridad interior",
        items: [
          { id: "int-cinturones", label: "Cinturones de seguridad" },
          { id: "int-testigos-airbag", label: "Testigos de tablero" },
        ],
      },
      {
        id: "interior-estetica",
        title: "Estética interior",
        items: [
          { id: "int-estado-molduras", label: "Estado de molduras" },
          { id: "int-desgaste-asientos", label: "Desgaste de asientos" },
          { id: "int-estado-alfombra", label: "Estado de alfombra" },
          { id: "int-estado-techo", label: "Estado de techo" },
        ],
      },
    ],
  },
];

// ============================================
// Función Helper: Obtener total de ítems
// ============================================
export function getTotalItems(): number {
  return INSPECTION_CATEGORIES.reduce((total, category) => {
    return total + category.sections.reduce((sectionTotal, section) => {
      return sectionTotal + section.items.length;
    }, 0);
  }, 0);
}

// ============================================
// Función Helper: Obtener ítems por categoría
// ============================================
export function getItemsCountByCategory(categoryId: string): number {
  const category = INSPECTION_CATEGORIES.find(c => c.id === categoryId);
  if (!category) return 0;

  return category.sections.reduce((total, section) => {
    return total + section.items.length;
  }, 0);
}

// ============================================
// Función Helper: Calcular progreso
// ============================================
export function calculateProgress(results: InspectionResults): {
  total: number;
  completed: number;
  percentage: number;
  byCategory: Record<string, { total: number; completed: number; percentage: number }>;
} {
  const total = getTotalItems();
  const completed = Object.values(results).filter(r => r.status !== null).length;

  const byCategory: Record<string, { total: number; completed: number; percentage: number }> = {};

  INSPECTION_CATEGORIES.forEach(category => {
    const categoryTotal = getItemsCountByCategory(category.id);
    let categoryCompleted = 0;

    category.sections.forEach(section => {
      section.items.forEach(item => {
        if (results[item.id]?.status !== null && results[item.id]?.status !== undefined) {
          categoryCompleted++;
        }
      });
    });

    byCategory[category.id] = {
      total: categoryTotal,
      completed: categoryCompleted,
      percentage: categoryTotal > 0 ? Math.round((categoryCompleted / categoryTotal) * 100) : 0,
    };
  });

  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    byCategory,
  };
}

// ============================================
// Función Helper: Calcular scoring general
// ============================================
export function calculateScore(results: InspectionResults): {
  total: number;
  ok: number;
  observaciones: number;
  defectos: number;
  noAplica: number;
  score: number;
  status: "PENDING" | "OK" | "WARNING" | "CRITICAL";
} {
  const values = Object.values(results);
  const ok = values.filter(r => r.status === "OK").length;
  const observaciones = values.filter(r => r.status === "OBSERVACION").length;
  const defectos = values.filter(r => r.status === "DEFECTO").length;
  const noAplica = values.filter(r => r.status === "NO_APLICA").length;

  const aplicables = ok + observaciones + defectos;

  // Scoring: OK = 100%, OBSERVACION = 50%, DEFECTO = 0%
  const score = aplicables > 0
    ? Math.round(((ok * 100) + (observaciones * 50)) / aplicables)
    : 0;

  let status: "PENDING" | "OK" | "WARNING" | "CRITICAL" = "PENDING";

  if (aplicables > 0) {
    if (defectos > 0) {
      status = "CRITICAL";
    } else if (observaciones > 0) {
      status = "WARNING";
    } else {
      status = "OK";
    }
  }

  return {
    total: values.length,
    ok,
    observaciones,
    defectos,
    noAplica,
    score,
    status,
  };
}

// ============================================
// Función Helper: Calcular scoring POR CATEGORÍA
// ============================================
export type CategoryScore = {
  total: number;
  completed: number;
  ok: number;
  observaciones: number;
  defectos: number;
  noAplica: number;
  score: number;
  status: "PENDING" | "OK" | "WARNING" | "CRITICAL";
};

export function calculateScoreByCategory(results: InspectionResults): Record<string, CategoryScore> {
  const scoreByCategory: Record<string, CategoryScore> = {};

  INSPECTION_CATEGORIES.forEach(category => {
    // Obtener todos los IDs de items de esta categoría
    const categoryItemIds: string[] = [];
    category.sections.forEach(section => {
      section.items.forEach(item => {
        categoryItemIds.push(item.id);
      });
    });

    // Filtrar resultados de esta categoría
    const categoryResults = categoryItemIds
      .map(id => results[id])
      .filter(r => r !== undefined);

    const total = categoryItemIds.length;
    const completed = categoryResults.filter(r => r?.status !== null).length;
    const ok = categoryResults.filter(r => r?.status === "OK").length;
    const observaciones = categoryResults.filter(r => r?.status === "OBSERVACION").length;
    const defectos = categoryResults.filter(r => r?.status === "DEFECTO").length;
    const noAplica = categoryResults.filter(r => r?.status === "NO_APLICA").length;

    const aplicables = ok + observaciones + defectos;

    // Scoring: OK = 100%, OBSERVACION = 50%, DEFECTO = 0%
    const score = aplicables > 0
      ? Math.round(((ok * 100) + (observaciones * 50)) / aplicables)
      : 0;

    let status: "PENDING" | "OK" | "WARNING" | "CRITICAL" = "PENDING";

    // Solo calcular status si hay al menos algunos items completados
    if (completed > 0) {
      if (defectos > 0) {
        status = "CRITICAL";
      } else if (observaciones > 0) {
        status = "WARNING";
      } else if (ok > 0) {
        status = "OK";
      }
    }

    scoreByCategory[category.id] = {
      total,
      completed,
      ok,
      observaciones,
      defectos,
      noAplica,
      score,
      status,
    };
  });

  return scoreByCategory;
}

// ============================================
// Función Helper: Calcular score general desde checklistResults
// ============================================
export function calculateOverallScore(results: InspectionResults): {
  score: number;
  status: "PENDING" | "OK" | "WARNING" | "CRITICAL";
} {
  const byCategory = calculateScoreByCategory(results);
  const categories = Object.values(byCategory);

  // Verificar si todas las categorías tienen items completados
  const allStarted = categories.every(c => c.completed > 0);
  if (!allStarted) {
    return { score: 0, status: "PENDING" };
  }

  // Calcular promedio de scores
  const totalScore = categories.reduce((sum, c) => sum + c.score, 0);
  const avgScore = Math.round(totalScore / categories.length);

  // El status general es el peor de todos
  let overallStatus: "PENDING" | "OK" | "WARNING" | "CRITICAL" = "OK";
  for (const cat of categories) {
    if (cat.status === "CRITICAL") {
      overallStatus = "CRITICAL";
      break;
    } else if (cat.status === "WARNING" && overallStatus !== "CRITICAL") {
      overallStatus = "WARNING";
    }
  }

  return { score: avgScore, status: overallStatus };
}
