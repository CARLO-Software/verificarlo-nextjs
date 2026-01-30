// ============================================
// CONSTANTES DEL SISTEMA DE AGENDAMIENTO
// ============================================

export const TIMEZONE = "America/Lima";
export const INSPECTION_DURATION_MINUTES = 45;
export const BOOKING_EXPIRATION_MINUTES = 30;
export const MIN_HOURS_BEFORE_BOOKING = 2; // Mínimo 2 horas antes para reservar
export const MIN_HOURS_BEFORE_CANCEL = 24; // Mínimo 24 horas antes para cancelar/reprogramar

// Slots de inspección predefinidos
export const WEEKDAY_SLOTS = [
  "09:00",
  "09:45",
  "10:30",
  "11:15",
  "12:00",
  "12:45",
  "13:30",
  "14:15",
  "15:00",
  "15:45",
] as const;

export const SATURDAY_SLOTS = [
  "09:00",
  "09:45",
  "10:30",
  "11:15",
  "12:00"
] as const;

// Feriados fijos de Perú
export const FIXED_HOLIDAYS: { month: number; day: number; name: string }[] = [
  { month: 1, day: 1, name: "Año Nuevo" },
  { month: 5, day: 1, name: "Día del Trabajo" },
  { month: 6, day: 29, name: "San Pedro y San Pablo" },
  { month: 7, day: 28, name: "Fiestas Patrias" },
  { month: 7, day: 29, name: "Fiestas Patrias" },
  { month: 8, day: 30, name: "Santa Rosa de Lima" },
  { month: 10, day: 8, name: "Combate de Angamos" },
  { month: 11, day: 1, name: "Día de Todos los Santos" },
  { month: 12, day: 8, name: "Inmaculada Concepción" },
  { month: 12, day: 25, name: "Navidad" },
];

// Estados que bloquean un slot
export const BLOCKING_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "CONFIRMED",
] as const;

//Timeslot brinda los horarios que están permitidos
//Crear un tipo a partir del valor de 2 arrays
export type TimeSlot = typeof WEEKDAY_SLOTS[number] | typeof SATURDAY_SLOTS[number];