// ============================================
// POST /api/bookings/[id]/cancel
// Cancelar una cita (con 24h de anticipación, sin reembolso)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { differenceInHours } from "date-fns";
import { MIN_HOURS_BEFORE_CANCEL } from "@/lib/scheduling/constants";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesión" },
      { status: 401 }
    );
  }

  const bookingId = parseInt(params.id);

  if (isNaN(bookingId)) {
    return NextResponse.json(
      { error: "ID de reserva inválido" },
      { status: 400 }
    );
  }

  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    });

    // Verificar que existe y pertenece al usuario
    if (!booking || booking.clientId !== session.user.id) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que esté en un estado cancelable
    const cancelableStatuses = [
      "PENDING_PAYMENT",
      "PENDING_VERIFICATION",
      "PAID",
    ];

    if (!cancelableStatuses.includes(booking.status)) {
      return NextResponse.json(
        { error: "Esta reserva no puede ser cancelada" },
        { status: 400 }
      );
    }

    // Solo aplicar regla de 24 horas para reservas ya pagadas
    const requiresTimeCheck = booking.status === "PAID";

    if (requiresTimeCheck) {
      const hoursUntilAppointment = differenceInHours(
        booking.startTime,
        new Date()
      );

      if (hoursUntilAppointment < MIN_HOURS_BEFORE_CANCEL) {
        return NextResponse.json(
          {
            error: `Debe cancelar con al menos ${MIN_HOURS_BEFORE_CANCEL} horas de anticipación. Contacte a soporte para asistencia.`,
          },
          { status: 400 }
        );
      }
    }

    // Cancelar la reserva
    await db.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    // Determinar mensaje según el estado previo
    const message = requiresTimeCheck
      ? "Cita cancelada exitosamente. El reembolso se procesará según nuestras políticas."
      : "Reserva cancelada exitosamente.";

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Error cancelando:", error);
    return NextResponse.json(
      { error: "Error al cancelar la cita" },
      { status: 500 }
    );
  }
}
