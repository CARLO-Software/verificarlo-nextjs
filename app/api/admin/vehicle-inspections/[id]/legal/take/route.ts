/**
 * POST /api/admin/vehicle-inspections/[id]/legal/take
 * Admin toma el caso legal (PENDIENTE -> EN_PROCESO)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
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

    // Verificar que existe y está en estado PENDIENTE
    const inspection = await db.vehicleInspection.findUnique({
      where: { id: inspectionId },
    });

    if (!inspection) {
      return NextResponse.json({ error: 'Inspección no encontrada' }, { status: 404 });
    }

    if (inspection.legalStatus !== 'PENDIENTE') {
      return NextResponse.json(
        { error: `No se puede tomar: estado actual es ${inspection.legalStatus}` },
        { status: 422 }
      );
    }

    // Actualizar a EN_PROCESO y asignar admin
    const updated = await db.vehicleInspection.update({
      where: { id: inspectionId },
      data: {
        legalStatus: 'EN_PROCESO',
        assignedAdminId: session.user.id,
        legalStartedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      inspection: updated,
    });
  } catch (error) {
    console.error('[POST /api/admin/vehicle-inspections/[id]/legal/take]', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
