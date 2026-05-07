// ============================================
// POST /api/bookings/[id]/reschedule
// Reprogramar una cita (máximo 1 vez, con 24h de anticipación)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { differenceInHours } from "date-fns";
import { isSlotAvailable } from "@/lib/scheduling/availability";
import { assignInspector } from "@/lib/scheduling/inspector-assignment";
import {
  INSPECTION_DURATION_MINUTES,
  MIN_HOURS_BEFORE_CANCEL,
} from "@/lib/scheduling/constants";
import { crearFechaSinConversion, crearFechaHoraLima, sumarMinutos } from "@/app/domain/datetime";

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

  const body = await req.json();
  const { newDate, newTimeSlot } = body;

  if (!newDate || !newTimeSlot) {
    return NextResponse.json(
      { error: "Se requiere newDate y newTimeSlot" },
      { status: 400 }
    );
  }

  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    // Verificar que existe y pertenece al usuario
    if (!booking || booking.clientId !== session.user.id) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que esté pagada
    if (booking.status !== "PAID") {
      return NextResponse.json(
        { error: "Solo se pueden reprogramar citas pagadas" },
        { status: 400 }
      );
    }

    // Verificar que no haya sido reprogramada antes
    if (booking.isRescheduled) {
      return NextResponse.json(
        {
          error:
            "Esta cita ya fue reprogramada anteriormente. No se permiten más cambios.",
        },
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
          error: `Debe reprogramar con al menos ${MIN_HOURS_BEFORE_CANCEL} horas de anticipación`,
        },
        { status: 400 }
      );
    }

    // Verificar disponibilidad del nuevo slot
    const slotCheck = await isSlotAvailable(newDate, newTimeSlot);

    if (!slotCheck.available) {
      return NextResponse.json(
        { error: slotCheck.reason || "El nuevo horario no está disponible" },
        { status: 409 }
      );
    }

    // Calcular nuevos tiempos (hora de Lima convertida a UTC)
    const newStartTime = crearFechaHoraLima(newDate, newTimeSlot);
    const newEndTime = sumarMinutos(newStartTime, INSPECTION_DURATION_MINUTES);

    // Actualizar booking
    await db.booking.update({
      where: { id: bookingId },
      data: {
        date: crearFechaSinConversion(newDate), // Usar 12:00 UTC para evitar cambio de día
        timeSlot: newTimeSlot,
        startTime: newStartTime,
        endTime: newEndTime,
        isRescheduled: true,
        rescheduledFrom: bookingId,
        inspectorId: null, // Se reasignará
        status: "PAID", // Vuelve a PAID para reasignar inspector
      },
    });

    // Reasignar inspector
    const assignment = await assignInspector(bookingId);

    if (!assignment.success) {
      console.error("Error reasignando inspector:", assignment.error);
      // El admin deberá asignar manualmente
    }

    // TODO: Enviar notificación de reprogramación

    return NextResponse.json({
      success: true,
      message: "Cita reprogramada exitosamente",
      newDate,
      newTimeSlot,
      inspector: assignment.inspectorName,
    });
  } catch (error) {
    console.error("Error reprogramando:", error);
    return NextResponse.json(
      { error: "Error al reprogramar la cita" },
      { status: 500 }
    );
  }
}
