import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const bookingId = parseInt(id, 10);
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const { modelId, year, plate } = await request.json();

    if (!modelId || !year) {
      return NextResponse.json(
        { error: "Modelo y año son requeridos" },
        { status: 400 }
      );
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: { clientId: true, status: true, vehicleId: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    if (booking.clientId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const allowedStatuses = ["PENDING_PAYMENT", "PENDING_VERIFICATION", "PAID"];
    if (!allowedStatuses.includes(booking.status)) {
      return NextResponse.json(
        { error: "No se puede cambiar el vehículo en este estado" },
        { status: 400 }
      );
    }

    const cleanPlate = plate?.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "") || null;

    const result = await db.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.create({
        data: {
          model: { connect: { id: modelId } },
          year,
          plate: cleanPlate,
          user: { connect: { id: session.user.id } },
        },
        include: { model: { include: { brand: true } } },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { vehicleId: vehicle.id },
      });

      // Update VehicleInspection if exists
      const vi = await tx.vehicleInspection.findFirst({
        where: { vehicleId: booking.vehicleId, clientId: session.user.id },
        orderBy: { createdAt: "desc" },
      });

      if (vi) {
        await tx.vehicleInspection.update({
          where: { id: vi.id },
          data: {
            vehicleId: vehicle.id,
            plate: cleanPlate,
          },
        });
      }

      return vehicle;
    });

    return NextResponse.json({
      vehicle: {
        brand: result.model.brand.name,
        model: result.model.name,
        year: result.year,
        plate: result.plate,
      },
    });
  } catch (error) {
    console.error("[PUT /bookings/[id]/change-vehicle]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
