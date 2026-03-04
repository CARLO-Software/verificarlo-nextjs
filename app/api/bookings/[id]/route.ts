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
