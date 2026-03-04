"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import styles from "./Inspector.module.css";

interface Inspection {
  id: number;
  code: string;
  status: string;
  date: string;
  timeSlot: string;
  startTime: string;
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
  inspectorImage?: string | null;
}

export function InspectorDashboardClient({
  pendingInspections,
  completedInspections,
  inspectorName,
  inspectorImage,
}: InspectorDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Obtener iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Formatear fecha actual
  const getCurrentDate = () => {
    return new Date().toLocaleDateString("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  // Obtener inspecciones de hoy
  const getTodayInspections = () => {
    const today = new Date().toDateString();
    return pendingInspections.filter(
      (i) => new Date(i.date).toDateString() === today
    );
  };

  // Obtener próxima inspección
  const getNextInspection = () => {
    const now = new Date();
    const upcoming = pendingInspections
      .filter((i) => new Date(i.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return upcoming[0] || null;
  };

  const todayInspections = getTodayInspections();
  const nextInspection = getNextInspection();

  // Verificar si una inspección es urgente (en menos de 1 hora)
  const isUrgent = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start.getTime() - now.getTime();
    const diffMins = diffMs / (1000 * 60);
    return diffMins > 0 && diffMins <= 60;
  };

  // Tiempo restante para próxima inspección
  const getTimeUntil = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 0) return "Ahora";
    if (diffMins < 60) return `En ${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    return `En ${hours}h ${diffMins % 60}min`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-PE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const isToday = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

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
      {/* Navbar fijo */}
      <nav className={styles.navbar}>
        <div className={styles.navbarContent}>
          {/* Logo/Brand */}
          <div className={styles.navbarBrand}>
            <span className={styles.navbarLogo}>VerifiCARLO</span>
            <span className={styles.navbarBadge}>Inspector</span>
          </div>

          {/* Avatar y menú */}
          <div className={styles.userMenuContainer} ref={menuRef}>
            <button
              className={styles.avatarButton}
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="Menú de usuario"
            >
              {inspectorImage ? (
                <img
                  src={inspectorImage}
                  alt={inspectorName}
                  className={styles.avatarImage}
                />
              ) : (
                <span className={styles.avatarInitials}>
                  {getInitials(inspectorName)}
                </span>
              )}
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className={styles.userMenu}>
                <div className={styles.userMenuHeader}>
                  <p className={styles.userMenuName}>{inspectorName}</p>
                  <p className={styles.userMenuRole}>Inspector</p>
                </div>
                <div className={styles.userMenuDivider} />
                <button
                  className={styles.userMenuItem}
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Header con stats */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerTop}>
            <div>
              <p className={styles.greeting}>Hola, {inspectorName.split(" ")[0]}</p>
              <p className={styles.currentDate}>{getCurrentDate()}</p>
            </div>
            <div className={styles.stats}>
              <div className={styles.statItem} data-type="today">
                <span className={styles.statValue}>{todayInspections.length}</span>
                <span className={styles.statLabel}>Hoy</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{pendingInspections.length}</span>
                <span className={styles.statLabel}>Pendientes</span>
              </div>
            </div>
          </div>

          {/* Próxima inspección compacta */}
          {nextInspection && (
            <Link href={`/inspector/${nextInspection.id}`} className={styles.nextInspection}>
              <div className={styles.nextInspectionLeft}>
                <span className={styles.nextInspectionTime}>
                  {getTimeUntil(nextInspection.startTime)}
                </span>
                <span className={styles.nextInspectionVehicle}>
                  {nextInspection.vehicle.brand} {nextInspection.vehicle.model} • {nextInspection.client.name}
                </span>
              </div>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          )}
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
                          isUrgent={isUrgent(inspection.startTime)}
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
// Inspection Card Component (Compacto)
// ============================================
function InspectionCard({
  inspection,
  isPending,
  isUrgent,
}: {
  inspection: Inspection;
  isPending: boolean;
  isUrgent?: boolean;
}) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusBadge = () => {
    if (!inspection.report) return { text: "Pendiente", color: "gray" };
    if (inspection.report.completedAt) return { text: "Completado", color: "green" };
    return { text: "En progreso", color: "yellow" };
  };

  const statusBadge = getStatusBadge();

  const formatWhatsAppNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.startsWith("51") ? cleaned : `51${cleaned}`;
  };

  return (
    <div className={`${styles.card} ${isUrgent ? styles.cardUrgent : ""}`}>
      {/* Contenido principal */}
      <div className={styles.cardMain}>
        {/* Hora */}
        <div className={styles.cardTimeBlock}>
          <span className={styles.cardTimeValue}>{formatTime(inspection.timeSlot)}</span>
          {isUrgent && <span className={styles.cardUrgentDot} />}
        </div>

        {/* Info del vehículo */}
        <div className={styles.cardInfo}>
          <h4 className={styles.cardTitle}>
            {inspection.vehicle.brand} {inspection.vehicle.model}
            <span className={styles.cardYear}>{inspection.vehicle.year}</span>
          </h4>
          <p className={styles.cardMeta}>
            {inspection.client.name} • {inspection.inspectionPlan.title}
          </p>
        </div>

        {/* Estado */}
        <span className={styles.statusBadge} data-color={statusBadge.color}>
          {statusBadge.text}
        </span>
      </div>

      {/* Acciones */}
      <div className={styles.cardActions}>
        {isPending && inspection.client.phone && (
          <>
            <a
              href={`tel:${inspection.client.phone}`}
              className={styles.actionIcon}
              title="Llamar"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3.5 2.5H6.5L8 6L6 7.25a9 9 0 004.75 4.75L12 10l3.5 1.5V15a1 1 0 01-1 1A12 12 0 012 4a1 1 0 011-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a
              href={`https://wa.me/${formatWhatsAppNumber(inspection.client.phone)}?text=Hola ${inspection.client.name}, soy el inspector de VerifiCARLO para tu ${inspection.vehicle.brand} ${inspection.vehicle.model}.`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.actionIcon} ${styles.actionWhatsapp}`}
              title="WhatsApp"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5a7.5 7.5 0 00-6.5 11.25L1.5 16.5l3.9-.975A7.5 7.5 0 109 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.5 7.5h0M9 7.5h0M11.5 7.5h0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </a>
          </>
        )}
        <Link
          href={`/inspector/${inspection.id}`}
          className={styles.cardButton}
        >
          {isPending ? (inspection.report ? "Continuar" : "Iniciar") : "Ver"}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
