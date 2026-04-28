// ============================================
// POST /api/payments/alternative
// Registrar pago con método alternativo (Yape/Transfer/WhatsApp)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AlternativePaymentRequestSchema, parseWithDetails } from "@/lib/validations/culqi";

// Tiempo de expiración extendido para pagos alternativos (4 horas)
const ALTERNATIVE_PAYMENT_EXPIRATION_HOURS = 4;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesión" },
      { status: 401 }
    );
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON inválido" },
      { status: 400 }
    );
  }

  const validation = parseWithDetails(AlternativePaymentRequestSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: validation.errors },
      { status: 400 }
    );
  }

  const { bookingId, paymentMethod, operationNumber } = validation.data;

  try {
    // Obtener la reserva con su pago
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        inspectionPlan: true,
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
        vehicle: {
          include: {
            model: {
              include: { brand: true },
            },
          },
        },
      },
    });

    // Validaciones de la reserva
    if (!booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    if (booking.clientId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes acceso a esta reserva" },
        { status: 403 }
      );
    }

    if (booking.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "Esta reserva ya no está pendiente de pago" },
        { status: 400 }
      );
    }

    if (!booking.payment) {
      return NextResponse.json(
        { error: "No se encontró información de pago" },
        { status: 400 }
      );
    }

    // Verificar que no haya expirado
    if (booking.expiresAt && new Date() > booking.expiresAt) {
      await db.booking.update({
        where: { id: bookingId },
        data: { status: "EXPIRED" },
      });

      return NextResponse.json(
        { error: "El tiempo para registrar el pago ha expirado" },
        { status: 410 }
      );
    }

    // Calcular nueva fecha de expiración (extendida)
    const newExpiresAt = new Date();
    newExpiresAt.setHours(newExpiresAt.getHours() + ALTERNATIVE_PAYMENT_EXPIRATION_HOURS);

    // Actualizar en transacción
    await db.$transaction(async (tx) => {
      // Actualizar Payment
      await tx.payment.update({
        where: { id: booking.payment!.id },
        data: {
          method: paymentMethod,
          status: "PENDING_VERIFICATION",
          operationNumber: operationNumber || null,
        },
      });

      // Actualizar Booking
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "PENDING_VERIFICATION",
          expiresAt: newExpiresAt,
        },
      });
    });

    // Preparar mensaje según método
    let message = "";
    switch (paymentMethod) {
      case "YAPE_PLIN":
        message = "Tu pago está siendo verificado. Te notificaremos cuando sea confirmado (máximo 4 horas).";
        break;
      case "TRANSFER":
        message = "Tu transferencia está siendo verificada. Te notificaremos cuando sea confirmada (máximo 4 horas).";
        break;
      case "WHATSAPP":
        message = "Tu reserva está registrada. Coordina el pago por WhatsApp para confirmarla.";
        break;
    }

    return NextResponse.json({
      success: true,
      message,
      booking: {
        id: booking.id,
        code: `#v-${booking.id.toString().padStart(5, "0")}`,
        status: "PENDING_VERIFICATION",
        expiresAt: newExpiresAt,
        paymentMethod,
      },
    });
  } catch (error) {
    console.error("Error registrando pago alternativo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
