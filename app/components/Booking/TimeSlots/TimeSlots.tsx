"use client";

import { useState, useEffect } from "react";
import styles from "./TimeSlots.module.css";

interface Slot {
  time: string;
  available: boolean;
  remainingCapacity: number;
}

interface DayAvailability {
  date: string;
  isWorkingDay: boolean;
  reason?: string;
  slots: Slot[];
}

interface TimeSlotsProps {
  date: string;
  onSlotSelect: (slot: string) => void;
  selectedSlot: string | null;
}

export default function TimeSlots({
  date,
  onSlotSelect,
  selectedSlot,
}: TimeSlotsProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (date) {
      fetchSlots();
    }
  }, [date]);

  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/availability?date=${date}`);
      const data: DayAvailability = await res.json();

      if (!data.isWorkingDay) {
        setError(data.reason || "Este día no está disponible");
        setSlots([]);
      } else {
        setSlots(data.slots || []);
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
      setError("Error al cargar horarios");
    } finally {
      setLoading(false);
    }
  };

  // Formatear hora para mostrar
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Formatear fecha para mostrar
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Cargando horarios...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const availableSlots = slots.filter((s) => s.available);

  // Cuando no hay slots disponibles = todos los inspectores ocupados
  if (availableSlots.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.unavailableDay}>
          <div className={styles.unavailableIcon}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" />
              <path d="M16 16L32 32M32 16L16 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className={styles.unavailableContent}>
            <span className={styles.unavailableBadge}>No disponible</span>
            <h4 className={styles.unavailableTitle}>
              Todos los inspectores ocupados
            </h4>
            <p className={styles.unavailableText}>
              Lo sentimos, no hay cupos disponibles para esta fecha.
              Por favor, selecciona otro día en el calendario.
            </p>
          </div>
          <div className={styles.unavailableHint}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 14A6 6 0 108 2a6 6 0 000 12z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>Los días con disponibilidad aparecen resaltados en el calendario</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.title}>Selecciona un horario</h4>
        <p className={styles.dateLabel}>{formatDate(date)}</p>
      </div>

      <div className={styles.grid}>
        {slots.map((slot) => {
          const isSelected = selectedSlot === slot.time;
          const isLastSpot = slot.available && slot.remainingCapacity === 1;

          return (
            <button
              key={slot.time}
              onClick={() => slot.available && onSlotSelect(slot.time)}
              disabled={!slot.available}
              className={`
                ${styles.slot}
                ${isSelected ? styles.slotSelected : ""}
                ${slot.available ? styles.slotAvailable : styles.slotUnavailable}
              `}
              aria-selected={isSelected}
            >
              <span className={styles.time}>{formatTime(slot.time)}</span>
              {isLastSpot && (
                <span className={styles.lastSpot}>¡Último cupo!</span>
              )}
              {!slot.available && (
                <span className={styles.occupiedLabel}>Ocupado</span>
              )}
            </button>
          );
        })}
      </div>

      <p className={styles.helperText}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Cada inspección dura aproximadamente 1 hora
      </p>
    </div>
  );
}
