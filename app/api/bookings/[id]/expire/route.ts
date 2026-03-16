// ============================================
// POST /api/bookings/[id]/expire
// Marcar una reserva como expirada
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const bookingId = parseInt(id);

  if (isNaN(bookingId)) {
    return NextResponse.json(
      { error: "ID de reserva inválido" },
      { status: 400 }
    );
  }

  try {
    // Obtener la reserva
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario sea el dueño (si está autenticado)
    if (session?.user?.id && booking.clientId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes acceso a esta reserva" },
        { status: 403 }
      );
    }

    // Solo expirar si está en PENDING_PAYMENT y ya pasó el tiempo
    if (booking.status !== "PENDING_PAYMENT") {
      return NextResponse.json({
        success: false,
        message: "La reserva ya no está pendiente de pago",
        status: booking.status,
      });
    }

    // Verificar que realmente haya expirado
    if (booking.expiresAt && new Date() < booking.expiresAt) {
      return NextResponse.json({
        success: false,
        message: "La reserva aún no ha expirado",
        expiresAt: booking.expiresAt,
      });
    }

    // Marcar como expirada
    await db.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "EXPIRED" },
      });

      // Si tiene pago pendiente, marcarlo como fallido
      if (booking.payment && booking.payment.status === "PENDING") {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: {
            status: "FAILED",
            errorMessage: "Tiempo de pago expirado",
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Reserva marcada como expirada",
    });
  } catch (error) {
    console.error("Error expirando reserva:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
