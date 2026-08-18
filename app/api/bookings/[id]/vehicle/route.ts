import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-jwt";
import { db } from "@/lib/db";
import {
  notifyLegalUnlocked,
  notifyPlateRegisteredByMechanic,
} from "@/lib/vehicle-inspection/notifications";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await getAuthUser(request);

    if (!user || !["INSPECTOR", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const bookingId = parseInt(id, 10);

    if (isNaN(bookingId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    const rawPlate = body.plate?.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");

    if (!rawPlate || rawPlate.length < 6 || rawPlate.length > 7) {
      return NextResponse.json(
        { error: "Placa inválida (debe tener 6-7 caracteres)" },
        { status: 400 }
      );
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        vehicleId: true,
        clientId: true,
        vehicle: {
          select: { year: true, model: { select: { name: true, brand: { select: { name: true } } } } },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking no encontrado" }, { status: 404 });
    }

    // Verificar que la placa no esté en uso por otro vehículo
    const existing = await db.vehicle.findFirst({
      where: { plate: rawPlate, id: { not: booking.vehicleId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Esta placa ya está registrada en otro vehículo" },
        { status: 409 }
      );
    }

    // Actualizar Vehicle y VehicleInspection (si existe) en una transacción
    const updated = await db.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.update({
        where: { id: booking.vehicleId },
        data: { plate: rawPlate },
      });

      let legalUnlocked = false;
      let viId: number | null = null;

      // Actualizar VehicleInspection si existe (y desbloquear legal si estaba BLOQUEADO)
      const vi = await tx.vehicleInspection.findFirst({
        where: { vehicleId: booking.vehicleId, clientId: booking.clientId },
        orderBy: { createdAt: "desc" },
      });

      if (vi && !vi.plate) {
        legalUnlocked = vi.legalStatus === "BLOQUEADO";
        viId = vi.id;
        await tx.vehicleInspection.update({
          where: { id: vi.id },
          data: {
            plate: rawPlate,
            plateAddedAt: new Date(),
            ...(legalUnlocked
              ? { legalStatus: "PENDIENTE", legalUnlockedAt: new Date() }
              : {}),
          },
        });
      }

      return { plate: vehicle.plate, legalUnlocked, viId };
    });

    // Notificar a admins
    const vehicleDescription = `${booking.vehicle.model.brand.name} ${booking.vehicle.model.name} ${booking.vehicle.year}`;
    const registeredByName = user.name ?? "Mecánico";
    const notifyFn = updated.legalUnlocked ? notifyLegalUnlocked : notifyPlateRegisteredByMechanic;

    notifyFn({
      inspectionId: updated.viId ?? bookingId,
      plate: rawPlate,
      vehicleDescription,
      mechanicName: registeredByName,
    }).catch((err) =>
      console.error("[PATCH /bookings/[id]/vehicle] Error notificando:", err)
    );

    return NextResponse.json({ plate: updated.plate });
  } catch (error) {
    console.error("[PATCH /bookings/[id]/vehicle]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
