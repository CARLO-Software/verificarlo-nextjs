/**
 * PATCH /api/admin/vehicle-inspections/[id]/legal/notes
 *
 * Permite actualizar las notas de revision legal.
 * Solo el admin asignado puede editar las notas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const inspectionId = parseInt(id, 10);

    if (isNaN(inspectionId)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    const body = await req.json();
    const { legalNotes } = body;

    if (typeof legalNotes !== 'string') {
      return NextResponse.json({ error: 'Notas invalidas' }, { status: 400 });
    }

    // Verificar que existe y el admin esta asignado
    const inspection = await db.vehicleInspection.findUnique({
      where: { id: inspectionId },
    });

    if (!inspection) {
      return NextResponse.json({ error: 'Inspeccion no encontrada' }, { status: 404 });
    }

    if (inspection.legalStatus === 'COMPLETADO') {
      return NextResponse.json(
        { error: 'No se pueden editar notas de una revision completada' },
        { status: 400 }
      );
    }

    if (inspection.assignedAdminId && inspection.assignedAdminId !== session.user.id) {
      return NextResponse.json(
        { error: 'Este caso esta asignado a otro administrador' },
        { status: 403 }
      );
    }

    // Actualizar notas
    const updated = await db.vehicleInspection.update({
      where: { id: inspectionId },
      data: { legalNotes },
    });

    return NextResponse.json({
      success: true,
      inspectionId: updated.id,
    });
  } catch (error) {
    console.error('[PATCH /admin/vehicle-inspections/[id]/legal/notes]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
