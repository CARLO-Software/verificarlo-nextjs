"use client";

import styles from "./InspectionTimeline.module.css";

// Tipos para el flujo de inspección
type LegalStatus = "BLOQUEADO" | "PENDIENTE" | "EN_PROCESO" | "COMPLETADO";
type MechanicalStatus = "PENDIENTE" | "EN_PROCESO" | "COMPLETADO";

interface VehicleInspectionData {
  id: number;
  plate: string | null;
  legalStatus: LegalStatus;
  mechanicalStatus: MechanicalStatus;
  legalPdfUrl: string | null;
  assignedMechanic: { id: string; name: string } | null;
  assignedAdmin: { id: string; name: string } | null;
  createdAt: string;
  plateAddedAt: string | null;
  legalUnlockedAt: string | null;
  legalStartedAt: string | null;
  legalCompletedAt: string | null;
  mechanicAssignedAt: string | null;
  mechanicStartedAt: string | null;
  mechanicCompletedAt: string | null;
}

interface InspectionTimelineProps {
  vehicleInspection: VehicleInspectionData;
  bookingId: number; // Para construir la URL del informe mecánico
}

// Helper para formatear fechas
function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Helper para determinar el estado de un paso
type StepStatus = "completed" | "in_progress" | "pending" | "blocked";

function getStepStatus(
  status: LegalStatus | MechanicalStatus,
  type: "legal" | "mechanical"
): StepStatus {
  if (type === "legal") {
    switch (status) {
      case "BLOQUEADO":
        return "blocked";
      case "PENDIENTE":
        return "pending";
      case "EN_PROCESO":
        return "in_progress";
      case "COMPLETADO":
        return "completed";
      default:
        return "pending";
    }
  } else {
    switch (status) {
      case "PENDIENTE":
        return "pending";
      case "EN_PROCESO":
        return "in_progress";
      case "COMPLETADO":
        return "completed";
      default:
        return "pending";
    }
  }
}

// Componente para un paso individual
function TimelineStep({
  title,
  subtitle,
  status,
  timestamp,
  assignee,
  icon,
}: {
  title: string;
  subtitle: string;
  status: StepStatus;
  timestamp?: string | null;
  assignee?: string | null;
  icon: "wrench" | "document" | "check" | "clock";
}) {
  const statusLabels: Record<StepStatus, string> = {
    completed: "Completado",
    in_progress: "En proceso",
    pending: "Pendiente",
    blocked: "Bloqueado",
  };

  const icons = {
    wrench: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    document: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10,9 9,9 8,9" />
      </svg>
    ),
    check: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20,6 9,17 4,12" />
      </svg>
    ),
    clock: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12,6 12,12 16,14" />
      </svg>
    ),
  };

  return (
    <div className={styles.step} data-status={status}>
      <div className={styles.stepIcon}>{icons[icon]}</div>
      <div className={styles.stepContent}>
        <div className={styles.stepHeader}>
          <h4 className={styles.stepTitle}>{title}</h4>
          <span className={styles.stepBadge} data-status={status}>
            {statusLabels[status]}
          </span>
        </div>
        <p className={styles.stepSubtitle}>{subtitle}</p>
        {assignee && (
          <p className={styles.stepAssignee}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {assignee}
          </p>
        )}
        {timestamp && (
          <p className={styles.stepTimestamp}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            {formatDate(timestamp)}
          </p>
        )}
      </div>
    </div>
  );
}

export function InspectionTimeline({ vehicleInspection, bookingId }: InspectionTimelineProps) {
  const {
    id,
    plate,
    legalStatus,
    mechanicalStatus,
    legalPdfUrl,
    assignedMechanic,
    assignedAdmin,
    createdAt,
    legalCompletedAt,
    mechanicCompletedAt,
    mechanicStartedAt,
    legalStartedAt,
  } = vehicleInspection;

  // Determinar si es flujo paralelo (con placa desde inicio) o secuencial (sin placa)
  // Si tiene placa Y legalStatus nunca fue BLOQUEADO (legalUnlockedAt es null), es paralelo
  const isParallelFlow = plate !== null && vehicleInspection.legalUnlockedAt === null;

  const mechanicalStepStatus = getStepStatus(mechanicalStatus, "mechanical");
  const legalStepStatus = getStepStatus(legalStatus, "legal");

  // Determinar si ambos están completos
  const allCompleted = mechanicalStatus === "COMPLETADO" && legalStatus === "COMPLETADO";

  return (
    <div className={styles.timeline}>
      <h3 className={styles.timelineTitle}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="20" x2="12" y2="10" />
          <line x1="18" y1="20" x2="18" y2="4" />
          <line x1="6" y1="20" x2="6" y2="16" />
        </svg>
        Progreso de la inspección
      </h3>

      {isParallelFlow ? (
        // ─── FLUJO PARALELO (con placa desde inicio) ───────────────────────
        <>
          <div className={styles.parallelHeader}>
            <TimelineStep
              title="Inspección creada"
              subtitle="Tu inspección ha sido registrada"
              status="completed"
              timestamp={createdAt}
              icon="check"
            />
          </div>

          <div className={styles.parallelContainer}>
            <div className={styles.parallelBranch}>
              <div className={styles.branchLine} data-status={mechanicalStepStatus} />
              <TimelineStep
                title="Inspección mecánica"
                subtitle="Revisión técnica del vehículo"
                status={mechanicalStepStatus}
                timestamp={mechanicCompletedAt || mechanicStartedAt}
                assignee={assignedMechanic?.name}
                icon="wrench"
              />
              {mechanicalStatus === 'COMPLETADO' && (
                <a
                  href={`/api/inspections/${bookingId}/report/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.downloadButton}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Descargar informe mecánico
                </a>
              )}
            </div>

            <div className={styles.parallelDivider}>
              <span>+</span>
            </div>

            <div className={styles.parallelBranch}>
              <div className={styles.branchLine} data-status={legalStepStatus} />
              <TimelineStep
                title="Revisión legal"
                subtitle="Verificación de documentos y antecedentes"
                status={legalStepStatus}
                timestamp={legalCompletedAt || legalStartedAt}
                assignee={assignedAdmin?.name}
                icon="document"
              />
              {legalStatus === 'COMPLETADO' && (
                <a
                  href={`/api/admin/vehicle-inspections/${id}/legal/download-pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.downloadButton}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Descargar informe legal
                </a>
              )}
            </div>
          </div>

          {allCompleted && (
            <div className={styles.completedBanner}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
              <span>Inspección completada</span>
            </div>
          )}
        </>
      ) : (
        // ─── FLUJO SECUENCIAL (sin placa, la agrega mecánico) ──────────────
        <div className={styles.sequentialContainer}>
          <div className={styles.sequentialLine} />

          <TimelineStep
            title="Inspección creada"
            subtitle="Tu inspección ha sido registrada"
            status="completed"
            timestamp={createdAt}
            icon="check"
          />

          <TimelineStep
            title="Inspección mecánica"
            subtitle="Revisión técnica del vehículo"
            status={mechanicalStepStatus}
            timestamp={mechanicCompletedAt || mechanicStartedAt}
            assignee={assignedMechanic?.name}
            icon="wrench"
          />

          {mechanicalStatus === 'COMPLETADO' && (
            <a
              href={`/api/inspections/${bookingId}/report/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.downloadButton}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Descargar informe mecánico
            </a>
          )}

          <TimelineStep
            title="Revisión legal"
            subtitle={
              legalStatus === "BLOQUEADO"
                ? "Esperando registro de placa para iniciar"
                : "Verificación de documentos y antecedentes"
            }
            status={legalStepStatus}
            timestamp={legalCompletedAt || legalStartedAt}
            assignee={legalStatus !== "BLOQUEADO" ? assignedAdmin?.name : undefined}
            icon="document"
          />

          {legalStatus === 'COMPLETADO' && (
            <a
              href={`/api/admin/vehicle-inspections/${id}/legal/download-pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.downloadButton}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Descargar informe legal
            </a>
          )}

          {allCompleted && (
            <div className={styles.completedBanner}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
              <span>Inspección completada</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
