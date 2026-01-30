"use client";

import { useRouter } from "next/navigation";
import styles from "./Confirmation.module.css";

interface ConfirmationData {
  id: number;
  status: string;
  date: string;
  timeSlot: string;
  inspector: {
    name: string;
    phone: string | null;
  } | null;
  inspection: {
    title: string;
    type: string;
  };
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plate: string;
  };
  payment?: {
    chargeId: string;
    amount: number;
  };
}

interface ConfirmationProps {
  booking: ConfirmationData;
}

export default function Confirmation({ booking }: ConfirmationProps) {
  const router = useRouter();

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-PE", {
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

  return (
    <div className={styles.container}>
      {/* Success animation */}
      <div className={styles.successIcon}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" fill="var(--bright-sun--100)" />
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="var(--bright-sun--400)"
            strokeWidth="4"
            className={styles.circleAnimation}
          />
          <path
            d="M25 40L35 50L55 30"
            stroke="var(--bright-sun--500)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.checkAnimation}
          />
        </svg>
      </div>

      <h2 className={styles.title}>¡Reserva confirmada!</h2>
      <p className={styles.subtitle}>
        Tu inspección ha sido agendada exitosamente. Te enviamos los detalles por correo.
      </p>

      {/* Detalles de la cita */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.bookingId}>Reserva #{booking.id}</span>
          <span className={styles.status}>Confirmada</span>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.detailRow}>
            <div className={styles.detailIcon}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 8h14M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Fecha y hora</span>
              <span className={styles.detailValue}>
                {formatDate(booking.date)} a las {formatTime(booking.timeSlot)}
              </span>
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.detailIcon}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 15l2-5 3 2 4-6 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Tipo de inspección</span>
              <span className={styles.detailValue}>{booking.inspection.title}</span>
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.detailIcon}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 14l1-4h12l1 4M5 14v2M15 14v2M6 10l1-4h6l1 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Vehículo</span>
              <span className={styles.detailValue}>
                {booking.vehicle.brand} {booking.vehicle.model} {booking.vehicle.year}
              </span>
              <span className={styles.plate}>{booking.vehicle.plate}</span>
            </div>
          </div>

          {booking.inspector && (
            <div className={styles.detailRow}>
              <div className={styles.detailIcon}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3 18c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className={styles.detailContent}>
                <span className={styles.detailLabel}>Inspector asignado</span>
                <span className={styles.detailValue}>{booking.inspector.name}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ubicación */}
      <div className={styles.locationCard}>
        <div className={styles.locationHeader}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span>Centro de Inspección</span>
        </div>
        <p className={styles.locationAddress}>
          Av. República de Panamá 3030, San Isidro, Lima
        </p>
        <a
          href="https://maps.google.com/?q=Av.+República+de+Panamá+3030+San+Isidro+Lima"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.mapLink}
        >
          Ver en Google Maps
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 12l8-8M4 4h8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      {/* Recordatorios */}
      <div className={styles.reminders}>
        <h4 className={styles.remindersTitle}>Recuerda llevar:</h4>
        <ul>
          <li>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" fill="var(--bright-sun--200)" />
              <path d="M5 8l2 2 4-4" stroke="var(--shark--950)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Documento de identidad (DNI)
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" fill="var(--bright-sun--200)" />
              <path d="M5 8l2 2 4-4" stroke="var(--shark--950)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Tarjeta de propiedad del vehículo
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" fill="var(--bright-sun--200)" />
              <path d="M5 8l2 2 4-4" stroke="var(--shark--950)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Llegar 10 minutos antes de la cita
          </li>
        </ul>
      </div>

      {/* Acciones */}
      <div className={styles.actions}>
        <button
          onClick={() => router.push("/")}
          className={styles.primaryButton}
        >
          Volver al inicio
        </button>
        <button
          onClick={() => router.push("/mis-citas")}
          className={styles.secondaryButton}
        >
          Ver mis citas
        </button>
      </div>
    </div>
  );
}
