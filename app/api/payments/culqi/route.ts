// ============================================
// POST /api/payments/culqi
// Procesar pago con Culqi
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignInspector } from "@/lib/scheduling/inspector-assignment";

const CULQI_SECRET_KEY = process.env.CULQI_SECRET_KEY!;
const CULQI_API_URL = "https://api.culqi.com/v2/charges";

interface CulqiChargeRequest {
  amount: number;
  currency_code: string;
  email: string;
  source_id: string;
  description: string;
  metadata?: Record<string, string>;
}

interface CulqiChargeResponse {
  id: string;
  amount: number;
  currency_code: string;
  email: string;
  description: string;
  source: {
    card_number: string;
    card_brand: string;
  };
  outcome: {
    type: string;
    code: string;
    merchant_message: string;
    user_message: string;
  };
  // ... otros campos
}

interface CulqiErrorResponse {
  object: string;
  type: string;
  charge_id: string;
  code: string;
  decline_code: string;
  merchant_message: string;
  user_message: string;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesión" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { bookingId, token } = body;

  if (!bookingId || !token) {
    return NextResponse.json(
      { error: "Se requiere bookingId y token" },
      { status: 400 }
    );
  }

  try {
    // Obtener booking con todos los datos necesarios
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        inspection: true,
        client: {
          select: { id: true, email: true, name: true, phone: true },
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

    // Validaciones
    if (!booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    if (booking.clientId !== session.user.id) {
      return NextResponse.json(
        { error: "No tiene acceso a esta reserva" },
        { status: 403 }
      );
    }

    if (booking.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "Esta reserva ya fue procesada" },
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

      await db.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: "FAILED",
          errorMessage: "Tiempo de pago expirado",
        },
      });

      return NextResponse.json(
        {
          error:
            "El tiempo para pagar ha expirado. Por favor, cree una nueva reserva.",
        },
        { status: 410 }
      );
    }

    // Guardar token en el pago
    await db.payment.update({
      where: { id: booking.payment.id },
      data: { culqiToken: token },
    });

    // Preparar descripción del cargo
    const vehicleDescription = `${booking.vehicle.model.brand.name} ${booking.vehicle.model.name} ${booking.vehicle.year}`;
    const description = `Inspección ${booking.inspection.type} - ${vehicleDescription}`;

    // Crear cargo en Culqi
    const culqiRequest: CulqiChargeRequest = {
      amount: booking.payment.amount,
      currency_code: "PEN",
      email: booking.client.email,
      source_id: token,
      description,
      metadata: {
        bookingId: booking.id.toString(),
        inspectionType: booking.inspection.type,
        vehiclePlate: booking.vehicle.plate,
      },
    };

    const culqiResponse = await fetch(CULQI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CULQI_SECRET_KEY}`,
      },
      body: JSON.stringify(culqiRequest),
    });

    const culqiData = await culqiResponse.json();

    if (!culqiResponse.ok) {
      // Pago fallido
      const errorData = culqiData as CulqiErrorResponse;

      await db.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: "FAILED",
          errorCode: errorData.code || errorData.decline_code,
          errorMessage: errorData.user_message || errorData.merchant_message,
          metadata: culqiData,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: errorData.user_message || "Error procesando el pago",
          code: errorData.code,
        },
        { status: 400 }
      );
    }

    // Pago exitoso
    const chargeData = culqiData as CulqiChargeResponse;

    // Actualizar pago y booking en transacción
    await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: booking.payment!.id },
        data: {
          status: "COMPLETED",
          culqiChargeId: chargeData.id,
          paidAt: new Date(),
          metadata: chargeData,
        },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "PAID",
          expiresAt: null, // Ya no expira
        },
      });
    });

    // Asignar inspector automáticamente
    const assignment = await assignInspector(bookingId);

    if (!assignment.success) {
      // Caso raro: pago OK pero no hay inspector disponible
      // El admin deberá asignar manualmente
      console.error(
        `[ALERTA] Pago exitoso pero sin inspector asignado para booking #${bookingId}: ${assignment.error}`
      );
    }

    // Obtener booking actualizado
    const updatedBooking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        inspector: {
          select: { name: true, phone: true },
        },
        inspection: {
          select: { title: true, type: true },
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

    // TODO: Enviar notificaciones por email y WhatsApp
    // await sendBookingConfirmation(updatedBooking);

    return NextResponse.json({
      success: true,
      message: "Pago procesado exitosamente",
      booking: {
        id: updatedBooking!.id,
        status: updatedBooking!.status,
        date: updatedBooking!.date,
        timeSlot: updatedBooking!.timeSlot,
        inspector: updatedBooking!.inspector
          ? {
              name: updatedBooking!.inspector.name,
              phone: updatedBooking!.inspector.phone,
            }
          : null,
        inspection: {
          title: updatedBooking!.inspection.title,
          type: updatedBooking!.inspection.type,
        },
        vehicle: {
          brand: updatedBooking!.vehicle.model.brand.name,
          model: updatedBooking!.vehicle.model.name,
          year: updatedBooking!.vehicle.year,
          plate: updatedBooking!.vehicle.plate,
        },
      },
      payment: {
        chargeId: chargeData.id,
        amount: booking.payment.amount / 100, // Convertir de céntimos a soles
      },
    });
  } catch (error) {
    console.error("Error procesando pago:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
