"use client";

import { useState, useEffect } from "react";
import styles from "./BookingCalendar.module.css";

// ============================================
// INTERFACES (TypeScript)
// ============================================
// Definimos la "forma" de los datos que esperamos.
// Esto ayuda a detectar errores en tiempo de desarrollo.

interface MonthAvailability {
  date: string;           // "2024-02-15"
  hasAvailability: boolean; // true si hay horarios disponibles ese día
}

// Props = propiedades que el componente PADRE pasa al HIJO
interface BookingCalendarProps {
  // Función callback: cuando el usuario selecciona una fecha,
  // llamamos esta función para notificar al padre
  onDateSelect: (date: string) => void;

  // La fecha actualmente seleccionada (controlada por el padre)
  selectedDate: string | null;
}

// Constantes fuera del componente = no se recrean en cada render
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
// Los props vienen del componente padre (ej: AgendarForm)
// Usamos destructuring { onDateSelect, selectedDate } para extraerlos

export default function BookingCalendar({
  onDateSelect,
  selectedDate,
}: BookingCalendarProps) {

  // ============================================
  // ESTADO (useState)
  // ============================================
  // useState retorna [valor, funcionParaCambiarValor]
  // Cuando el estado cambia, React RE-RENDERIZA el componente

  // Estado para el mes/año que estamos viendo en el calendario
  const [currentDate, setCurrentDate] = useState(new Date());

  // Estado para guardar la disponibilidad del mes (viene del servidor)
  const [availability, setAvailability] = useState<MonthAvailability[]>([]);

  // Estado para mostrar spinner mientras carga
  const [loading, setLoading] = useState(true);

  // ============================================
  // VALORES DERIVADOS
  // ============================================
  // No necesitan useState porque se calculan A PARTIR del estado existente
  // Se recalculan automáticamente cuando currentDate cambia

  const currentYear = currentDate.getFullYear();   // ej: 2024
  const currentMonth = currentDate.getMonth();     // 0-11 (0 = Enero)

  // ============================================
  // useEffect - EFECTOS SECUNDARIOS
  // ============================================
  // Se ejecuta DESPUÉS de que el componente se renderiza
  //
  // Sintaxis: useEffect(funcionAEjecutar, [dependencias])
  //
  // El array de dependencias controla CUÁNDO se ejecuta:
  // - [] vacío = solo al montar el componente (1 vez)
  // - [currentYear, currentMonth] = cada vez que estos valores cambien
  // - sin array = en CADA render (evitar!)

  useEffect(() => {
    // Cuando cambia el mes/año, traemos la disponibilidad del servidor
    fetchMonthAvailability();
  }, [currentYear, currentMonth]); // <-- Dependencias: se ejecuta cuando estos cambian

  // ============================================
  // FUNCIONES ASÍNCRONAS - FETCH DE DATOS
  // ============================================
  // async/await permite escribir código asíncrono de forma más legible

  const fetchMonthAvailability = async () => {
    setLoading(true); // Mostrar spinner

    try {
      // Formato: "2024-02" para consultar todo el mes
      const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

      // fetch() hace una petición HTTP al servidor
      // En Next.js, /api/... son Route Handlers (endpoints del backend)
      const res = await fetch(`/api/availability?month=${monthStr}`);

      // .json() parsea la respuesta como JSON
      const data = await res.json();

      // Guardamos los datos en el estado
      // Esto causa un RE-RENDER con los nuevos datos
      setAvailability(data);

    } catch (error) {
      // Si hay error de red, lo mostramos en consola
      console.error("Error fetching availability:", error);
    } finally {
      // finally se ejecuta siempre (éxito o error)
      setLoading(false); // Ocultar spinner
    }
  };

  // ============================================
  // FUNCIONES HELPER - CÁLCULO DE DÍAS
  // ============================================
  // Estas funciones se recrean en cada render.
  // Para optimizar, podrían usar useCallback, pero aquí no es necesario.

  const getDaysInMonth = () => {
    // Primer día del mes actual
    const firstDay = new Date(currentYear, currentMonth, 1);

    // Último día del mes (día 0 del mes siguiente = último del actual)
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate(); // ej: 31 para enero

    // getDay() retorna 0-6 (0 = Domingo)
    // Ajustamos para que Lunes = 0
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6; // Domingo -> 6

    // Array con días del mes + nulls para espacios vacíos
    const days: (number | null)[] = [];

    // Agregar espacios vacíos al inicio (días del mes anterior)
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Agregar los días del mes (1, 2, 3, ... 31)
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // Convierte día (número) a string formato ISO: "2024-02-15"
  const getDateString = (day: number) => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  // ============================================
  // FUNCIONES DE VALIDACIÓN
  // ============================================
  // Determinan el estado visual de cada día

  // ¿Hay disponibilidad para este día?
  const isAvailable = (day: number) => {
    const dateStr = getDateString(day);
    // .find() busca en el array de disponibilidad
    const dayData = availability.find((a) => a.date === dateStr);
    // Optional chaining (?.) evita error si dayData es undefined
    return dayData?.hasAvailability || false;
  };

  // ¿Es el día de hoy?
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  // ¿Es un día pasado? (no se puede reservar)
  const isPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Comparar solo fechas, no horas
    const date = new Date(currentYear, currentMonth, day);
    return date < today;
  };

  // ¿Se puede ir al mes anterior? (no si ya estamos en el mes actual)
  const canGoPrev = () => {
    const today = new Date();
    return !(currentYear === today.getFullYear() && currentMonth === today.getMonth());
  };

  // ============================================
  // HANDLERS - FUNCIONES QUE MANEJAN EVENTOS
  // ============================================

  const goToPrevMonth = () => {
    if (canGoPrev()) {
      // setCurrentDate actualiza el estado
      // Esto dispara el useEffect que trae la disponibilidad del nuevo mes
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    }
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // ============================================
  // PREPARACIÓN PARA RENDER
  // ============================================
  // Calculamos los días una vez antes del render
  const days = getDaysInMonth();

  // ============================================
  // JSX - LO QUE SE RENDERIZA
  // ============================================
  // JSX es una sintaxis que parece HTML pero es JavaScript.
  // Se convierte a React.createElement() bajo el capó.

  return (
    <div className={styles.calendar}>
      {/* ============================================
          HEADER CON NAVEGACIÓN
          ============================================ */}
      <div className={styles.header}>
        {/* Botón mes anterior
            - type="button" evita que actúe como submit en formularios
            - disabled={!canGoPrev()} lo deshabilita si no puede ir atrás
            - aria-label mejora accesibilidad para lectores de pantalla */}
        <button
          type="button"
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
          {/* Accedemos al array MONTHS usando currentMonth como índice */}
          {MONTHS[currentMonth]} {currentYear}
        </h3>

        <button
          type="button"
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

      {/* ============================================
          DÍAS DE LA SEMANA (Lun, Mar, ...)
          ============================================ */}
      <div className={styles.weekdays}>
        {/* .map() transforma cada elemento del array en JSX
            key={day} es OBLIGATORIO para que React identifique cada elemento */}
        {WEEKDAYS.map((day) => (
          <div key={day} className={styles.weekday}>
            {day}
          </div>
        ))}
      </div>

      {/* ============================================
          GRID DE DÍAS DEL MES
          ============================================ */}
      <div className={styles.days}>
        {/* RENDERIZADO CONDICIONAL con operador ternario (? :)
            Si loading es true, mostramos spinner
            Si loading es false, mostramos los días */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : (
          // .map() con índice para crear key única para días vacíos
          days.map((day, index) => {
            // Si day es null, es un espacio vacío (día del mes anterior)
            if (day === null) {
              return <div key={`empty-${index}`} className={styles.emptyDay} />;
            }

            // Calculamos propiedades del día para determinar su estado visual
            const dateStr = getDateString(day);
            const available = isAvailable(day);
            const past = isPast(day);
            const today = isToday(day);
            const selected = selectedDate === dateStr;

            return (
              <button
                type="button"
                key={day}
                // onClick llama a onDateSelect (función del padre)
                // Solo si está disponible y no es pasado
                onClick={() => {
                  if (available && !past) {
                    onDateSelect(dateStr); // Notificamos al padre
                  }
                }}
                disabled={past || !available}
                // Template literals para combinar múltiples clases CSS
                // Las clases se aplican condicionalmente
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

      {/* ============================================
          LEYENDA
          ============================================ */}
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
