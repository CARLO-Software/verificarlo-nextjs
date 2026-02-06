// ============================================
// GET /api/inspector/schedule
// Obtener agenda del inspector
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, addDays, parse } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesión" },
      { status: 401 }
    );
  }

  // Verificar que sea inspector
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true },
  });

  if (user?.role !== "INSPECTOR") {
    return NextResponse.json(
      { error: "Acceso denegado. Solo para inspectores." },
      { status: 403 }
    );
  }

  const searchParams = req.nextUrl.searchParams;
  const dateParam = searchParams.get("date"); // YYYY-MM-DD (opcional)
  const days = parseInt(searchParams.get("days") || "7"); // Días a mostrar

  try {
    // Calcular rango de fechas
    let startDate: Date;
    let endDate: Date;

    if (dateParam) {
      // Si se proporciona una fecha específica, mostrar solo ese día
      const date = parse(dateParam, "yyyy-MM-dd", new Date());
      startDate = startOfDay(date);
      endDate = endOfDay(date);
    } else {
      // Por defecto: desde hoy hasta X días después
      startDate = startOfDay(new Date());
      endDate = endOfDay(addDays(new Date(), days));
    }

    const bookings = await db.booking.findMany({
      where: {
        inspectorId: session.user.id,
        status: { in: ["CONFIRMED", "COMPLETED"] },
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        client: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
        inspection: {
          select: {
            title: true,
            type: true,
            description: true,
          },
        },
        vehicle: {
          include: {
            model: {
              include: { brand: true },
            },
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    // Agrupar por fecha para mejor visualización
    const groupedByDate = bookings.reduce(
      (acc, booking) => {
        const dateKey = booking.date.toISOString().split("T")[0];
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push({
          id: booking.id,
          timeSlot: booking.timeSlot,
          status: booking.status,
          client: {
            name: booking.client.name,
            phone: booking.client.phone,
            email: booking.client.email,
          },
          inspection: {
            title: booking.inspection.title,
            type: booking.inspection.type,
          },
          vehicle: {
            brand: booking.vehicle.model.brand.name,
            model: booking.vehicle.model.name,
            year: booking.vehicle.year,
            plate: booking.vehicle.plate,
            mileage: booking.vehicle.mileage,
          },
          clientNotes: booking.clientNotes,
        });
        return acc;
      },
      {} as Record<string, any[]>
    );

    return NextResponse.json({
      inspector: user.name,
      range: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      totalBookings: bookings.length,
      schedule: groupedByDate,
    });
  } catch (error) {
    console.error("Error obteniendo agenda:", error);
    return NextResponse.json(
      { error: "Error al obtener la agenda" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/inspector/schedule
// Marcar inspección como completada
// ============================================

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesión" },
      { status: 401 }
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "INSPECTOR") {
    return NextResponse.json(
      { error: "Acceso denegado" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { bookingId, action, notes } = body;

  if (!bookingId || !action) {
    return NextResponse.json(
      { error: "Se requiere bookingId y action" },
      { status: 400 }
    );
  }

  try {
    const booking = await db.booking.findFirst({
      where: {
        id: bookingId,
        inspectorId: session.user.id,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Cita no encontrada o no asignada a usted" },
        { status: 404 }
      );
    }

    if (action === "complete") {
      if (booking.status !== "CONFIRMED") {
        return NextResponse.json(
          { error: "Solo se pueden completar citas confirmadas" },
          { status: 400 }
        );
      }

      await db.booking.update({
        where: { id: bookingId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          inspectorNotes: notes || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Inspección marcada como completada",
      });
    }

    if (action === "no_show") {
      if (booking.status !== "CONFIRMED") {
        return NextResponse.json(
          { error: "Solo se pueden marcar como no-show citas confirmadas" },
          { status: 400 }
        );
      }

      await db.booking.update({
        where: { id: bookingId },
        data: {
          status: "NO_SHOW",
          inspectorNotes: notes || "Cliente no se presentó",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Cita marcada como NO_SHOW",
      });
    }

    return NextResponse.json(
      { error: "Acción no válida. Use 'complete' o 'no_show'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error actualizando cita:", error);
    return NextResponse.json(
      { error: "Error al actualizar la cita" },
      { status: 500 }
    );
  }
}
