"use client";

import { useState, useEffect } from "react";
import styles from "./BookingCalendar.module.css";

// ============================================
// INTERFACES (TypeScript)
// ============================================

interface DayAvailability {
  date: string;           // "2024-02-15"
  hasAvailability: boolean;
}

interface BookingCalendarProps {
  onDateSelect: (date: string) => void;
  selectedDate: string | null;
}

// Constantes
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// ============================================
// COMPONENTE PRINCIPAL - Vista de 2 semanas
// ============================================

export default function BookingCalendar({
  onDateSelect,
  selectedDate,
}: BookingCalendarProps) {
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================================
  // Calcular rango de fechas (2 semanas)
  // ============================================
  const getTwoWeeksRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Obtener el lunes de esta semana
    const dayOfWeek = today.getDay(); // 0 = domingo
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysToMonday);

    // Obtener el domingo de la próxima semana (14 días desde el lunes)
    const endOfNextWeek = new Date(startOfWeek);
    endOfNextWeek.setDate(startOfWeek.getDate() + 13);

    return { start: startOfWeek, end: endOfNextWeek };
  };

  const { start: weekStart, end: weekEnd } = getTwoWeeksRange();

  // ============================================
  // Generar los 14 días a mostrar
  // ============================================
  const getVisibleDays = () => {
    const days: Date[] = [];
    const current = new Date(weekStart);

    for (let i = 0; i < 14; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // ============================================
  // Fetch de disponibilidad para ambos meses si es necesario
  // ============================================
  useEffect(() => {
    fetchAvailability();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAvailability = async () => {
    setLoading(true);

    try {
      // Obtener meses únicos del rango
      const months = new Set<string>();
      const current = new Date(weekStart);
      for (let i = 0; i < 14; i++) {
        const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
        months.add(monthStr);
        current.setDate(current.getDate() + 1);
      }

      // Fetch de cada mes
      const allAvailability: DayAvailability[] = [];
      for (const month of months) {
        const res = await fetch(`/api/availability?month=${month}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          allAvailability.push(...data);
        }
      }

      setAvailability(allAvailability);
    } catch (error) {
      console.error("Error fetching availability:", error);
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Funciones de validación
  // ============================================
  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isAvailable = (date: Date) => {
    const dateStr = formatDateString(date);
    const dayData = availability.find((a) => a.date === dateStr);
    return dayData?.hasAvailability || false;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // ============================================
  // Título del calendario
  // ============================================
  const getCalendarTitle = () => {
    const startMonth = MONTHS[weekStart.getMonth()];
    const endMonth = MONTHS[weekEnd.getMonth()];

    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${startMonth} ${weekStart.getFullYear()}`;
    }

    if (weekStart.getFullYear() === weekEnd.getFullYear()) {
      return `${startMonth} - ${endMonth} ${weekStart.getFullYear()}`;
    }

    return `${startMonth} ${weekStart.getFullYear()} - ${endMonth} ${weekEnd.getFullYear()}`;
  };

  // ============================================
  // Preparar días para render
  // ============================================
  const visibleDays = getVisibleDays();

  // ============================================
  // JSX - Vista compacta de 2 semanas
  // ============================================

  return (
    <div className={styles.calendar}>
      {/* Header sin navegación */}
      <div className={styles.headerCompact}>
        <h3 className={styles.monthTitle}>{getCalendarTitle()}</h3>
      </div>

      {/* Días de la semana */}
      <div className={styles.weekdays}>
        {WEEKDAYS.map((day) => (
          <div key={day} className={styles.weekday}>
            {day}
          </div>
        ))}
      </div>

      {/* Grid de 14 días (2 semanas) */}
      <div className={styles.daysCompact}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : (
          visibleDays.map((date) => {
            const dateStr = formatDateString(date);
            const available = isAvailable(date);
            const past = isPast(date);
            const today = isToday(date);
            const selected = selectedDate === dateStr;
            const isDisabled = past || !available;

            return (
              <button
                type="button"
                key={dateStr}
                onClick={() => {
                  if (available && !past) {
                    onDateSelect(dateStr);
                  }
                }}
                disabled={isDisabled}
                className={`
                  ${styles.day}
                  ${past ? styles.past : ""}
                  ${today ? styles.today : ""}
                  ${selected ? styles.selected : ""}
                  ${available && !past ? styles.available : ""}
                  ${!available && !past ? styles.unavailable : ""}
                `}
                aria-label={`${date.getDate()} de ${MONTHS[date.getMonth()]}`}
                aria-selected={selected}
              >
                {date.getDate()}
              </button>
            );
          })
        )}
      </div>

      {/* Leyenda */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.dotAvailable} />
          <span>Disponible</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.dotUnavailable} />
          <span>No disponible</span>
        </div>
      </div>
    </div>
  );
}
