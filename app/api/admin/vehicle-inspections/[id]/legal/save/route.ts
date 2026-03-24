/**
 * PATCH /api/admin/vehicle-inspections/[id]/legal/save
 * Guardar progreso del informe legal
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const inspectionId = parseInt(id, 10);

    if (isNaN(inspectionId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { legalNotes, legalReportData } = body;

    // Verificar que existe y está en proceso
    const inspection = await db.vehicleInspection.findUnique({
      where: { id: inspectionId },
    });

    if (!inspection) {
      return NextResponse.json({ error: 'Inspección no encontrada' }, { status: 404 });
    }

    if (inspection.legalStatus !== 'EN_PROCESO') {
      return NextResponse.json(
        { error: 'Solo se puede guardar cuando está en proceso' },
        { status: 422 }
      );
    }

    // Verificar que el admin asignado es quien guarda
    if (inspection.assignedAdminId !== session.user.id) {
      return NextResponse.json(
        { error: 'Solo el admin asignado puede guardar cambios' },
        { status: 403 }
      );
    }

    // Guardar datos
    const updated = await db.vehicleInspection.update({
      where: { id: inspectionId },
      data: {
        legalNotes: legalNotes ?? undefined,
        legalReportData: legalReportData ?? undefined,
      },
    });

    return NextResponse.json({
      success: true,
      inspection: updated,
    });
  } catch (error) {
    console.error('[PATCH /api/admin/vehicle-inspections/[id]/legal/save]', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
