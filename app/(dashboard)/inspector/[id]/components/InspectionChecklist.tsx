/**
 * InspectionChecklist - Componente principal que renderiza dinámicamente
 * las secciones e ítems de inspección según la categoría seleccionada.
 * Maneja el estado de todos los ítems con AUTOGUARDADO.
 */
"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  INSPECTION_CATEGORIES,
  type InspectionStatus,
  type InspectionResults,
  calculateProgress,
} from "../inspectionData";
import { InspectionItemCard } from "./InspectionItemCard";
import { StatusLegend } from "./StatusLegend";
import { type Photo } from "./ItemPhotoCapture";
import styles from "./InspectionChecklist.module.css";

// Key para sessionStorage
const CHECKLIST_STORAGE_KEY = "inspection_checklist_backup";

interface InspectionChecklistProps {
  initialResults?: InspectionResults;
  disabled?: boolean;
  onSave?: (results: InspectionResults) => Promise<void>;
  onCategoryChange?: (categoryId: string) => void;
  // Props para fotos
  reportId?: number;
  photosByItem?: Record<string, Photo[]>;
  onPhotoAdded?: (photo: Photo) => void;
  onPhotoDeleted?: (photoId: number) => void;
}

export function InspectionChecklist({
  initialResults = {},
  disabled = false,
  onSave,
  onCategoryChange,
  // Props para fotos
  reportId,
  photosByItem = {},
  onPhotoAdded,
  onPhotoDeleted,
}: InspectionChecklistProps) {
  const router = useRouter();

  // Intentar recuperar datos del sessionStorage al inicializar
  const getInitialResults = (): InspectionResults => {
    if (typeof window === "undefined" || !reportId) return initialResults;

    try {
      const stored = sessionStorage.getItem(`${CHECKLIST_STORAGE_KEY}_${reportId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Si hay datos en sessionStorage, combinarlos con los del servidor
        // Los datos del sessionStorage tienen prioridad (son más recientes)
        if (Object.keys(parsed).length > 0) {
          // Combinar: servidor como base, sessionStorage sobrescribe
          return { ...initialResults, ...parsed };
        }
      }
    } catch {
      // Ignorar errores de parsing
    }
    return initialResults;
  };

  const [activeCategory, setActiveCategory] = useState<string>(
    INSPECTION_CATEGORIES[0].id
  );
  const [results, setResults] = useState<InspectionResults>(getInitialResults);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  // Estado para el modal de confirmación de salida
  const [showExitModal, setShowExitModal] = useState(false);

  // Ref para el timeout del autoguardado
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Ref para trackear si hay cambios pendientes
  const hasUnsavedChanges = useRef(false);
  // Ref para ocultar el indicador de "guardado"
  const savedIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Ref para almacenar el último estado de results (para guardado en navegación)
  const resultsRef = useRef<InspectionResults>(initialResults);
  // Ref para evitar guardado duplicado
  const isSavingRef = useRef(false);

  // Obtener categoría activa
  const currentCategory = useMemo(() => {
    return INSPECTION_CATEGORIES.find((c) => c.id === activeCategory);
  }, [activeCategory]);

  // Calcular progreso
  const progress = useMemo(() => {
    return calculateProgress(results);
  }, [results]);

  // Función de autoguardado
  const autoSave = useCallback(async (newResults: InspectionResults) => {
    if (!onSave || saving || disabled || isSavingRef.current) return;

    isSavingRef.current = true;
    setSaving(true);
    setSaveStatus("saving");

    // Limpiar timeout anterior del indicador
    if (savedIndicatorTimeoutRef.current) {
      clearTimeout(savedIndicatorTimeoutRef.current);
    }

    try {
      await onSave(newResults);
      setLastSaved(new Date());
      hasUnsavedChanges.current = false;
      setSaveStatus("saved");

      // Limpiar sessionStorage después de guardar exitosamente
      if (reportId && typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(`${CHECKLIST_STORAGE_KEY}_${reportId}`);
        } catch {
          // Ignorar
        }
      }

      // Ocultar indicador después de 2 segundos
      savedIndicatorTimeoutRef.current = setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Error al autoguardar:", error);
      setSaveStatus("idle");
    } finally {
      setSaving(false);
      isSavingRef.current = false;
    }
  }, [onSave, saving, disabled, reportId]);

  // Guardar en sessionStorage como backup inmediato
  const saveToSessionStorage = useCallback((data: InspectionResults) => {
    if (typeof window === "undefined" || !reportId) return;
    try {
      sessionStorage.setItem(`${CHECKLIST_STORAGE_KEY}_${reportId}`, JSON.stringify(data));
    } catch {
      // Ignorar errores de storage
    }
  }, [reportId]);

  // Limpiar sessionStorage después de guardar exitosamente en el servidor
  const clearSessionStorage = useCallback(() => {
    if (typeof window === "undefined" || !reportId) return;
    try {
      sessionStorage.removeItem(`${CHECKLIST_STORAGE_KEY}_${reportId}`);
    } catch {
      // Ignorar errores
    }
  }, [reportId]);

  // Manejar cambio de estado de un ítem (con autoguardado)
  const handleStatusChange = useCallback(
    (itemId: string, status: InspectionStatus, comment?: string) => {
      setResults((prev) => {
        const newResults = { ...prev };

        if (status === null) {
          delete newResults[itemId];
        } else {
          newResults[itemId] = {
            status,
            comment: comment || undefined,
          };
        }

        // Marcar que hay cambios pendientes
        hasUnsavedChanges.current = true;

        // Guardar inmediatamente en sessionStorage como backup
        saveToSessionStorage(newResults);

        // Cancelar timeout anterior si existe
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        // Programar autoguardado después de 500ms de inactividad (reducido de 1s)
        saveTimeoutRef.current = setTimeout(() => {
          autoSave(newResults);
        }, 500);

        return newResults;
      });
    },
    [autoSave, saveToSessionStorage]
  );

  // Mantener ref sincronizado con el estado
  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  // Sincronizar datos del sessionStorage con el servidor al montar
  useEffect(() => {
    if (!reportId || !onSave || disabled) return;

    const syncFromStorage = async () => {
      try {
        const stored = sessionStorage.getItem(`${CHECKLIST_STORAGE_KEY}_${reportId}`);
        if (stored) {
          const parsedData = JSON.parse(stored);
          // Si hay datos en storage, combinar con los actuales y sincronizar
          if (Object.keys(parsedData).length > 0) {
            // Combinar datos actuales con los del storage (storage tiene prioridad)
            const mergedData = { ...resultsRef.current, ...parsedData };
            // Actualizar estado local
            setResults(mergedData);
            resultsRef.current = mergedData;
            // Guardar en el servidor
            await onSave(mergedData);
            // Limpiar storage después de sincronizar
            sessionStorage.removeItem(`${CHECKLIST_STORAGE_KEY}_${reportId}`);
          }
        }
      } catch {
        // Ignorar errores
      }
    };

    syncFromStorage();
  }, [reportId, onSave, disabled]);

  // Función para guardar con fetch keepalive (funciona incluso al cerrar/navegar)
  const saveWithKeepAlive = useCallback(() => {
    if (!reportId || !hasUnsavedChanges.current || isSavingRef.current) return;

    const dataToSave = resultsRef.current;

    // Guardar también en sessionStorage por si la petición falla
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(`${CHECKLIST_STORAGE_KEY}_${reportId}`, JSON.stringify(dataToSave));
      } catch {
        // Ignorar
      }
    }

    // fetch con keepalive garantiza que la petición se complete aunque se cierre la página
    fetch(`/api/reports/${reportId}/sections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "checklist",
        data: { checklistResults: dataToSave },
      }),
      keepalive: true, // Permite que la petición continúe aunque la página se cierre
    }).then(() => {
      // Limpiar sessionStorage si la petición fue exitosa
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(`${CHECKLIST_STORAGE_KEY}_${reportId}`);
        } catch {
          // Ignorar
        }
      }
    }).catch(() => {
      // Ignorar errores - los datos están en sessionStorage como backup
    });
    hasUnsavedChanges.current = false;
  }, [reportId]);

  // Ref para trackear la categoría actual (para el popstate)
  const activeCategoryRef = useRef(activeCategory);
  useEffect(() => {
    activeCategoryRef.current = activeCategory;
  }, [activeCategory]);

  // Ref para detectar doble tap (taps rápidos consecutivos)
  const lastPopStateTimeRef = useRef<number>(0);
  const popStateCountRef = useRef<number>(0);

  // Agregar entrada al historial cuando cambia de categoría
  useEffect(() => {
    // Agregar estado al historial para cada categoría
    const currentIndex = INSPECTION_CATEGORIES.findIndex(c => c.id === activeCategory);
    window.history.pushState({ categoryIndex: currentIndex, categoryId: activeCategory, isChecklist: true }, "");
  }, [activeCategory]);

  // Escuchar eventos de navegación (botón atrás, cerrar pestaña, etc.)
  useEffect(() => {
    // Agregar MUCHAS entradas al historial para crear un "buffer" de protección grande
    const initialIndex = INSPECTION_CATEGORIES.findIndex(c => c.id === INSPECTION_CATEGORIES[0].id);
    const historyState = { categoryIndex: initialIndex, categoryId: INSPECTION_CATEGORIES[0].id, isChecklist: true };

    window.history.replaceState(historyState, "");
    // Agregar 15 entradas de protección para absorber múltiples taps rápidos
    for (let i = 0; i < 15; i++) {
      window.history.pushState(historyState, "");
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        saveWithKeepAlive();
        // Mostrar mensaje de confirmación del navegador
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const handleVisibilityChange = () => {
      // Cuando la página se oculta (cambio de pestaña, minimizar, navegar)
      if (document.visibilityState === "hidden" && hasUnsavedChanges.current) {
        saveWithKeepAlive();
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      const now = Date.now();
      const timeSinceLastPop = now - lastPopStateTimeRef.current;
      lastPopStateTimeRef.current = now;

      // SIEMPRE agregar entradas al historial primero para prevenir navegación
      const protectionState = { categoryIndex: 0, categoryId: INSPECTION_CATEGORIES[0].id, isChecklist: true };
      for (let i = 0; i < 5; i++) {
        window.history.pushState(protectionState, "");
      }

      // Detectar taps rápidos (menos de 500ms entre taps)
      if (timeSinceLastPop < 500) {
        popStateCountRef.current += 1;
      } else {
        popStateCountRef.current = 1;
      }

      // Si hay 2 o más taps rápidos, mostrar modal inmediatamente
      if (popStateCountRef.current >= 2) {
        setShowExitModal(true);
        popStateCountRef.current = 0;
        return;
      }

      // Cuando el usuario usa el botón atrás del navegador (tap simple)
      const currentIndex = INSPECTION_CATEGORIES.findIndex(c => c.id === activeCategoryRef.current);

      if (currentIndex > 0) {
        // Si no está en la primera categoría, ir a la anterior
        const previousCategory = INSPECTION_CATEGORIES[currentIndex - 1];
        setActiveCategory(previousCategory.id);
        onCategoryChange?.(previousCategory.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
        // Guardar cambios pendientes
        if (hasUnsavedChanges.current) {
          saveWithKeepAlive();
        }
      } else {
        // Si está en la primera categoría, mostrar modal de confirmación
        setShowExitModal(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("popstate", handlePopState);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Guardar inmediatamente si hay cambios pendientes al desmontar
      if (hasUnsavedChanges.current && onSave) {
        onSave(resultsRef.current);
      }
    };
  }, [onSave, saveWithKeepAlive, onCategoryChange]);

  // Manejar cambio de categoría
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    onCategoryChange?.(categoryId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Confirmar salida de la inspección
  const handleConfirmExit = useCallback(() => {
    // Guardar cambios pendientes antes de salir
    if (hasUnsavedChanges.current) {
      saveWithKeepAlive();
    }
    setShowExitModal(false);
    // Navegar al panel del inspector
    router.push("/inspector");
  }, [router, saveWithKeepAlive]);

  // Cancelar salida
  const handleCancelExit = useCallback(() => {
    setShowExitModal(false);
  }, []);

  // Marcar todos los ítems de una sección como OK
  const handleMarkAllOk = useCallback(
    (sectionItems: { id: string }[]) => {
      if (disabled) return;

      setResults((prev) => {
        const newResults = { ...prev };

        sectionItems.forEach((item) => {
          // Solo marcar como OK si no tiene estado o si ya está OK
          // No sobrescribir OBSERVACION o DEFECTO
          if (!newResults[item.id] || newResults[item.id].status === null) {
            newResults[item.id] = { status: "OK" };
          }
        });

        hasUnsavedChanges.current = true;

        // Cancelar timeout anterior si existe
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        // Programar autoguardado
        saveTimeoutRef.current = setTimeout(() => {
          autoSave(newResults);
        }, 500); // Más rápido para acción en lote

        return newResults;
      });
    },
    [disabled, autoSave]
  );

  // Obtener icono de categoría
  const getCategoryIcon = (icon: string) => {
    switch (icon) {
      case "document":
        return (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M5 2h8a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M6 6h6M6 9h6M6 12h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        );
      case "engine":
        return (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M9 6v6M6 9h6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        );
      case "car":
        return (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect
              x="2"
              y="6"
              width="14"
              height="7"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="5" cy="13" r="1.5" stroke="currentColor" strokeWidth="1" />
            <circle cx="13" cy="13" r="1.5" stroke="currentColor" strokeWidth="1" />
            <path d="M4 6l2-3h6l2 3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        );
      case "seat":
        return (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M5 15V9a2 2 0 012-2h4a2 2 0 012 2v6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M4 15h10M6 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${styles.container} checklistContainer`}>
      {/* Modal de confirmación de salida */}
      {showExitModal && (
        <div className={styles.exitModalOverlay}>
          <div className={styles.exitModal}>
            <div className={styles.exitModalIcon}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 10v8M16 22v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className={styles.exitModalTitle}>¿Salir de la inspección?</h3>
            <p className={styles.exitModalText}>
              Si sales ahora, los cambios que no se hayan guardado podrían perderse.
            </p>
            <div className={styles.exitModalButtons}>
              <button
                type="button"
                onClick={handleCancelExit}
                className={styles.exitModalButtonCancel}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className={styles.exitModalButtonConfirm}
              >
                Sí, salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de autoguardado flotante */}
      {saveStatus !== "idle" && (
        <div className={`${styles.autoSaveIndicator} ${styles[`autoSaveIndicator--${saveStatus}`]}`}>
          {saveStatus === "saving" && (
            <>
              <span className={styles.autoSaveSpinner} />
              <span>Guardando...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Guardado</span>
            </>
          )}
        </div>
      )}

      {/* Header móvil con categoría activa */}
      <div className={styles.mobileHeader}>
        <div className={styles.mobileHeaderTop}>
          <div className={styles.mobileHeaderCategory}>
            <span className={styles.mobileHeaderIcon}>
              {getCategoryIcon(currentCategory?.icon || "document")}
            </span>
            <div>
              <span className={styles.mobileHeaderLabel}>Categoría actual</span>
              <h2 className={styles.mobileHeaderTitle}>{currentCategory?.title}</h2>
            </div>
          </div>
          <div className={styles.mobileHeaderProgress}>
            <span className={styles.mobileHeaderPercentage}>
              {progress.byCategory[activeCategory]?.percentage || 0}%
            </span>
            <span className={styles.mobileHeaderProgressLabel}>completado</span>
          </div>
        </div>
        <div className={styles.mobileProgressBar}>
          <div
            className={styles.mobileProgressFill}
            style={{ width: `${progress.byCategory[activeCategory]?.percentage || 0}%` }}
          />
        </div>
      </div>

      {/* Progress Bar (desktop) */}
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>Progreso general</span>
          <span className={styles.progressValue}>
            {progress.completed} / {progress.total} ({progress.percentage}%)
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className={styles.categoryTabs}>
        {INSPECTION_CATEGORIES.map((category) => {
          const categoryProgress = progress.byCategory[category.id];
          const isActive = activeCategory === category.id;
          const isComplete = categoryProgress?.percentage === 100;

          return (
            <button
              key={category.id}
              type="button"
              className={`${styles.categoryTab} ${isActive ? styles.categoryTabActive : ""} ${isComplete ? styles.categoryTabComplete : ""}`}
              onClick={() => handleCategoryChange(category.id)}
              aria-label={`${category.title} - ${categoryProgress?.completed || 0} de ${categoryProgress?.total || 0}`}
            >
              <span className={styles.categoryIcon}>
                {getCategoryIcon(category.icon)}
              </span>
              <span className={styles.categoryTitle}>{category.title}</span>
              <span
                className={`${styles.categoryBadge} ${
                  isComplete ? styles.categoryBadgeComplete : ""
                }`}
              >
                {categoryProgress?.completed || 0}/{categoryProgress?.total || 0}
              </span>
              {/* Indicador móvil de completado */}
              {isComplete && (
                <span className={styles.categoryCheckMobile}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Legend */}
        <StatusLegend />

        {/* Sections */}
        {currentCategory?.sections.map((section, index) => {
          // Calcular progreso de la sección
          const sectionItemIds = section.items.map(item => item.id);
          const completedInSection = sectionItemIds.filter(id => results[id]).length;
          const totalInSection = section.items.length;
          // Verificar si hay ítems sin marcar (para mostrar botón "Todo OK")
          const hasUnmarkedItems = section.items.some(
            (item) => !results[item.id] || results[item.id].status === null
          );

          return (
            <div key={section.id} className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIndex}>
                  {completedInSection === totalInSection ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className={styles.sectionTitleWrapper}>
                  <h3 className={styles.sectionTitle}>{section.title}</h3>
                  <span className={styles.sectionProgress}>
                    {completedInSection} de {totalInSection} items
                  </span>
                </div>
                {/* Botón "Todo OK" */}
                {!disabled && hasUnmarkedItems && (
                  <button
                    type="button"
                    className={styles.markAllOkButton}
                    onClick={() => handleMarkAllOk(section.items)}
                    title="Marcar todos como OK"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Todo OK</span>
                  </button>
                )}
              </div>
              <div className={styles.itemsList}>
                {section.items.map((item) => {
                  const itemResult = results[item.id];
                  const itemPhotos = photosByItem[item.id] || [];
                  return (
                    <InspectionItemCard
                      key={item.id}
                      id={item.id}
                      label={item.label}
                      status={itemResult?.status || null}
                      comment={itemResult?.comment}
                      disabled={disabled}
                      onStatusChange={handleStatusChange}
                      categoryId={activeCategory}
                      sectionId={section.id}
                      // Props para fotos
                      reportId={reportId}
                      photos={itemPhotos}
                      onPhotoAdded={onPhotoAdded}
                      onPhotoDeleted={onPhotoDeleted}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Botones de navegación entre categorías (cuando la categoría está completa) */}
        {(() => {
          const currentIndex = INSPECTION_CATEGORIES.findIndex(c => c.id === activeCategory);
          const categoryProgress = progress.byCategory[activeCategory];
          const isComplete = categoryProgress?.percentage === 100;
          const hasPrevious = currentIndex > 0;
          const hasNext = currentIndex < INSPECTION_CATEGORIES.length - 1;
          const previousCategory = hasPrevious ? INSPECTION_CATEGORIES[currentIndex - 1] : null;
          const nextCategory = hasNext ? INSPECTION_CATEGORIES[currentIndex + 1] : null;

          if (!isComplete) return null;

          return (
            <div className={styles.categoryNavigation}>
              <div className={styles.categoryNavigationComplete}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" fill="#22C55E" fillOpacity="0.15"/>
                  <path d="M6 10l3 3 5-6" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>¡Categoría completada!</span>
              </div>
              <div className={styles.categoryNavigationButtons}>
                {hasPrevious && (
                  <button
                    type="button"
                    className={styles.categoryNavButton}
                    onClick={() => handleCategoryChange(previousCategory!.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{previousCategory!.title}</span>
                  </button>
                )}
                {hasNext && (
                  <button
                    type="button"
                    className={`${styles.categoryNavButton} ${styles.categoryNavButtonPrimary}`}
                    onClick={() => handleCategoryChange(nextCategory!.id)}
                  >
                    <span>{nextCategory!.title}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Último guardado (solo informativo) */}
        {lastSaved && !disabled && (
          <div className={styles.lastSavedInfo}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 4v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>
              Último guardado: {lastSaved.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
