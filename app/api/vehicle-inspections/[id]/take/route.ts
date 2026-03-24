/**
 * POST /api/vehicle-inspections/[id]/take
 *
 * Un admin "toma" el caso legal de una inspección.
 *
 * CONTROL DE CONCURRENCIA:
 * Se usa `updateMany` con una condición compuesta en el WHERE:
 *   - legalStatus = PENDIENTE
 *   - assignedAdminId = null
 *
 * PostgreSQL ejecuta esto como una sola operación atómica.
 * Si otro admin llega primero, el count devuelto será 0
 * y retornamos 409 Conflict sin leer el registro de nuevo.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const inspectionId = parseInt(id, 10);

    if (isNaN(inspectionId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // ─── OPERACIÓN ATÓMICA ────────────────────────────────────────────────
    // La condición `legalStatus: PENDIENTE` y `assignedAdminId: null`
    // actúan como un "lock optimista": si otro admin ya tomó el caso,
    // el WHERE no matchea y count = 0.
    // ─────────────────────────────────────────────────────────────────────
    const result = await db.vehicleInspection.updateMany({
      where: {
        id: inspectionId,
        legalStatus: "PENDIENTE",
        assignedAdminId: null, // Solo toma si nadie lo tiene
      },
      data: {
        assignedAdminId: session.user.id,
        legalStatus: "EN_PROCESO",
        legalStartedAt: new Date(),
      },
    });

    if (result.count === 0) {
      // El caso no existe, no está en PENDIENTE, o ya fue tomado
      const inspection = await db.vehicleInspection.findUnique({
        where: { id: inspectionId },
        select: { legalStatus: true, assignedAdminId: true },
      });

      if (!inspection) {
        return NextResponse.json(
          { error: "Inspección no encontrada" },
          { status: 404 }
        );
      }

      if (inspection.legalStatus === "BLOQUEADO") {
        return NextResponse.json(
          { error: "La inspección no tiene placa registrada. No se puede iniciar la revisión legal." },
          { status: 422 }
        );
      }

      // Otro admin llegó primero
      return NextResponse.json(
        { error: "Este caso ya fue tomado por otro administrador." },
        { status: 409 }
      );
    }

    const updated = await db.vehicleInspection.findUnique({
      where: { id: inspectionId },
      include: {
        vehicle: { include: { model: { include: { brand: true } } } },
        assignedAdmin: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[POST /vehicle-inspections/[id]/take]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
