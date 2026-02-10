// ============================================
// ALGORITMO DE DISPONIBILIDAD
// ============================================

import { db } from "@/lib/db";
import {
  startOfDay,
  endOfDay,
  addMinutes,
  isSunday,
  isSaturday,
  format,
  parse,
  isAfter,
  addHours,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import {
  TIMEZONE,
  WEEKDAY_SLOTS,
  SATURDAY_SLOTS,
  FIXED_HOLIDAYS,
  BLOCKING_STATUSES,
  MIN_HOURS_BEFORE_BOOKING,
} from "./constants";

// ============================================
// TIPOS
// ============================================

export interface SlotAvailability {
  time: string;
  available: boolean;
  remainingCapacity: number; // 0, 1, o 2
}

export interface DateAvailability {
  date: string; // YYYY-MM-DD
  isWorkingDay: boolean;
  reason?: string;
  slots: SlotAvailability[];
}

export interface MonthAvailability {
  date: string;
  hasAvailability: boolean;
}

interface WorkingDayCheck {
  isWorking: boolean;
  reason?: string;
}

// ============================================
// VERIFICAR SI ES DÍA LABORABLE
// ============================================

export async function isWorkingDay(date: Date): Promise<WorkingDayCheck> {
  // 1. Verificar domingo
  if (isSunday(date)) {
    return { isWorking: false, reason: "Domingo - No laborable" };
  }

  // 2. Verificar feriados fijos
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const holiday = FIXED_HOLIDAYS.find(
    (h) => h.month === month && h.day === day
  );

  if (holiday) {
    return { isWorking: false, reason: `Feriado - ${holiday.name}` };
  }

  // 3. Verificar fechas bloqueadas en BD
  const blockedDate = await db.blockedDate.findUnique({
    where: { date: startOfDay(date) },
  });

  if (blockedDate) {
    return {
      isWorking: false,
      reason: blockedDate.reason || "Fecha bloqueada",
    };
  }

  return { isWorking: true };
}

// ============================================
// OBTENER SLOTS DEL DÍA
// ============================================

export function getSlotsForDay(date: Date): readonly string[] {
  if (isSaturday(date)) {
    return SATURDAY_SLOTS;
  }
  return WEEKDAY_SLOTS;
}

// ============================================
// OBTENER NÚMERO DE INSPECTORES ACTIVOS
// ============================================

export async function getActiveInspectorsCount(): Promise<number> {
  return db.user.count({
    where: {
      role: "INSPECTOR",
      isInspectorAvailable: true,
    },
  });
}

// ============================================
// CALCULAR DISPONIBILIDAD POR FECHA
// ============================================

export async function getAvailabilityForDate(
  dateStr: string // formato "YYYY-MM-DD"
): Promise<DateAvailability> {
  const date = parse(dateStr, "yyyy-MM-dd", new Date());
  const nowInLima = toZonedTime(new Date(), TIMEZONE);

  // Verificar si es día laborable
  const { isWorking, reason } = await isWorkingDay(date);

  if (!isWorking) {
    return {
      date: dateStr,
      isWorkingDay: false,
      reason,
      slots: [],
    };
  }

  // Obtener slots base del día
  const baseSlots = getSlotsForDay(date);

  // Obtener reservas existentes para esa fecha (que bloquean slots)
  const existingBookings = await db.booking.findMany({
    where: {
      date: startOfDay(date),
      status: {
        in: [...BLOCKING_STATUSES],
      },
    },
    select: {
      timeSlot: true,
      inspectorId: true,
    },
  });

  // Contar reservas por slot
  const bookingsPerSlot = new Map<string, number>();

  existingBookings.forEach((booking) => {
    const count = bookingsPerSlot.get(booking.timeSlot) || 0;
    bookingsPerSlot.set(booking.timeSlot, count + 1);
  });

  // Obtener capacidad máxima (inspectores activos)
  const activeInspectors = await getActiveInspectorsCount();
  const maxCapacity = Math.max(activeInspectors, 1); // Mínimo 1 para evitar división por 0

  // Calcular disponibilidad de cada slot
  const slots: SlotAvailability[] = baseSlots.map((time) => {
    const bookedCount = bookingsPerSlot.get(time) || 0;
    const remainingCapacity = Math.max(0, maxCapacity - bookedCount);

    // Verificar si el slot ya pasó (para el día actual)
    const slotDateTime = parse(
      `${dateStr} ${time}`,
      "yyyy-MM-dd HH:mm",
      new Date()
    );

    // Debe haber al menos MIN_HOURS_BEFORE_BOOKING horas de anticipación
    const minBookingTime = addHours(nowInLima, MIN_HOURS_BEFORE_BOOKING);
    const isInPast = !isAfter(slotDateTime, minBookingTime);

    return {
      time,
      available: remainingCapacity > 0 && !isInPast,
      remainingCapacity: isInPast ? 0 : remainingCapacity,
    };
  });

  return {
    date: dateStr,
    isWorkingDay: true,
    slots,
  };
}

// ============================================
// OBTENER DISPONIBILIDAD MENSUAL (para calendario)
// ============================================

export async function getMonthAvailability(
  year: number,
  month: number // 1-12
): Promise<MonthAvailability[]> {
  const results: MonthAvailability[] = [];

  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));
  const nowInLima = toZonedTime(new Date(), TIMEZONE);
  const todayStart = startOfDay(nowInLima);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Pre-cargar fechas bloqueadas del mes
  const blockedDates = await db.blockedDate.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: { date: true },
  });

  const blockedSet = new Set(
    blockedDates.map((b) => format(b.date, "yyyy-MM-dd"))
  );

  // Pre-cargar bookings del mes
  const monthBookings = await db.booking.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: [...BLOCKING_STATUSES],
      },
    },
    select: {
      date: true,
      timeSlot: true,
    },
  });

  // Agrupar bookings por fecha
  const bookingsByDate = new Map<string, string[]>();
  monthBookings.forEach((b) => {
    const dateStr = format(b.date, "yyyy-MM-dd");
    const slots = bookingsByDate.get(dateStr) || [];
    slots.push(b.timeSlot);
    bookingsByDate.set(dateStr, slots);
  });

  // Obtener capacidad
  const activeInspectors = await getActiveInspectorsCount();
  const maxCapacity = Math.max(activeInspectors, 1);

  for (const day of days) {
    const dateStr = format(day, "yyyy-MM-dd");

    // Fechas pasadas
    if (day < todayStart) {
      results.push({ date: dateStr, hasAvailability: false });
      continue;
    }

    // Domingos
    if (isSunday(day)) {
      results.push({ date: dateStr, hasAvailability: false });
      continue;
    }

    // Feriados
    const dayMonth = day.getMonth() + 1;
    const dayDate = day.getDate();
    const isHoliday = FIXED_HOLIDAYS.some(
      (h) => h.month === dayMonth && h.day === dayDate
    );
    if (isHoliday) {
      results.push({ date: dateStr, hasAvailability: false });
      continue;
    }

    // Fechas bloqueadas
    if (blockedSet.has(dateStr)) {
      results.push({ date: dateStr, hasAvailability: false });
      continue;
    }

    // Verificar si hay slots disponibles
    const daySlots = getSlotsForDay(day);
    const dayBookings = bookingsByDate.get(dateStr) || [];

    // Contar bookings por slot
    const slotCounts = new Map<string, number>();
    dayBookings.forEach((slot) => {
      slotCounts.set(slot, (slotCounts.get(slot) || 0) + 1);
    });

    // Verificar si al menos un slot tiene capacidad
    const hasAvailableSlot = daySlots.some((slot) => {
      const count = slotCounts.get(slot) || 0;
      return count < maxCapacity;
    });

    results.push({ date: dateStr, hasAvailability: hasAvailableSlot });
  }

  return results;
}

// ============================================
// VERIFICAR SI UN SLOT ESPECÍFICO ESTÁ DISPONIBLE
// ============================================

export async function isSlotAvailable(
  dateStr: string,
  timeSlot: string
): Promise<{ available: boolean; reason?: string }> {
  const date = parse(dateStr, "yyyy-MM-dd", new Date());
  const nowInLima = toZonedTime(new Date(), TIMEZONE);

  // Verificar día laborable
  const { isWorking, reason } = await isWorkingDay(date);
  if (!isWorking) {
    return { available: false, reason };
  }

  // Verificar que el slot sea válido para ese día
  const validSlots = getSlotsForDay(date);
  if (!validSlots.includes(timeSlot)) {
    return { available: false, reason: "Horario no válido para este día" };
  }

  // Verificar que no haya pasado
  const slotDateTime = parse(
    `${dateStr} ${timeSlot}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  );
  const minBookingTime = addHours(nowInLima, MIN_HOURS_BEFORE_BOOKING);

  if (!isAfter(slotDateTime, minBookingTime)) {
    return {
      available: false,
      reason: `Debe reservar con al menos ${MIN_HOURS_BEFORE_BOOKING} horas de anticipación`,
    };
  }

  // Verificar capacidad
  //Numero de reservas ya hechas para ese horario especifico (ej: 09:00)
  const existingCount = await db.booking.count({
    where: {
      date: startOfDay(date),
      timeSlot,
      status: {
        in: [...BLOCKING_STATUSES],
      },
    },
  });
  //Numero de inspectores activos (capacidad maxima por slot)
  const activeInspectors = await getActiveInspectorsCount();
  /**
   * La lógica es:
  ┌──────────────────────────┬──────────────────┬─────────────────────┐
  │ existingCount (reservas) │ activeInspectors │    ¿Disponible?     │
  ├──────────────────────────┼──────────────────┼─────────────────────┤
  │ 0                        │ 2                │ Sí (quedan 2 cupos) │
  ├──────────────────────────┼──────────────────┼─────────────────────┤
  │ 1                        │ 2                │ Sí (queda 1 cupo)   │
  ├──────────────────────────┼──────────────────┼─────────────────────┤
  │ 2                        │ 2                │ No (lleno)          │
  └──────────────────────────┴──────────────────┴─────────────────────┘
   */


  if (existingCount >= activeInspectors) {
    return { available: false, reason: "Este horario ya no está disponible" };
  }

  return { available: true };
}
