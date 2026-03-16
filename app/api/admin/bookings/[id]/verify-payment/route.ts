// ============================================
// POST /api/admin/bookings/[id]/verify-payment
// Verificar pago alternativo y asignar inspector automáticamente
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignInspector } from "@/lib/scheduling/inspector-assignment";

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

  // Verificar que sea admin
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Solo administradores pueden verificar pagos" },
      { status: 403 }
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
        client: { select: { name: true, email: true } },
        payment: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // Solo se puede verificar pagos pendientes de verificación
    if (booking.status !== "PENDING_VERIFICATION") {
      return NextResponse.json(
        { error: "Esta reserva no está pendiente de verificación de pago" },
        { status: 400 }
      );
    }

    // Cambiar estado a PAID
    await db.booking.update({
      where: { id: bookingId },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    // Si hay un registro de pago, actualizarlo también
    if (booking.payment) {
      await db.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: "PAID",
          verifiedAt: new Date(),
          verifiedBy: session.user.id,
        },
      });
    }

    // Asignar inspector automáticamente
    const assignmentResult = await assignInspector(bookingId);

    if (!assignmentResult.success) {
      // El pago se verificó pero no se pudo asignar inspector
      return NextResponse.json({
        success: true,
        paymentVerified: true,
        inspectorAssigned: false,
        message: `Pago verificado. ${assignmentResult.error}`,
        error: assignmentResult.error,
      });
    }

    return NextResponse.json({
      success: true,
      paymentVerified: true,
      inspectorAssigned: true,
      inspector: {
        id: assignmentResult.inspectorId,
        name: assignmentResult.inspectorName,
      },
      message: `Pago verificado e inspector ${assignmentResult.inspectorName} asignado correctamente.`,
    });
  } catch (error) {
    console.error("Error verificando pago:", error);
    return NextResponse.json(
      { error: "Error al verificar el pago" },
      { status: 500 }
    );
  }
}
