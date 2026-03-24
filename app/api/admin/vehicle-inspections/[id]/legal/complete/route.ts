/**
 * POST /api/admin/vehicle-inspections/[id]/legal/complete
 * Completar revisión legal (EN_PROCESO -> COMPLETADO)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifyInspectionCompleted } from '@/lib/vehicle-inspection/notifications';

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

    // Verificar que existe y está en proceso
    const inspection = await db.vehicleInspection.findUnique({
      where: { id: inspectionId },
      include: {
        vehicle: {
          include: {
            model: {
              include: { brand: true },
            },
          },
        },
      },
    });

    if (!inspection) {
      return NextResponse.json({ error: 'Inspección no encontrada' }, { status: 404 });
    }

    if (inspection.legalStatus !== 'EN_PROCESO') {
      return NextResponse.json(
        { error: 'Solo se puede completar cuando está en proceso' },
        { status: 422 }
      );
    }

    // Verificar que el admin asignado es quien completa
    if (inspection.assignedAdminId !== session.user.id) {
      return NextResponse.json(
        { error: 'Solo el admin asignado puede completar' },
        { status: 403 }
      );
    }

    // Completar
    const updated = await db.vehicleInspection.update({
      where: { id: inspectionId },
      data: {
        legalStatus: 'COMPLETADO',
        legalCompletedAt: new Date(),
      },
    });

    // Si ambos procesos están completados, notificar al cliente
    if (updated.mechanicalStatus === 'COMPLETADO') {
      const vehicleDescription = `${inspection.vehicle.model.brand.name} ${inspection.vehicle.model.name} ${inspection.vehicle.year}`;
      
      notifyInspectionCompleted({
        inspectionId,
        clientId: inspection.clientId,
        vehicleDescription,
      }).catch((err) =>
        console.error('[complete legal] Error notificando cliente:', err)
      );
    }

    return NextResponse.json({
      success: true,
      inspection: updated,
    });
  } catch (error) {
    console.error('[POST /api/admin/vehicle-inspections/[id]/legal/complete]', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
