/**
 * POST /api/vehicle-inspections/[id]/legal/complete
 *
 * El admin que tiene el caso lo marca como completado.
 * Solo puede completarlo el admin que lo tomó (assignedAdminId).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
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

    const body = await request.json().catch(() => ({}));
    const { notes } = body as { notes?: string };

    // Solo el admin asignado puede completar
    const result = await db.vehicleInspection.updateMany({
      where: {
        id: inspectionId,
        legalStatus: "EN_PROCESO",
        assignedAdminId: session.user.id,
      },
      data: {
        legalStatus: "COMPLETADO",
        legalCompletedAt: new Date(),
        ...(notes ? { legalNotes: notes } : {}),
      },
    });

    if (result.count === 0) {
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

      if (inspection.assignedAdminId !== session.user.id) {
        return NextResponse.json(
          { error: "No puedes completar un caso que no tomaste." },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: `La inspección no está EN_PROCESO (estado actual: ${inspection.legalStatus}).` },
        { status: 422 }
      );
    }

    const updated = await db.vehicleInspection.findUnique({
      where: { id: inspectionId },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[POST /vehicle-inspections/[id]/legal/complete]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
