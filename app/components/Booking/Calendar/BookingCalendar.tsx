"use client";

import { useState, useEffect } from "react";
import styles from "./BookingCalendar.module.css";

interface MonthAvailability {
  date: string;
  hasAvailability: boolean;
}

interface BookingCalendarProps {
  onDateSelect: (date: string) => void;
  selectedDate: string | null;
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function BookingCalendar({
  onDateSelect,
  selectedDate,
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<MonthAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  useEffect(() => {
    fetchMonthAvailability();
  }, [currentYear, currentMonth]);

  const fetchMonthAvailability = async () => {
    setLoading(true);
    try {
      const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
      const res = await fetch(`/api/availability?month=${monthStr}`);
      const data = await res.json();
      setAvailability(data);
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener días del mes
  const getDaysInMonth = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Ajustar para que la semana empiece en lunes
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: (number | null)[] = [];

    // Días vacíos al inicio
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getDateString = (day: number) => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const isAvailable = (day: number) => {
    const dateStr = getDateString(day);
    const dayData = availability.find((a) => a.date === dateStr);
    return dayData?.hasAvailability || false;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(currentYear, currentMonth, day);
    return date < today;
  };

  const canGoPrev = () => {
    const today = new Date();
    return !(currentYear === today.getFullYear() && currentMonth === today.getMonth());
  };

  const goToPrevMonth = () => {
    if (canGoPrev()) {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    }
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const days = getDaysInMonth();

  return (
    <div className={styles.calendar}>
      {/* Header */}
      <div className={styles.header}>
        <button
          onClick={goToPrevMonth}
          disabled={!canGoPrev()}
          className={styles.navButton}
          aria-label="Mes anterior"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M12 15L7 10L12 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <h3 className={styles.monthTitle}>
          {MONTHS[currentMonth]} {currentYear}
        </h3>

        <button
          onClick={goToNextMonth}
          className={styles.navButton}
          aria-label="Mes siguiente"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M8 5L13 10L8 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Días de la semana */}
      <div className={styles.weekdays}>
        {WEEKDAYS.map((day) => (
          <div key={day} className={styles.weekday}>
            {day}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className={styles.days}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : (
          days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className={styles.emptyDay} />;
            }

            const dateStr = getDateString(day);
            const available = isAvailable(day);
            const past = isPast(day);
            const today = isToday(day);
            const selected = selectedDate === dateStr;

            return (
              <button
                key={day}
                onClick={() => available && !past && onDateSelect(dateStr)}
                disabled={past || !available}
                className={`
                  ${styles.day}
                  ${past ? styles.past : ""}
                  ${today ? styles.today : ""}
                  ${selected ? styles.selected : ""}
                  ${available && !past ? styles.available : ""}
                  ${!available && !past ? styles.unavailable : ""}
                `}
                aria-label={`${day} de ${MONTHS[currentMonth]}`}
                aria-selected={selected}
              >
                {day}
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
