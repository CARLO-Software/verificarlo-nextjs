/**
 * PATCH /api/vehicle-inspections/[id]/mechanic
 *
 * El mecánico asignado actualiza su proceso.
 * Acciones posibles via `action`:
 *
 *  "start"          → mechanicalStatus PENDIENTE → EN_PROCESO
 *  "complete"       → mechanicalStatus EN_PROCESO → COMPLETADO
 *  "register_plate" → guarda placa y desbloquea legalStatus si estaba BLOQUEADO
 *
 * Las acciones son independientes y pueden combinarse en una sola llamada.
 * Ejemplo: { action: "register_plate", plate: "ABC-123" }
 *          { action: "start" }
 *          { action: "complete", notes: "..." }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  notifyLegalUnlocked,
  notifyPlateRegisteredByMechanic,
} from "@/lib/vehicle-inspection/notifications";

interface RouteParams {
  params: Promise<{ id: string }>;
}

type MechanicAction = "start" | "complete" | "register_plate";

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "INSPECTOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const inspectionId = parseInt(id, 10);

    if (isNaN(inspectionId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    const { action, plate, notes } = body as {
      action: MechanicAction;
      plate?: string;
      notes?: string;
    };

    if (!action) {
      return NextResponse.json(
        { error: "El campo 'action' es requerido" },
        { status: 400 }
      );
    }

    // Verificar que la inspección existe y está asignada a este mecánico
    const inspection = await db.vehicleInspection.findFirst({
      where: {
        id: inspectionId,
        assignedMechanicId: session.user.id,
      },
      include: {
        vehicle: { include: { model: { include: { brand: true } } } },
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: "Inspección no encontrada o no asignada a ti" },
        { status: 404 }
      );
    }

    // ─── ACCIÓN: Registrar placa ──────────────────────────────────────────
    if (action === "register_plate") {
      const normalizedPlate = plate?.trim().toUpperCase();

      if (!normalizedPlate) {
        return NextResponse.json(
          { error: "La placa es requerida para esta acción" },
          { status: 400 }
        );
      }

      if (inspection.plate) {
        return NextResponse.json(
          { error: "Esta inspección ya tiene una placa registrada" },
          { status: 422 }
        );
      }

      const wasBlocked = inspection.legalStatus === "BLOQUEADO";

      // Actualizar VehicleInspection y Vehicle en transacción
      const updated = await db.$transaction(async (tx) => {
        // Actualizar VehicleInspection
        const updatedInspection = await tx.vehicleInspection.update({
          where: { id: inspectionId },
          data: {
            plate: normalizedPlate,
            plateAddedAt: new Date(),
            // Si estaba BLOQUEADO, desbloquear legal
            ...(wasBlocked
              ? {
                  legalStatus: "PENDIENTE",
                  legalUnlockedAt: new Date(),
                }
              : {}),
          },
        });

        // También actualizar la placa en el Vehicle (si no tenía)
        await tx.vehicle.updateMany({
          where: {
            id: inspection.vehicleId,
            plate: null, // Solo si no tenía placa
          },
          data: {
            plate: normalizedPlate,
          },
        });

        return updatedInspection;
      });

      // Notificar a admins siempre que se registre una placa
      const vehicleDescription = `${inspection.vehicle.model.brand.name} ${inspection.vehicle.model.name} ${inspection.vehicle.year}`;

      if (wasBlocked) {
        // Si estaba bloqueado, usar notificación de desbloqueo
        notifyLegalUnlocked({
          inspectionId,
          plate: normalizedPlate,
          vehicleDescription,
          mechanicName: session.user.name ?? "Mecánico",
        }).catch((err) =>
          console.error("[PATCH mechanic register_plate] Error notificando:", err)
        );
      } else {
        // Si no estaba bloqueado, notificar registro de placa
        notifyPlateRegisteredByMechanic({
          inspectionId,
          plate: normalizedPlate,
          vehicleDescription,
          mechanicName: session.user.name ?? "Mecánico",
        }).catch((err) =>
          console.error("[PATCH mechanic register_plate] Error notificando:", err)
        );
      }

      return NextResponse.json(updated);
    }

    // ─── ACCIÓN: Iniciar inspección mecánica ──────────────────────────────
    if (action === "start") {
      if (inspection.mechanicalStatus !== "PENDIENTE") {
        return NextResponse.json(
          {
            error: `No se puede iniciar: estado mecánico actual es ${inspection.mechanicalStatus}`,
          },
          { status: 422 }
        );
      }

      const updated = await db.vehicleInspection.update({
        where: { id: inspectionId },
        data: {
          mechanicalStatus: "EN_PROCESO",
          mechanicStartedAt: new Date(),
        },
      });

      return NextResponse.json(updated);
    }

    // ─── ACCIÓN: Completar inspección mecánica ────────────────────────────
    if (action === "complete") {
      if (inspection.mechanicalStatus !== "EN_PROCESO") {
        return NextResponse.json(
          {
            error: `No se puede completar: estado mecánico actual es ${inspection.mechanicalStatus}`,
          },
          { status: 422 }
        );
      }

      const updated = await db.vehicleInspection.update({
        where: { id: inspectionId },
        data: {
          mechanicalStatus: "COMPLETADO",
          mechanicCompletedAt: new Date(),
          ...(notes ? { mechanicNotes: notes } : {}),
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: `Acción desconocida: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    console.error("[PATCH /vehicle-inspections/[id]/mechanic]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
