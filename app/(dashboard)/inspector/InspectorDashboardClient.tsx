"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { NotificationBell } from "@/app/components/NotificationBell/NotificationBell";
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

  // Obtener inspecciones de hoy (usando zona horaria de Lima)
  const getTodayInspections = () => {
    const todayLima = new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
    return pendingInspections.filter((i) => {
      const inspectionDateLima = new Date(i.date).toLocaleDateString("en-CA", { timeZone: "America/Lima" });
      return inspectionDateLima === todayLima;
    });
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

  // Obtener fecha en zona horaria de Lima (formato YYYY-MM-DD)
  const getDateInLima = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-CA", { timeZone: "America/Lima" }); // YYYY-MM-DD
  };

  const getTodayInLima = () => {
    return new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
  };

  // Formatear fecha con ISO string completo o fecha YYYY-MM-DD
  const formatDate = (dateStr: string) => {
    // Si es formato YYYY-MM-DD, agregamos mediodía UTC para evitar problemas de timezone
    const dateToFormat = dateStr.includes("T") ? dateStr : dateStr + "T12:00:00Z";
    const date = new Date(dateToFormat);
    return date.toLocaleDateString("es-PE", {
      timeZone: "America/Lima",
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const isToday = (dateStr: string) => {
    return getDateInLima(dateStr) === getTodayInLima();
  };

  const isTomorrow = (dateStr: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString("en-CA", { timeZone: "America/Lima" });
    return getDateInLima(dateStr) === tomorrowStr;
  };

  const getDaysUntil = (dateStr: string) => {
    const dateInLima = getDateInLima(dateStr);
    const todayInLima = getTodayInLima();
    // Usar "Z" para interpretar como UTC, no como hora local
    const date = new Date(dateInLima + "T12:00:00Z");
    const today = new Date(todayInLima + "T12:00:00Z");
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Agrupar inspecciones pendientes por fecha (usando zona horaria de Lima)
  const groupedPending = pendingInspections.reduce((acc, inspection) => {
    const dateKey = new Date(inspection.date).toLocaleDateString("en-CA", { timeZone: "America/Lima" });
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

          {/* Notificaciones y Avatar */}
          <div className={styles.navbarRight}>
            <NotificationBell />
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
                <Link
                  href="/inspector/configuracion"
                  className={styles.userMenuItem}
                  onClick={() => setShowUserMenu(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M13.5 8a5.5 5.5 0 01-.54 2.37l1.28 1.28a.75.75 0 01-1.06 1.06l-1.28-1.28A5.5 5.5 0 118 2.5a5.48 5.48 0 013.9 1.6l1.28-1.28a.75.75 0 011.06 1.06L12.96 5.16A5.48 5.48 0 0113.5 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Configuración
                </Link>
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
              .map(([dateKey, dateInspections]) => {
                const daysUntil = getDaysUntil(dateKey);

                return (
                  <div key={dateKey} className={styles.dateGroup}>
                    <h3 className={styles.dateHeader}>
                      {isToday(dateKey) ? (
                        <span className={styles.todayBadge}>Hoy</span>
                      ) : isTomorrow(dateKey) ? (
                        <span className={styles.tomorrowBadge}>Mañana</span>
                      ) : (
                        <span className={styles.upcomingBadge}>
                          {daysUntil <= 7
                            ? formatDate(dateKey)
                            : `En ${daysUntil} días`}
                        </span>
                      )}
                      <span className={styles.dateCount}>
                        {dateInspections.length} {dateInspections.length === 1 ? 'inspección' : 'inspecciones'}
                      </span>
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
                );
              })
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {inspection.client.name}
            <span style={{ opacity: 0.4 }}>•</span>
            {inspection.inspectionPlan.title}
          </p>
          {inspection.vehicle.plate && (
            <p className={styles.cardMeta} style={{ marginTop: 2 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="6" cy="12" r="1" fill="currentColor"/>
                <circle cx="18" cy="12" r="1" fill="currentColor"/>
              </svg>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>
                {inspection.vehicle.plate}
              </span>
            </p>
          )}
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a
              href={`https://wa.me/${formatWhatsAppNumber(inspection.client.phone)}?text=Hola ${inspection.client.name}, soy el inspector de VerifiCARLO para tu ${inspection.vehicle.brand} ${inspection.vehicle.model}.`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.actionIcon} ${styles.actionWhatsapp}`}
              title="WhatsApp"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </>
        )}
        <Link
          href={`/inspector/${inspection.id}`}
          className={styles.cardButton}
        >
          {isPending ? (inspection.report ? "Continuar" : "Iniciar") : "Ver reporte"}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
