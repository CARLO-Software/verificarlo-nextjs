/**
 * POST /api/vehicle-inspections
 * Crea una nueva inspección de vehículo.
 *
 * Lógica de fork:
 *  - Con placa  → legalStatus = PENDIENTE  + notifica admins
 *  - Sin placa  → legalStatus = BLOQUEADO  (sin notificación legal)
 *  En ambos casos se asigna mecánico automáticamente.
 *
 * GET /api/vehicle-inspections
 * Lista inspecciones según el rol del usuario autenticado.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { selectAvailableMechanic } from "@/lib/vehicle-inspection/assign-mechanic";
import {
  notifyMechanicAssigned,
  notifyNewInspectionWithPlate,
} from "@/lib/vehicle-inspection/notifications";

// ============================================
// POST — Crear inspección
// ============================================

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { vehicleId, plate } = body as {
      vehicleId: number;
      plate?: string;
    };

    if (!vehicleId) {
      return NextResponse.json(
        { error: "vehicleId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el vehículo pertenece al cliente
    const vehicle = await db.vehicle.findFirst({
      where: { id: vehicleId, userId: session.user.id },
      include: { model: { include: { brand: true } } },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehículo no encontrado" },
        { status: 404 }
      );
    }

    // Asignar mecánico antes de crear el registro
    const mechanicResult = await selectAvailableMechanic();
    if (!mechanicResult.success) {
      return NextResponse.json(
        { error: mechanicResult.error },
        { status: 503 }
      );
    }

    const normalizedPlate = plate?.trim().toUpperCase() || null;
    const hasPlate = !!normalizedPlate;

    // Crear inspección — legalStatus depende de si hay placa
    const inspection = await db.vehicleInspection.create({
      data: {
        vehicleId,
        clientId: session.user.id,
        plate: normalizedPlate,
        legalStatus: hasPlate ? "PENDIENTE" : "BLOQUEADO",
        mechanicalStatus: "PENDIENTE",
        assignedMechanicId: mechanicResult.mechanicId,
        mechanicAssignedAt: new Date(),
      },
    });

    const vehicleDescription = `${vehicle.model.brand.name} ${vehicle.model.name} ${vehicle.year}`;

    // Notificaciones en paralelo (no bloqueantes para el response)
    const notifyTasks: Promise<unknown>[] = [
      notifyMechanicAssigned({
        inspectionId: inspection.id,
        mechanicId: mechanicResult.mechanicId,
        vehicleDescription,
        clientName: session.user.name ?? "Cliente",
      }),
    ];

    if (hasPlate) {
      notifyTasks.push(
        notifyNewInspectionWithPlate({
          inspectionId: inspection.id,
          plate: normalizedPlate!,
          vehicleDescription,
          clientName: session.user.name ?? "Cliente",
        })
      );
    }

    // Fire-and-forget: las notificaciones no deben bloquear la respuesta
    Promise.all(notifyTasks).catch((err) =>
      console.error("[POST /vehicle-inspections] Error en notificaciones:", err)
    );

    return NextResponse.json(inspection, { status: 201 });
  } catch (error) {
    console.error("[POST /vehicle-inspections]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ============================================
// GET — Listar inspecciones según rol
// ============================================

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const role = session.user.role;

    // Filtro por rol: cada usuario solo ve lo que le corresponde
    const where =
      role === "CLIENT"
        ? { clientId: session.user.id }
        : role === "INSPECTOR"
        ? { assignedMechanicId: session.user.id }
        : {}; // ADMIN ve todo

    const inspections = await db.vehicleInspection.findMany({
      where,
      include: {
        vehicle: { include: { model: { include: { brand: true } } } },
        client: { select: { id: true, name: true, email: true } },
        assignedAdmin: { select: { id: true, name: true } },
        assignedMechanic: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(inspections);
  } catch (error) {
    console.error("[GET /vehicle-inspections]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
