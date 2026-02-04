// ============================================
// TIPOS DEL SISTEMA DE BOOKING
// ============================================

import { Prisma } from "@prisma/client";

// Estados de booking
export type BookingStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "EXPIRED";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

// Tipos para la API de disponibilidad
export interface TimeSlotAvailability {
  time: string;
  available: boolean;
  remainingCapacity: number;
}

export interface DayAvailability {
  date: string;
  isWorkingDay: boolean;
  reason?: string;
  slots: TimeSlotAvailability[];
}

export interface MonthDayAvailability {
  date: string;
  hasAvailability: boolean;
}

// Tipos para crear booking
export interface CreateBookingInput {
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm
  inspectionPlanId: number;
  vehicleId: number;
}

export interface CreateBookingResponse {
  success: boolean;
  bookingId?: number;
  expiresAt?: Date;
  amount?: number;
  amountInCents?: number;
  inspectionPlanType?: string;
  inspectionPlanTitle?: string;
  error?: string;
}

// Tipos para pago
export interface ProcessPaymentInput {
  bookingId: number;
  token: string; // Token de Culqi
}

export interface ProcessPaymentResponse {
  success: boolean;
  message?: string;
  booking?: {
    id: number;
    status: BookingStatus;
    date: Date;
    timeSlot: string;
    inspector: {
      name: string;
      phone: string | null;
    } | null;
    inspectionPlan: {
      title: string;
      type: string;
    };
    vehicle: {
      brand: string;
      model: string;
      year: number;
      plate: string;
    };
  };
  payment?: {
    chargeId: string;
    amount: number;
  };
  error?: string;
  code?: string;
}

// Tipos para reprogramar
export interface RescheduleInput {
  newDate: string;
  newTimeSlot: string;
}

// Booking con relaciones (para respuestas de API)
export interface BookingWithDetails {
  id: number;
  date: Date;
  timeSlot: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  isRescheduled: boolean;
  createdAt: Date;
  confirmedAt: Date | null;
  client: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  };
  inspector: {
    id: number;
    name: string;
    phone: string | null;
  } | null;
  inspectionPlan: {
    id: number;
    title: string;
    type: string;
    price: number;
  };
  vehicle: {
    id: number;
    year: number;
    plate: string;
    mileage: number | null;
    model: {
      id: number;
      name: string;
      brand: {
        id: number;
        name: string;
        logo: string;
      };
    };
  };
  payment: {
    id: number;
    status: PaymentStatus;
    amount: number;
    paidAt: Date | null;
  } | null;
}

// Agenda del inspector
export interface InspectorScheduleEntry {
  id: number;
  timeSlot: string;
  status: BookingStatus;
  client: {
    name: string;
    phone: string | null;
    email: string;
  };
  inspection: {
    title: string;
    type: string;
  };
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plate: string;
    mileage: number | null;
  };
  clientNotes: string | null;
}

export interface InspectorScheduleResponse {
  inspector: string;
  range: {
    from: string;
    to: string;
  };
  totalBookings: number;
  schedule: Record<string, InspectorScheduleEntry[]>;
}
