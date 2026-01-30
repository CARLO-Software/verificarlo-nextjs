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
    if (!booking || booking.clientId !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que esté en un estado cancelable
    if (!["CONFIRMED", "PAID"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Esta reserva no puede ser cancelada" },
        { status: 400 }
      );
    }

    // Verificar 24 horas de anticipación
    const hoursUntilAppointment = differenceInHours(
      booking.startTime,
      new Date()
    );

    if (hoursUntilAppointment < MIN_HOURS_BEFORE_CANCEL) {
      return NextResponse.json(
        {
          error: `Debe cancelar con al menos ${MIN_HOURS_BEFORE_CANCEL} horas de anticipación. No hay reembolso disponible.`,
        },
        { status: 400 }
      );
    }

    // Cancelar (sin reembolso según las reglas del negocio)
    await db.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    // TODO: Enviar notificación de cancelación

    return NextResponse.json({
      success: true,
      message:
        "Cita cancelada exitosamente. Recuerde que no hay reembolso según nuestras políticas.",
    });
  } catch (error) {
    console.error("Error cancelando:", error);
    return NextResponse.json(
      { error: "Error al cancelar la cita" },
      { status: 500 }
    );
  }
}
