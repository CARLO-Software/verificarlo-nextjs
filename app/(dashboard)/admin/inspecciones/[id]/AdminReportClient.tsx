"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./AdminReport.module.css";
import { useToast } from "@/app/components/Toast";
import {
  INSPECTION_CATEGORIES,
  calculateScoreByCategory,
  calculateOverallScore,
  type InspectionResults,
} from "@/app/(dashboard)/inspector/[id]/inspectionData";

type ResultStatus = "PENDING" | "OK" | "WARNING" | "CRITICAL";
type MechanicalVerdict = "PENDING" | "APROBADO" | "OBSERVADO" | "NO_APROBADO";
type InspectionStatus = "OK" | "OBSERVACION" | "DEFECTO" | "NO_APLICA" | null;

interface Photo {
  id: number;
  url: string;
  thumbnailUrl: string | null;
  category: string;
  label: string | null;
  checklistItemId: string | null;
}

interface Report {
  id: number;
  checklistResults: Record<string, { status: string; comment?: string }> | null;
  mileageAtInspection: number | null;
  overallScore: number | null;
  overallStatus: ResultStatus;
  mechanicalVerdict: MechanicalVerdict;
  hasSiniestro: boolean;
  hasKilometrajeAdulterado: boolean;
  executiveSummary: string | null;
  estimatedRepairCost: number | null;
  completedAt: string | null;
  photos: Photo[];
}

interface VehicleInspectionData {
  id: number;
  plate: string | null;
  legalStatus: string;
  mechanicalStatus: string;
  mechanicCompletedAt: string | null;
  legalCompletedAt: string | null;
}

interface InspectionData {
  id: number;
  code: string;
  status: string;
  date: string;
  timeSlot: string;
  createdAt: string;
  client: {
    id: string;
    name: string;
    phone: string | null;
    email: string;
  };
  inspector: {
    id: string;
    name: string;
    email: string;
  } | null;
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
    price: number;
  };
  adminNotes: string | null;
  inspectorNotes: string | null;
  report: Report | null;
  vehicleInspection: VehicleInspectionData | null;
}

interface AdminReportClientProps {
  inspection: InspectionData;
}

// Colores y etiquetas para estados
const STATUS_CONFIG = {
  OK: { label: "OK", color: "#22C55E", bg: "#DCFCE7" },
  OBSERVACION: { label: "Observacion", color: "#F59E0B", bg: "#FEF3C7" },
  DEFECTO: { label: "Defecto", color: "#EF4444", bg: "#FEE2E2" },
  NO_APLICA: { label: "N/A", color: "#9CA3AF", bg: "#F3F4F6" },
};

const VERDICT_CONFIG = {
  PENDING: { label: "Pendiente", color: "#9CA3AF", bg: "#F3F4F6", icon: "?" },
  APROBADO: { label: "Aprobado", color: "#22C55E", bg: "#DCFCE7", icon: "✓" },
  OBSERVADO: { label: "Observado", color: "#F59E0B", bg: "#FEF3C7", icon: "!" },
  NO_APROBADO: { label: "No Aprobado", color: "#EF4444", bg: "#FEE2E2", icon: "✕" },
};

const RESULT_STATUS_CONFIG = {
  PENDING: { label: "Pendiente", color: "#9CA3AF" },
  OK: { label: "Aprobado", color: "#22C55E" },
  WARNING: { label: "Observaciones", color: "#F59E0B" },
  CRITICAL: { label: "Critico", color: "#EF4444" },
};

export function AdminReportClient({ inspection }: AdminReportClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [adminNotes, setAdminNotes] = useState(inspection.adminNotes || "");
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    INSPECTION_CATEGORIES.map((c) => c.id)
  );
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const report = inspection.report;
  const checklistResults = (report?.checklistResults || {}) as InspectionResults;
  const scoresByCategory = calculateScoreByCategory(checklistResults);
  const overallResult = calculateOverallScore(checklistResults);

  const isCompleted = report?.completedAt !== null;

  // Toggle categoria expandida
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Guardar notas del admin
  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/bookings/${inspection.id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      });

      if (res.ok) {
        showToast("Notas guardadas correctamente", "success");
      } else {
        showToast("Error al guardar las notas", "error");
      }
    } catch {
      showToast("Error de conexion", "error");
    } finally {
      setSaving(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const datePart = dateStr.split("T")[0];
    const date = new Date(datePart + "T12:00:00Z");
    return date.toLocaleDateString("es-PE", {
      timeZone: "America/Lima",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Formatear hora
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Obtener fotos de un item
  const getPhotosForItem = (itemId: string): Photo[] => {
    return report?.photos.filter((p) => p.checklistItemId === itemId) || [];
  };

  // Obtener el label de un item del checklist
  const getItemLabel = (itemId: string): string => {
    for (const category of INSPECTION_CATEGORIES) {
      for (const section of category.sections) {
        const item = section.items.find((i) => i.id === itemId);
        if (item) return item.label;
      }
    }
    return itemId;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/admin/inspecciones" className={styles.backLink}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Volver a inspecciones
        </Link>
        <div className={styles.headerContent}>
          <div className={styles.headerInfo}>
            <h1 className={styles.headerTitle}>Reporte {inspection.code}</h1>
            <p className={styles.headerSubtitle}>
              {inspection.vehicle.brand} {inspection.vehicle.model}{" "}
              {inspection.vehicle.year}
              {inspection.vehicle.plate && ` - ${inspection.vehicle.plate}`}
            </p>
          </div>
          {isCompleted && (
            <span className={styles.completedBadge}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 8l3 3 5-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Completado
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <div className={styles.content}>
        {/* Sidebar izquierdo - Info general */}
        <aside className={styles.sidebar}>
          {/* Info del cliente */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Cliente</h3>
            <p className={styles.infoCardValue}>{inspection.client.name}</p>
            <p className={styles.infoCardSubvalue}>{inspection.client.email}</p>
            {inspection.client.phone && (
              <a
                href={`tel:${inspection.client.phone}`}
                className={styles.infoCardLink}
              >
                {inspection.client.phone}
              </a>
            )}
          </div>

          {/* Info de la cita */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Fecha de inspeccion</h3>
            <p className={styles.infoCardValue}>{formatDate(inspection.date)}</p>
            <p className={styles.infoCardSubvalue}>
              {formatTime(inspection.timeSlot)}
            </p>
          </div>

          {/* Inspector */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Inspector</h3>
            {inspection.inspector ? (
              <>
                <p className={styles.infoCardValue}>{inspection.inspector.name}</p>
                <p className={styles.infoCardSubvalue}>
                  {inspection.inspector.email}
                </p>
              </>
            ) : (
              <p className={styles.infoCardSubvalue}>Sin asignar</p>
            )}
          </div>

          {/* Kilometraje */}
          {report?.mileageAtInspection && (
            <div className={styles.infoCard}>
              <h3 className={styles.infoCardTitle}>Kilometraje</h3>
              <p className={styles.infoCardValue}>
                {report.mileageAtInspection.toLocaleString("es-PE")} km
              </p>
            </div>
          )}

          {/* Costo de reparaciones */}
          {report?.estimatedRepairCost && (
            <div className={styles.infoCard}>
              <h3 className={styles.infoCardTitle}>Costo estimado reparaciones</h3>
              <p className={styles.infoCardValue}>
                S/ {report.estimatedRepairCost.toLocaleString("es-PE")}
              </p>
            </div>
          )}

          {/* Notas del inspector */}
          {inspection.inspectorNotes && (
            <div className={styles.infoCard}>
              <h3 className={styles.infoCardTitle}>Notas del inspector</h3>
              <p className={styles.notesText}>{inspection.inspectorNotes}</p>
            </div>
          )}

          {/* Notas del admin (editable) */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Notas del administrador</h3>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Agregar notas..."
              className={styles.notesInput}
              rows={4}
            />
            <button
              onClick={handleSaveNotes}
              disabled={saving || adminNotes === (inspection.adminNotes || "")}
              className={styles.saveNotesButton}
            >
              {saving ? "Guardando..." : "Guardar notas"}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className={styles.main}>
          {!report ? (
            <div className={styles.noReport}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="28" stroke="#E5E7EB" strokeWidth="4" />
                <path
                  d="M32 20v16M32 44h.02"
                  stroke="#9CA3AF"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
              <h2>Inspeccion no completada</h2>
              <p>El inspector aun no ha finalizado esta inspeccion.</p>
            </div>
          ) : (
            <>
              {/* Veredicto y puntaje general */}
              <section className={styles.verdictSection}>
                <div className={styles.overallScore}>
                  <div
                    className={styles.scoreCircle}
                    data-status={overallResult.status}
                  >
                    <span className={styles.scoreValue}>
                      {overallResult.score}
                    </span>
                    <span className={styles.scoreLabel}>/ 100</span>
                  </div>
                  <div className={styles.scoreInfo}>
                    <span
                      className={styles.scoreStatus}
                      style={{
                        color:
                          RESULT_STATUS_CONFIG[overallResult.status]?.color ||
                          "#9CA3AF",
                      }}
                    >
                      {RESULT_STATUS_CONFIG[overallResult.status]?.label ||
                        "Pendiente"}
                    </span>
                    <span className={styles.scoreHint}>Puntaje general</span>
                  </div>
                </div>

                {/* Veredicto del mecanico */}
                <div
                  className={styles.verdictCard}
                  style={{
                    backgroundColor:
                      VERDICT_CONFIG[report.mechanicalVerdict]?.bg || "#F3F4F6",
                    borderColor:
                      VERDICT_CONFIG[report.mechanicalVerdict]?.color ||
                      "#9CA3AF",
                  }}
                >
                  <span
                    className={styles.verdictIcon}
                    style={{
                      color:
                        VERDICT_CONFIG[report.mechanicalVerdict]?.color ||
                        "#9CA3AF",
                    }}
                  >
                    {VERDICT_CONFIG[report.mechanicalVerdict]?.icon || "?"}
                  </span>
                  <div className={styles.verdictInfo}>
                    <span className={styles.verdictLabel}>
                      Veredicto del mecanico
                    </span>
                    <span
                      className={styles.verdictValue}
                      style={{
                        color:
                          VERDICT_CONFIG[report.mechanicalVerdict]?.color ||
                          "#9CA3AF",
                      }}
                    >
                      {VERDICT_CONFIG[report.mechanicalVerdict]?.label ||
                        "Pendiente"}
                    </span>
                  </div>
                </div>

                {/* Alertas criticas */}
                {(report.hasSiniestro || report.hasKilometrajeAdulterado) && (
                  <div className={styles.criticalAlerts}>
                    {report.hasSiniestro && (
                      <div className={styles.criticalAlert}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path
                            d="M10 2L2 18h16L10 2z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 8v4M10 14h.01"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span>Vehiculo con siniestro detectado</span>
                      </div>
                    )}
                    {report.hasKilometrajeAdulterado && (
                      <div className={styles.criticalAlert}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path
                            d="M10 2L2 18h16L10 2z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 8v4M10 14h.01"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span>Kilometraje adulterado</span>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Puntajes por categoria */}
              <section className={styles.categoriesSection}>
                <h2 className={styles.sectionTitle}>Resultados por categoria</h2>
                <div className={styles.categoryCards}>
                  {INSPECTION_CATEGORIES.map((category) => {
                    const catScore = scoresByCategory[category.id];
                    return (
                      <div
                        key={category.id}
                        className={styles.categoryCard}
                        data-status={catScore?.status || "PENDING"}
                      >
                        <div className={styles.categoryHeader}>
                          <span className={styles.categoryTitle}>
                            {category.title}
                          </span>
                          <span className={styles.categoryProgress}>
                            {catScore?.completed || 0}/{catScore?.total || 0}
                          </span>
                        </div>
                        <div className={styles.categoryBody}>
                          <span
                            className={styles.categoryStatus}
                            style={{
                              color:
                                RESULT_STATUS_CONFIG[catScore?.status || "PENDING"]
                                  ?.color || "#9CA3AF",
                            }}
                          >
                            {RESULT_STATUS_CONFIG[catScore?.status || "PENDING"]
                              ?.label || "Pendiente"}
                          </span>
                          {catScore?.status !== "PENDING" && (
                            <span className={styles.categoryScore}>
                              {catScore?.score}/100
                            </span>
                          )}
                        </div>
                        {catScore && catScore.completed > 0 && (
                          <div className={styles.categoryBreakdown}>
                            {catScore.ok > 0 && (
                              <span className={styles.breakdownOk}>
                                {catScore.ok} OK
                              </span>
                            )}
                            {catScore.observaciones > 0 && (
                              <span className={styles.breakdownWarning}>
                                {catScore.observaciones} Obs
                              </span>
                            )}
                            {catScore.defectos > 0 && (
                              <span className={styles.breakdownCritical}>
                                {catScore.defectos} Def
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Resumen ejecutivo */}
              {report.executiveSummary && (
                <section className={styles.summarySection}>
                  <h2 className={styles.sectionTitle}>Resumen ejecutivo</h2>
                  <p className={styles.summaryText}>{report.executiveSummary}</p>
                </section>
              )}

              {/* Checklist detallado */}
              <section className={styles.checklistSection}>
                <h2 className={styles.sectionTitle}>Checklist detallado</h2>

                {INSPECTION_CATEGORIES.map((category) => (
                  <div key={category.id} className={styles.categoryAccordion}>
                    <button
                      className={styles.categoryAccordionHeader}
                      onClick={() => toggleCategory(category.id)}
                    >
                      <span className={styles.categoryAccordionTitle}>
                        {category.title}
                      </span>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        className={`${styles.accordionIcon} ${
                          expandedCategories.includes(category.id)
                            ? styles.expanded
                            : ""
                        }`}
                      >
                        <path
                          d="M5 7.5L10 12.5L15 7.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    {expandedCategories.includes(category.id) && (
                      <div className={styles.categoryAccordionContent}>
                        {category.sections.map((section) => (
                          <div key={section.id} className={styles.checklistGroup}>
                            <h4 className={styles.checklistGroupTitle}>
                              {section.title}
                            </h4>
                            <div className={styles.checklistItems}>
                              {section.items.map((item) => {
                                const result = checklistResults[item.id];
                                const status = result?.status as InspectionStatus;
                                const photos = getPhotosForItem(item.id);
                                const config = status
                                  ? STATUS_CONFIG[status]
                                  : null;

                                return (
                                  <div
                                    key={item.id}
                                    className={styles.checklistItem}
                                  >
                                    <div className={styles.checklistItemHeader}>
                                      <span className={styles.checklistItemLabel}>
                                        {item.label}
                                      </span>
                                      {status ? (
                                        <span
                                          className={styles.checklistItemStatus}
                                          style={{
                                            backgroundColor: config?.bg,
                                            color: config?.color,
                                          }}
                                        >
                                          {config?.label}
                                        </span>
                                      ) : (
                                        <span
                                          className={styles.checklistItemStatus}
                                          style={{
                                            backgroundColor: "#F3F4F6",
                                            color: "#9CA3AF",
                                          }}
                                        >
                                          Sin revisar
                                        </span>
                                      )}
                                    </div>

                                    {/* Comentario del inspector */}
                                    {result?.comment && (
                                      <p className={styles.checklistItemComment}>
                                        {result.comment}
                                      </p>
                                    )}

                                    {/* Fotos del item */}
                                    {photos.length > 0 && (
                                      <div className={styles.checklistItemPhotos}>
                                        {photos.map((photo) => (
                                          <button
                                            key={photo.id}
                                            className={styles.photoThumb}
                                            onClick={() =>
                                              setSelectedPhoto(photo)
                                            }
                                          >
                                            <Image
                                              src={photo.thumbnailUrl || photo.url}
                                              alt={photo.label || "Foto"}
                                              width={80}
                                              height={80}
                                              className={styles.photoThumbImg}
                                            />
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </section>

              {/* Galeria de fotos general */}
              {report.photos.length > 0 && (
                <section className={styles.photosSection}>
                  <h2 className={styles.sectionTitle}>
                    Todas las fotos ({report.photos.length})
                  </h2>
                  <div className={styles.photosGrid}>
                    {report.photos.map((photo) => (
                      <button
                        key={photo.id}
                        className={styles.photoCard}
                        onClick={() => setSelectedPhoto(photo)}
                      >
                        <Image
                          src={photo.thumbnailUrl || photo.url}
                          alt={photo.label || "Foto de inspeccion"}
                          width={200}
                          height={150}
                          className={styles.photoCardImg}
                        />
                        {photo.label && (
                          <span className={styles.photoCardLabel}>
                            {photo.label}
                          </span>
                        )}
                        {photo.checklistItemId && (
                          <span className={styles.photoCardItem}>
                            {getItemLabel(photo.checklistItemId)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal de foto */}
      {selectedPhoto && (
        <div
          className={styles.photoModal}
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className={styles.photoModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.photoModalClose}
              onClick={() => setSelectedPhoto(null)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <Image
              src={selectedPhoto.url}
              alt={selectedPhoto.label || "Foto"}
              width={800}
              height={600}
              className={styles.photoModalImg}
            />
            {selectedPhoto.label && (
              <p className={styles.photoModalLabel}>{selectedPhoto.label}</p>
            )}
            {selectedPhoto.checklistItemId && (
              <p className={styles.photoModalItem}>
                Item: {getItemLabel(selectedPhoto.checklistItemId)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
