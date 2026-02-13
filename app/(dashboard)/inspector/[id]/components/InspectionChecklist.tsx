/**
 * InspectionChecklist - Componente principal que renderiza dinámicamente
 * las secciones e ítems de inspección según la categoría seleccionada.
 * Maneja el estado de todos los ítems con AUTOGUARDADO.
 */
"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  INSPECTION_CATEGORIES,
  type InspectionStatus,
  type InspectionResults,
  calculateProgress,
} from "../inspectionData";
import { InspectionItemCard } from "./InspectionItemCard";
import { StatusLegend } from "./StatusLegend";
import styles from "./InspectionChecklist.module.css";

interface InspectionChecklistProps {
  initialResults?: InspectionResults;
  disabled?: boolean;
  onSave?: (results: InspectionResults) => Promise<void>;
  onCategoryChange?: (categoryId: string) => void;
}

export function InspectionChecklist({
  initialResults = {},
  disabled = false,
  onSave,
  onCategoryChange,
}: InspectionChecklistProps) {
  const [activeCategory, setActiveCategory] = useState<string>(
    INSPECTION_CATEGORIES[0].id
  );
  const [results, setResults] = useState<InspectionResults>(initialResults);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Ref para el timeout del autoguardado
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Ref para trackear si hay cambios pendientes
  const hasUnsavedChanges = useRef(false);

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
    if (!onSave || saving || disabled) return;

    setSaving(true);
    try {
      await onSave(newResults);
      setLastSaved(new Date());
      hasUnsavedChanges.current = false;
    } catch (error) {
      console.error("Error al autoguardar:", error);
    } finally {
      setSaving(false);
    }
  }, [onSave, saving, disabled]);

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

        // Cancelar timeout anterior si existe
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        // Programar autoguardado después de 1 segundo de inactividad
        saveTimeoutRef.current = setTimeout(() => {
          autoSave(newResults);
        }, 1000);

        return newResults;
      });
    },
    [autoSave]
  );

  // Guardar al desmontar el componente si hay cambios pendientes
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Guardar inmediatamente si hay cambios pendientes
      if (hasUnsavedChanges.current && onSave) {
        onSave(results);
      }
    };
  }, [results, onSave]);

  // Manejar cambio de categoría
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    onCategoryChange?.(categoryId);
  };

  // Guardar resultados manualmente
  const handleSave = async () => {
    if (!onSave || saving) return;

    // Cancelar autoguardado pendiente
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaving(true);
    try {
      await onSave(results);
      setLastSaved(new Date());
      hasUnsavedChanges.current = false;
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setSaving(false);
    }
  };

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
              </div>
              <div className={styles.itemsList}>
                {section.items.map((item) => {
                  const itemResult = results[item.id];
                  return (
                    <InspectionItemCard
                      key={item.id}
                      id={item.id}
                      label={item.label}
                      status={itemResult?.status || null}
                      comment={itemResult?.comment}
                      disabled={disabled}
                      onStatusChange={handleStatusChange}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Save Button */}
        {!disabled && onSave && (
          <div className={styles.saveSection}>
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className={styles.spinner} />
                  Guardando...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M15 6l-6 6-3-3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Guardar cambios
                </>
              )}
            </button>
            {lastSaved && (
              <span className={styles.lastSaved}>
                Guardado a las {lastSaved.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
