// ============================================
// GET /api/bookings/[id] - Obtener detalle de una reserva
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
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
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
        inspector: {
          select: { id: true, name: true, phone: true },
        },
        inspectionPlan: true,
        vehicle: {
          include: {
            model: {
              include: { brand: true },
            },
          },
        },
        payment: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario tenga acceso
    const userId = session.user.id;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isOwner = booking.clientId === userId;
    const isAssignedInspector = booking.inspectorId === userId;
    const isAdmin = user?.role === "ADMIN";

    if (!isOwner && !isAssignedInspector && !isAdmin) {
      return NextResponse.json(
        { error: "No tiene acceso a esta reserva" },
        { status: 403 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error obteniendo reserva:", error);
    return NextResponse.json(
      { error: "Error al obtener la reserva" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/bookings/[id] - Eliminar una reserva
// Solo permitido para estados: CANCELLED, NO_SHOW, EXPIRED, COMPLETED
// ============================================

export async function DELETE(
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
      include: {
        payment: true,
        report: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario sea el dueño
    if (booking.clientId !== session.user.id) {
      return NextResponse.json(
        { error: "No tiene permiso para eliminar esta reserva" },
        { status: 403 }
      );
    }

    // Solo permitir eliminar inspecciones en ciertos estados
    const deletableStatuses = ["CANCELLED", "NO_SHOW", "EXPIRED", "COMPLETED"];
    if (!deletableStatuses.includes(booking.status)) {
      return NextResponse.json(
        { error: "No se puede eliminar una inspección en proceso o pendiente de pago" },
        { status: 400 }
      );
    }

    // Eliminar en cascada (relaciones dependientes primero)
    await db.$transaction(async (tx) => {
      // Eliminar InspectionReport si existe
      if (booking.report) {
        await tx.inspectionReport.delete({
          where: { id: booking.report.id },
        });
      }

      // Eliminar Payment si existe
      if (booking.payment) {
        await tx.payment.delete({
          where: { id: booking.payment.id },
        });
      }

      // Eliminar el Booking
      await tx.booking.delete({
        where: { id: bookingId },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Inspección eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error eliminando reserva:", error);
    return NextResponse.json(
      { error: "Error al eliminar la reserva" },
      { status: 500 }
    );
  }
}
