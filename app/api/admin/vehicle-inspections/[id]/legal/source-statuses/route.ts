/**
 * POST /api/admin/vehicle-inspections/[id]/legal/source-statuses
 * Guardar estados y observaciones de fuentes legales
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

    const body = await request.json();
    const { statuses, observations, soatExpiryDate, techReviewExpiryDate, techReviewNotes, lastTransferPrice } = body;

    // Verificar que existe
    const inspection = await db.vehicleInspection.findUnique({
      where: { id: inspectionId },
    });

    if (!inspection) {
      return NextResponse.json({ error: 'Inspección no encontrada' }, { status: 404 });
    }

    // Obtener el legalReportData actual
    const currentReportData = (inspection.legalReportData as any) || {};

    // Actualizar con los nuevos estados, observaciones y campos adicionales
    const updatedReportData = {
      ...currentReportData,
      sourceStatuses: statuses,
      sourceObservations: observations,
      // Campos adicionales del informe legal
      ...(soatExpiryDate !== undefined && { soatExpiryDate }),
      ...(techReviewExpiryDate !== undefined && { techReviewExpiryDate }),
      ...(techReviewNotes !== undefined && { techReviewNotes }),
      ...(lastTransferPrice !== undefined && { lastTransferPrice }),
    };

    // Guardar en la base de datos
    await db.vehicleInspection.update({
      where: { id: inspectionId },
      data: {
        legalReportData: updatedReportData,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Estados guardados correctamente',
    });
  } catch (error) {
    console.error('[POST /api/admin/vehicle-inspections/[id]/legal/source-statuses]', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
