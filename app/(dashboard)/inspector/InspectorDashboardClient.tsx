"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Inspector.module.css";

interface Inspection {
  id: number;
  code: string;
  status: string;
  date: string;
  timeSlot: string;
  startTime: string;
  client: {
    id: number;
    name: string;
    phone: string | null;
    email: string;
  };
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plate: string | null;
  };
  inspectionPlan: {
    id: number;
    type: string;
    title: string;
  };
  report: {
    id: number;
    status: string;
    completedAt: string | null;
  } | null;
}

interface InspectorDashboardClientProps {
  pendingInspections: Inspection[];
  completedInspections: Inspection[];
  inspectorName: string;
}

export function InspectorDashboardClient({
  pendingInspections,
  completedInspections,
  inspectorName,
}: InspectorDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-PE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const isToday = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const inspections = activeTab === "pending" ? pendingInspections : completedInspections;

  // Agrupar inspecciones pendientes por fecha
  const groupedPending = pendingInspections.reduce((acc, inspection) => {
    const dateKey = new Date(inspection.date).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(inspection);
    return acc;
  }, {} as Record<string, Inspection[]>);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <p className={styles.greeting}>Hola, {inspectorName}</p>
            <h1 className={styles.title}>Mis Inspecciones</h1>
          </div>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{pendingInspections.length}</span>
              <span className={styles.statLabel}>Pendientes</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{completedInspections.length}</span>
              <span className={styles.statLabel}>Completadas</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "pending" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Pendientes ({pendingInspections.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "completed" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Completadas ({completedInspections.length})
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === "pending" ? (
          // Vista agrupada por fecha para pendientes
          Object.keys(groupedPending).length === 0 ? (
            <EmptyState
              icon={
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
                  <path d="M24 14v10l7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              }
              title="No tienes inspecciones pendientes"
              description="Cuando te asignen una inspección, aparecerá aquí"
            />
          ) : (
            Object.entries(groupedPending)
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .map(([dateKey, dateInspections]) => (
                <div key={dateKey} className={styles.dateGroup}>
                  <h3 className={styles.dateHeader}>
                    {isToday(dateKey) ? (
                      <span className={styles.todayBadge}>Hoy</span>
                    ) : (
                      formatDate(dateKey)
                    )}
                    <span className={styles.dateCount}>{dateInspections.length} inspección(es)</span>
                  </h3>
                  <div className={styles.inspectionsList}>
                    {dateInspections
                      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
                      .map((inspection) => (
                        <InspectionCard
                          key={inspection.id}
                          inspection={inspection}
                          isPending={true}
                        />
                      ))}
                  </div>
                </div>
              ))
          )
        ) : (
          // Vista simple para completadas
          completedInspections.length === 0 ? (
            <EmptyState
              icon={
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 24l6 6 10-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
              title="No tienes inspecciones completadas"
              description="Las inspecciones que completes aparecerán aquí"
            />
          ) : (
            <div className={styles.inspectionsList}>
              {completedInspections.map((inspection) => (
                <InspectionCard
                  key={inspection.id}
                  inspection={inspection}
                  isPending={false}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ============================================
// Inspection Card Component
// ============================================
function InspectionCard({
  inspection,
  isPending,
}: {
  inspection: Inspection;
  isPending: boolean;
}) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusBadge = () => {
    if (!inspection.report) {
      return { text: "Sin iniciar", color: "gray" };
    }
    if (inspection.report.completedAt) {
      return { text: "Completado", color: "green" };
    }
    return { text: "En progreso", color: "yellow" };
  };

  const statusBadge = getStatusBadge();

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTime}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {formatTime(inspection.timeSlot)}
        </div>
        <span
          className={styles.statusBadge}
          data-color={statusBadge.color}
        >
          {statusBadge.text}
        </span>
      </div>

      <div className={styles.cardBody}>
        <h4 className={styles.cardTitle}>
          {inspection.vehicle.brand} {inspection.vehicle.model} {inspection.vehicle.year}
        </h4>
        <p className={styles.cardPlate}>
          {inspection.vehicle.plate || "Sin placa"}
        </p>

        <div className={styles.cardDetails}>
          <div className={styles.cardDetail}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 7a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM2 12.5c0-2.5 2.239-4.5 5-4.5s5 2 5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>{inspection.client.name}</span>
          </div>
          {inspection.client.phone && (
            <div className={styles.cardDetail}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 2h3l1 3-1.5 1a7 7 0 003 3l1-1.5 3 1v3a1 1 0 01-1 1A10 10 0 012 2.5a1 1 0 011-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <a href={`tel:${inspection.client.phone}`} className={styles.phoneLink}>
                {inspection.client.phone}
              </a>
            </div>
          )}
          <div className={styles.cardDetail}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="3" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 6h10" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span>{inspection.inspectionPlan.title}</span>
          </div>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.cardCode}>{inspection.code}</span>
        <Link
          href={`/inspector/${inspection.id}`}
          className={`${styles.cardButton} ${isPending ? styles.cardButtonPrimary : styles.cardButtonSecondary}`}
        >
          {isPending ? (
            inspection.report ? "Continuar" : "Iniciar inspección"
          ) : (
            "Ver informe"
          )}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

// ============================================
// Empty State Component
// ============================================
function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>{icon}</div>
      <h3 className={styles.emptyTitle}>{title}</h3>
      <p className={styles.emptyDescription}>{description}</p>
    </div>
  );
}
