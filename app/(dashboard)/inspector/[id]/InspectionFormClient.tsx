"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./InspectionForm.module.css";
import { InspectionChecklist } from "./components";
import { type InspectionResults } from "./inspectionData";
import type { JsonValue } from "@prisma/client/runtime/library";

type ResultStatus = "PENDING" | "OK" | "WARNING" | "CRITICAL";

interface Photo {
  id: number;
  url: string;
  thumbnailUrl: string | null;
  category: string;
  label: string | null;
}

interface Report {
  id: number;
  legalStatus: ResultStatus;
  legalScore: number | null;
  legalObservations: JsonValue;
  mechanicalStatus: ResultStatus;
  mechanicalScore: number | null;
  mechanicalObservations: JsonValue;
  bodyStatus: ResultStatus;
  bodyScore: number | null;
  bodyObservations: JsonValue;
  interiorStatus?: ResultStatus;
  interiorScore?: number | null;
  interiorObservations?: JsonValue;
  checklistResults?: InspectionResults;
  mileageAtInspection: number | null;
  vinNumber: string | null;
  engineNumber: string | null;
  actualColor: string | null;
  ownershipCardVerified: boolean;
  soatValid: boolean;
  soatExpiryDate: string | null;
  technicalReviewValid: boolean;
  technicalReviewExpiryDate: string | null;
  executiveSummary: string | null;
  recommendations: string | null;
  estimatedRepairCost: number | null;
  overallScore: number | null;
  overallStatus: ResultStatus;
  completedAt: string | null;
  photos: Photo[];
}

interface InspectionData {
  id: number;
  code: string;
  status: string;
  date: string;
  timeSlot: string;
  client: {
    id: string;
    name: string;
    phone: string | null;
    email: string;
  };
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plate: string | null;
    mileage: number | null;
  };
  inspectionPlan: {
    id: number;
    type: string;
    title: string;
    items: string[];
  };
  report: Report | null;
}

interface InspectionFormClientProps {
  inspection: InspectionData;
}

type Section = "info" | "checklist" | "summary";

export function InspectionFormClient({ inspection }: InspectionFormClientProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("info");
  const [report, setReport] = useState<Report | null>(inspection.report);
  const [error, setError] = useState<string | null>(null);

  const isCompleted = report !== null && report.completedAt !== null;

  // Crear informe si no existe
  useEffect(() => {
    const createReportIfNeeded = async () => {
      if (!report && !isCompleted) {
        try {
          const res = await fetch(`/api/bookings/${inspection.id}/report`, {
            method: "POST",
          });
          const data = await res.json();
          if (data.success) {
            setReport({
              ...data.report,
              photos: [],
            });
          }
        } catch {
          setError("Error al crear el informe");
        }
      }
    };
    createReportIfNeeded();
  }, [report, isCompleted, inspection.id]);

  const sections: { id: Section; label: string; icon: JSX.Element }[] = [
    {
      id: "info",
      label: "Información",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M10 9v4M10 7v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "checklist",
      label: "Inspección",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M6 3h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" />
          <path d="M7 8l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "summary",
      label: "Resumen",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
  ];

  const getSectionStatus = (section: Section): "pending" | "complete" | "active" => {
    if (activeSection === section) return "active";
    if (!report) return "pending";

    switch (section) {
      case "info":
        return report.mileageAtInspection ? "complete" : "pending";
      case "checklist":
        // Verificar si hay algún resultado en el checklist
        const hasResults = report.checklistResults && Object.keys(report.checklistResults).length > 0;
        return hasResults ? "complete" : "pending";
      case "summary":
        return report.executiveSummary ? "complete" : "pending";
      default:
        return "pending";
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/inspector" className={styles.backLink}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver
        </Link>
        <div className={styles.headerInfo}>
          <h1 className={styles.headerTitle}>{inspection.code}</h1>
          <p className={styles.headerSubtitle}>
            {inspection.vehicle.brand} {inspection.vehicle.model} {inspection.vehicle.year}
            {inspection.vehicle.plate && ` • ${inspection.vehicle.plate}`}
          </p>
        </div>
        {isCompleted && (
          <span className={styles.completedBadge}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 8l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Completado
          </span>
        )}
      </header>

      {/* Navigation */}
      <nav className={styles.nav}>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`${styles.navItem} ${styles[`navItem--${getSectionStatus(section.id)}`]}`}
          >
            {section.icon}
            <span>{section.label}</span>
            {getSectionStatus(section.id) === "complete" && (
              <svg className={styles.navCheck} width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ))}
      </nav>

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        {activeSection === "info" && (
          <InfoSection
            inspection={inspection}
            report={report}
            onUpdate={(data) => setReport((prev) => prev ? { ...prev, ...data } : prev)}
            disabled={isCompleted}
          />
        )}
        {activeSection === "checklist" && (
          report ? (
            <ChecklistSection
              reportId={report.id}
              initialResults={report.checklistResults || {}}
              onUpdate={(results) => setReport((prev) => prev ? { ...prev, checklistResults: results } : prev)}
              disabled={isCompleted}
            />
          ) : (
            <div style={{ padding: 20, textAlign: "center" }}>
              <p>Cargando checklist...</p>
            </div>
          )
        )}
        {activeSection === "summary" && report && (
          <SummarySection
            report={report}
            onUpdate={(data) => setReport((prev) => prev ? { ...prev, ...data } : prev)}
            onComplete={() => router.refresh()}
            disabled={isCompleted}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// Info Section
// ============================================
function InfoSection({
  inspection,
  report,
  onUpdate,
  disabled,
}: {
  inspection: InspectionData;
  report: Report | null;
  onUpdate: (data: Partial<Report>) => void;
  disabled: boolean;
}) {
  const [vinNumber, setVinNumber] = useState(report?.vinNumber || "");
  const [engineNumber, setEngineNumber] = useState(report?.engineNumber || "");
  const [actualColor, setActualColor] = useState(report?.actualColor || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!report) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/reports/${report.id}/sections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "vehicle",
          data: {
            mileageAtInspection: inspection.vehicle.mileage,
            vinNumber: vinNumber || null,
            engineNumber: engineNumber || null,
            actualColor: actualColor || null,
          },
        }),
      });

      if (res.ok) {
        onUpdate({
          mileageAtInspection: inspection.vehicle.mileage,
          vinNumber: vinNumber || null,
          engineNumber: engineNumber || null,
          actualColor: actualColor || null,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatMileage = (value: number | null) => {
    if (!value) return "No especificado";
    return value.toLocaleString("es-PE") + " km";
  };

  return (
    <div className={styles.section}>
      {/* Datos ingresados por el cliente */}
      <h2 className={styles.sectionTitle}>Datos de la Reserva</h2>
      <p className={styles.sectionSubtitle}>Información proporcionada por el cliente</p>

      <div className={styles.infoGrid}>
        {/* Vehículo - Datos del cliente */}
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Vehículo</h3>
          <p className={styles.infoCardValue}>
            {inspection.vehicle.brand} {inspection.vehicle.model}
          </p>
          <p className={styles.infoCardSubvalue}>Año: {inspection.vehicle.year}</p>
        </div>

        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Placa</h3>
          <p className={styles.infoCardValue}>
            {inspection.vehicle.plate || "No especificada"}
          </p>
        </div>

        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Kilometraje</h3>
          <p className={styles.infoCardValue}>{formatMileage(inspection.vehicle.mileage)}</p>
          <p className={styles.infoCardSubvalue}>Declarado por cliente</p>
        </div>

        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Tipo de Inspección</h3>
          <p className={styles.infoCardValue}>{inspection.inspectionPlan.title}</p>
        </div>
      </div>

      {/* Datos de la cita */}
      <div className={styles.infoGrid} style={{ marginTop: "16px" }}>
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Cliente</h3>
          <p className={styles.infoCardValue}>{inspection.client.name}</p>
          {inspection.client.phone && (
            <a href={`tel:${inspection.client.phone}`} className={styles.infoCardLink}>
              {inspection.client.phone}
            </a>
          )}
        </div>
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Fecha y Hora</h3>
          <p className={styles.infoCardValue}>{formatDate(inspection.date)}</p>
          <p className={styles.infoCardSubvalue}>{formatTime(inspection.timeSlot)}</p>
        </div>
      </div>

      {/* Items del plan */}
      <div className={styles.planItems}>
        <h3 className={styles.planItemsTitle}>Puntos a revisar</h3>
        <ul className={styles.planItemsList}>
          {inspection.inspectionPlan.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Datos verificados por el inspector */}
      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>Verificación del Inspector</h3>
        <p className={styles.formSectionSubtitle}>Datos que debes verificar físicamente</p>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Número VIN</label>
            <input
              type="text"
              value={vinNumber}
              onChange={(e) => setVinNumber(e.target.value.toUpperCase())}
              placeholder="17 caracteres"
              maxLength={17}
              className={styles.input}
              disabled={disabled}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Número de motor</label>
            <input
              type="text"
              value={engineNumber}
              onChange={(e) => setEngineNumber(e.target.value.toUpperCase())}
              placeholder="Número de motor"
              className={styles.input}
              disabled={disabled}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Color real del vehículo</label>
            <input
              type="text"
              value={actualColor}
              onChange={(e) => setActualColor(e.target.value)}
              placeholder="Ej: Gris plata metálico"
              className={styles.input}
              disabled={disabled}
            />
          </div>
        </div>
        {!disabled && (
          <button onClick={handleSave} disabled={saving} className={styles.saveButton}>
            {saving ? "Guardando..." : "Guardar verificación"}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Checklist Section - Nuevo sistema de inspección
// ============================================
function ChecklistSection({
  reportId,
  initialResults,
  onUpdate,
  disabled,
}: {
  reportId: number;
  initialResults: InspectionResults;
  onUpdate: (results: InspectionResults) => void;
  disabled: boolean;
}) {
  const handleSave = async (results: InspectionResults) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/sections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "checklist",
          data: { checklistResults: results },
        }),
      });

      if (res.ok) {
        onUpdate(results);
      }
    } catch (err) {
      console.error("Error al guardar checklist:", err);
    }
  };

  return (
    <InspectionChecklist
      initialResults={initialResults}
      disabled={disabled}
      onSave={handleSave}
    />
  );
}

// ============================================
// Summary Section
// ============================================
import { calculateScoreByCategory, calculateOverallScore, INSPECTION_CATEGORIES } from "./inspectionData";

function SummarySection({
  report,
  onUpdate,
  onComplete,
  disabled,
}: {
  report: Report;
  onUpdate: (data: Partial<Report>) => void;
  onComplete: () => void;
  disabled: boolean;
}) {
  const [summary, setSummary] = useState(report.executiveSummary || "");
  const [recommendations, setRecommendations] = useState(report.recommendations || "");
  const [repairCost, setRepairCost] = useState(report.estimatedRepairCost?.toString() || "");
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular scores desde checklistResults
  const checklistResults = report.checklistResults || {};
  const scoresByCategory = calculateScoreByCategory(checklistResults);
  const overallResult = calculateOverallScore(checklistResults);

  // Verificar si se puede completar (todas las categorías tienen items)
  const allCategoriesStarted = INSPECTION_CATEGORIES.every(
    cat => scoresByCategory[cat.id]?.completed > 0
  );
  const canComplete = allCategoriesStarted && overallResult.status !== "PENDING";

  const handleSaveSummary = async () => {
    setSaving(true);
    try {
      await fetch(`/api/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          executiveSummary: summary || null,
          recommendations: recommendations || null,
          estimatedRepairCost: repairCost ? parseFloat(repairCost) : null,
        }),
      });

      onUpdate({
        executiveSummary: summary || null,
        recommendations: recommendations || null,
        estimatedRepairCost: repairCost ? parseFloat(repairCost) : null,
      });
    } catch (error) {
      console.error("Error al guardar resumen:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!canComplete) {
      setError("Debe completar todas las secciones antes de finalizar");
      return;
    }

    setCompleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/reports/${report.id}/complete`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        onComplete();
      } else {
        setError(data.error || "Error al finalizar el informe");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setCompleting(false);
    }
  };

  const getStatusLabel = (status: ResultStatus) => {
    const labels: Record<ResultStatus, { text: string; color: string }> = {
      PENDING: { text: "Pendiente", color: "#9CA3AF" },
      OK: { text: "Aprobado", color: "#22C55E" },
      WARNING: { text: "Observaciones", color: "#F59E0B" },
      CRITICAL: { text: "Crítico", color: "#EF4444" },
    };
    return labels[status];
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Resumen de la Inspección</h2>

      {/* Puntaje general */}
      <div className={styles.overallScore}>
        <div className={styles.overallScoreCircle} data-status={overallResult.status}>
          <span className={styles.overallScoreValue}>{overallResult.score}</span>
          <span className={styles.overallScoreLabel}>/ 100</span>
        </div>
        <div className={styles.overallScoreInfo}>
          <span
            className={styles.overallScoreStatus}
            style={{ color: getStatusLabel(overallResult.status).color }}
          >
            {getStatusLabel(overallResult.status).text}
          </span>
          <span className={styles.overallScoreHint}>
            {overallResult.status === "PENDING" && "Completa el checklist para ver el resultado"}
            {overallResult.status === "OK" && "El vehículo está en buen estado"}
            {overallResult.status === "WARNING" && "El vehículo tiene observaciones menores"}
            {overallResult.status === "CRITICAL" && "El vehículo tiene defectos importantes"}
          </span>
        </div>
      </div>

      {/* Resultados por categoría */}
      <div className={styles.resultsGrid}>
        {INSPECTION_CATEGORIES.map(category => {
          const catScore = scoresByCategory[category.id];
          return (
            <div key={category.id} className={styles.resultCard} data-status={catScore?.status}>
              <div className={styles.resultCardHeader}>
                <span className={styles.resultLabel}>{category.title}</span>
                <span className={styles.resultProgress}>
                  {catScore?.completed || 0}/{catScore?.total || 0}
                </span>
              </div>
              <div className={styles.resultCardBody}>
                <span
                  className={styles.resultValue}
                  style={{ color: getStatusLabel(catScore?.status || "PENDING").color }}
                >
                  {getStatusLabel(catScore?.status || "PENDING").text}
                </span>
                {catScore?.status !== "PENDING" && (
                  <span className={styles.resultScore}>{catScore?.score}/100</span>
                )}
              </div>
              {/* Mini desglose */}
              {catScore && catScore.completed > 0 && (
                <div className={styles.resultBreakdown}>
                  {catScore.ok > 0 && <span className={styles.resultOk}>{catScore.ok} OK</span>}
                  {catScore.observaciones > 0 && <span className={styles.resultWarning}>{catScore.observaciones} Obs</span>}
                  {catScore.defectos > 0 && <span className={styles.resultCritical}>{catScore.defectos} Def</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumen ejecutivo */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Resumen ejecutivo</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Resumen general de la inspección..."
          className={styles.textarea}
          rows={4}
          disabled={disabled}
        />
      </div>

      {/* Recomendaciones */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Recomendaciones</label>
        <textarea
          value={recommendations}
          onChange={(e) => setRecommendations(e.target.value)}
          placeholder="Recomendaciones para el cliente..."
          className={styles.textarea}
          rows={4}
          disabled={disabled}
        />
      </div>

      {/* Costo estimado */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Costo estimado de reparaciones (S/)</label>
        <input
          type="number"
          value={repairCost}
          onChange={(e) => setRepairCost(e.target.value)}
          placeholder="0.00"
          className={styles.input}
          disabled={disabled}
        />
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {!disabled && (
        <div className={styles.summaryActions}>
          <button onClick={handleSaveSummary} disabled={saving} className={styles.saveButton}>
            {saving ? "Guardando..." : "Guardar resumen"}
          </button>
          <button
            onClick={handleComplete}
            disabled={completing || !canComplete}
            className={styles.completeButton}
          >
            {completing ? "Finalizando..." : "Finalizar inspección"}
          </button>
        </div>
      )}

      {disabled && (
        <div className={styles.completedMessage}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#22C55E" fillOpacity="0.1" />
            <path d="M8 12l3 3 5-6" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Este informe ha sido completado y no puede modificarse</span>
        </div>
      )}
    </div>
  );
}
