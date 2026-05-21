// ============================================
// PATCH /api/admin/bookings/[id]/notes - Actualizar notas del admin
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface UpdateNotesBody {
  adminNotes: string;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const bookingId = parseInt(params.id);

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: "ID de inspeccion invalido" },
        { status: 400 }
      );
    }

    const body: UpdateNotesBody = await req.json();

    // Verificar que el booking existe
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Inspeccion no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar las notas
    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: {
        adminNotes: body.adminNotes || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notas actualizadas correctamente",
      adminNotes: updatedBooking.adminNotes,
    });
  } catch (error: any) {
    console.error("Error actualizando notas:", error);
    return NextResponse.json(
      { error: "Error al actualizar las notas" },
      { status: 500 }
    );
  }
}
