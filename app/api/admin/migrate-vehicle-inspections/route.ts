/**
 * POST /api/admin/migrate-vehicle-inspections
 *
 * Migración: Crea VehicleInspection para bookings existentes que no tienen uno.
 * Solo para ADMIN. Ejecutar una vez después de implementar el flujo dual.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { selectAvailableMechanic } from "@/lib/vehicle-inspection/assign-mechanic";
import { notifyNewInspectionWithPlate } from "@/lib/vehicle-inspection/notifications";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Buscar bookings pagados sin VehicleInspection
    const bookingsWithoutInspection = await db.booking.findMany({
      where: {
        status: { in: ["PAID", "COMPLETED"] },
      },
      include: {
        vehicle: {
          include: {
            model: { include: { brand: true } },
            vehicleInspections: { take: 1 }, // Solo para verificar si existe
          },
        },
        client: { select: { id: true, name: true } },
      },
    });

    // Filtrar los que no tienen VehicleInspection
    const bookingsToMigrate = bookingsWithoutInspection.filter(
      (b) => b.vehicle.vehicleInspections.length === 0
    );

    if (bookingsToMigrate.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay bookings para migrar",
        migrated: 0,
      });
    }

    const results: { bookingId: number; inspectionId: number; hasPlate: boolean }[] = [];
    const errors: { bookingId: number; error: string }[] = [];

    for (const booking of bookingsToMigrate) {
      try {
        // Seleccionar mecánico
        const mechanicResult = await selectAvailableMechanic();

        if (!mechanicResult.success) {
          errors.push({ bookingId: booking.id, error: mechanicResult.error });
          continue;
        }

        const plate = booking.vehicle.plate?.trim().toUpperCase() || null;
        const hasPlate = !!plate;

        // Crear VehicleInspection
        const inspection = await db.vehicleInspection.create({
          data: {
            vehicleId: booking.vehicle.id,
            clientId: booking.clientId,
            plate,
            legalStatus: hasPlate ? "PENDIENTE" : "BLOQUEADO",
            mechanicalStatus: "PENDIENTE",
            assignedMechanicId: mechanicResult.mechanicId,
            mechanicAssignedAt: new Date(),
            adminNotes: `Migrado desde booking #${booking.id}`,
          },
        });

        // Si tiene placa, notificar admins
        if (hasPlate) {
          const vehicleDescription = `${booking.vehicle.model.brand.name} ${booking.vehicle.model.name} ${booking.vehicle.year}`;

          notifyNewInspectionWithPlate({
            inspectionId: inspection.id,
            plate: plate!,
            vehicleDescription,
            clientName: booking.client.name || "Cliente",
          }).catch((err) =>
            console.error(`[migrate] Error notificando booking ${booking.id}:`, err)
          );
        }

        results.push({
          bookingId: booking.id,
          inspectionId: inspection.id,
          hasPlate,
        });
      } catch (err) {
        console.error(`[migrate] Error procesando booking ${booking.id}:`, err);
        errors.push({
          bookingId: booking.id,
          error: err instanceof Error ? err.message : "Error desconocido",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migración completada`,
      migrated: results.length,
      errors: errors.length,
      details: { results, errors },
    });
  } catch (error) {
    console.error("[POST /admin/migrate-vehicle-inspections]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
