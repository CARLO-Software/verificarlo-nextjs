// ============================================
// POST /api/bookings - Crear reserva pendiente
// GET /api/bookings - Obtener reservas del usuario
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { addMinutes, parse } from "date-fns";
import { isSlotAvailable } from "@/lib/scheduling/availability";
import { assignInspector } from "@/lib/scheduling/inspector-assignment";
import { createVehicleInspection } from "@/lib/vehicle-inspection/create-inspection";
import {
  INSPECTION_DURATION_MINUTES,
  BOOKING_EXPIRATION_MINUTES,
} from "@/lib/scheduling/constants";
import { crearFechaSinConversion } from "@/app/domain/datetime";

// ============================================
// POST - Crear reserva
// ============================================

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesión para reservar" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { date, timeSlot, inspectionPlanId, vehicleId } = body;

  // Validaciones básicas
  if (!date || !timeSlot || !inspectionPlanId || !vehicleId) {
    return NextResponse.json(
      { error: "Faltan campos requeridos: date, timeSlot, inspectionPlanId, vehicleId" },
      { status: 400 }
    );
  }

  try {
    // Verificar que el slot esté disponible
    const slotCheck = await isSlotAvailable(date, timeSlot);

    if (!slotCheck.available) {
      return NextResponse.json(
        { error: slotCheck.reason || "Horario no disponible" },
        { status: 409 }
      );
    }

    // Verificar que el plan de inspección existe
    const inspectionPlan = await db.inspectionPlan.findUnique({
      where: { id: inspectionPlanId },
    });

    if (!inspectionPlan) {
      return NextResponse.json(
        { error: "Plan de inspección no válido" },
        { status: 400 }
      );
    }

    // Verificar que el vehículo pertenece al usuario
    const vehicle = await db.vehicle.findFirst({
      where: {
        id: vehicleId,
        userId: session.user.id,
      },
      include: {
        model: {
          include: { brand: true },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehículo no encontrado" },
        { status: 400 }
      );
    }

    // Verificar reservas pendientes del usuario
    const existingPending = await db.booking.findFirst({
      where: {
        clientId: session.user.id,
        status: "PENDING_PAYMENT",
      },
      include: { payment: true },
    });

    if (existingPending) {
      // Si la reserva ya expiró, marcarla como EXPIRED automáticamente
      if (existingPending.expiresAt && new Date() > existingPending.expiresAt) {
        await db.$transaction(async (tx) => {
          await tx.booking.update({
            where: { id: existingPending.id },
            data: { status: "EXPIRED" },
          });
          if (existingPending.payment) {
            await tx.payment.update({
              where: { id: existingPending.payment.id },
              data: {
                status: "FAILED",
                errorMessage: "Tiempo de pago expirado",
              },
            });
          }
        });
        console.log(`[Bookings] Auto-expired stale booking #${existingPending.id}`);
      } else {
        // Aún no expiró, no permitir crear otra
        return NextResponse.json(
          {
            error: "Ya tienes una reserva pendiente de pago. Complétala o espera a que expire.",
            bookingId: existingPending.id,
            expiresAt: existingPending.expiresAt,
          },
          { status: 409 }
        );
      }
    }

    // Calcular tiempos
    const startTime = parse(`${date} ${timeSlot}`, "yyyy-MM-dd HH:mm", new Date());
    const endTime = addMinutes(startTime, INSPECTION_DURATION_MINUTES);
    const expiresAt = addMinutes(new Date(), BOOKING_EXPIRATION_MINUTES);

    // Crear reserva y pago en transacción
    // Booking se crea con PENDING_PAYMENT - se actualiza a PAID después del pago real
    const booking = await db.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          clientId: session.user.id,
          inspectionPlanId,
          vehicleId,
          date: crearFechaSinConversion(date), // Usar 12:00 UTC para evitar cambio de día
          timeSlot,
          startTime,
          endTime,
          status: "PENDING_PAYMENT",
          expiresAt, // 30 minutos para completar el pago
        },
      });

      await tx.payment.create({
        data: {
          bookingId: newBooking.id,
          amount: inspectionPlan.price * 100, // Convertir a céntimos para Culqi
          currency: "PEN",
          status: "PENDING",
          method: "CULQI", // Método por defecto, se actualiza si elige alternativo
        },
      });

      return newBooking;
    });

    // NOTA: Inspector y VehicleInspection se crean DESPUÉS del pago exitoso
    // Ver: app/api/payments/culqi/route.ts (líneas 232-256)

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      expiresAt,
      amount: inspectionPlan.price,
      amountInCents: inspectionPlan.price * 100,
      inspectionPlanType: inspectionPlan.type,
      inspectionPlanTitle: inspectionPlan.title,
    });
  } catch (error) {
    console.error("Error creando reserva:", error);
    return NextResponse.json(
      { error: "Error al crear la reserva" },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Obtener reservas del usuario
// ============================================

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesión" },
      { status: 401 }
    );
  }

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status"); // Filtrar por estado

  try {
    const bookings = await db.booking.findMany({
      where: {
        clientId: session.user.id,
        ...(status && { status: status as any }),
      },
      include: {
        inspectionPlan: {
          select: { title: true, type: true, price: true },
        },
        vehicle: {
          include: {
            model: {
              include: { brand: true },
            },
          },
        },
        inspector: {
          select: { name: true, phone: true },
        },
        payment: {
          select: { status: true, paidAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error obteniendo reservas:", error);
    return NextResponse.json(
      { error: "Error al obtener reservas" },
      { status: 500 }
    );
  }
}
