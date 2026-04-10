// ============================================================================
// GET /api/bookings/[id]/status
// Endpoint ligero para polling de estado de pago desde el frontend.
// El frontend llama esto repetidamente hasta recibir un estado terminal.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Estados que indican que el proceso terminó (no hay que seguir haciendo polling)
const TERMINAL_BOOKING_STATUSES = new Set([
  "PAID",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "NO_SHOW",
]);

const TERMINAL_PAYMENT_STATUSES = new Set([
  "COMPLETED",
  "FAILED",
  "REFUNDED",
]);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const bookingId = parseInt(params.id, 10);
  if (isNaN(bookingId)) {
    return NextResponse.json({ error: "ID de reserva inválido" }, { status: 400 });
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      clientId: true,
      date: true,
      timeSlot: true,
      expiresAt: true,
      payment: {
        select: {
          status: true,
          amount: true,
          method: true,
          culqiChargeId: true,
          errorMessage: true,
          paidAt: true,
        },
      },
      inspector: {
        select: { name: true, phone: true },
      },
      inspectionPlan: {
        select: { title: true, type: true },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  // Access control: only the owner, admins, or inspectors can poll
  const role = session.user.role;
  if (
    booking.clientId !== session.user.id &&
    role !== "ADMIN" &&
    role !== "INSPECTOR"
  ) {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const bookingStatus = booking.status;
  const paymentStatus = booking.payment?.status ?? "PENDING";

  const isTerminal =
    TERMINAL_BOOKING_STATUSES.has(bookingStatus) ||
    TERMINAL_PAYMENT_STATUSES.has(paymentStatus);

  return NextResponse.json({
    bookingId: booking.id,

    // Booking lifecycle
    bookingStatus,
    isTerminal,

    // Payment details
    paymentStatus,
    amount: booking.payment ? booking.payment.amount / 100 : null,
    paymentMethod: booking.payment?.method ?? null,
    chargeId: booking.payment?.culqiChargeId ?? null,
    errorMessage: booking.payment?.errorMessage ?? null,
    paidAt: booking.payment?.paidAt ?? null,

    // Booking info
    date: booking.date,
    timeSlot: booking.timeSlot,
    expiresAt: booking.expiresAt,

    // Assigned inspector (available once PAID)
    inspector: booking.inspector ?? null,

    // Plan
    plan: booking.inspectionPlan,
  });
}
