'use server';

import { revalidatePath } from 'next/cache';
import {
  updateInspectionStatus,
  assignInspector,
  updateInspectionNotes
} from '@/services/inspections/inspections.server';
import { BookingStatus } from '@prisma/client';

export async function updateStatusAction(id: number, status: BookingStatus) {
  try {
    await updateInspectionStatus(id, status);
    revalidatePath('/admin/inspecciones');
    return { success: true };
  } catch (error) {
    console.error('Error actualizando estado:', error);
    return { success: false, error: 'Error al actualizar el estado' };
  }
}

export async function assignInspectorAction(bookingId: number, inspectorId: string) {
  try {
    await assignInspector(bookingId, inspectorId);
    revalidatePath('/admin/inspecciones');
    return { success: true };
  } catch (error) {
    console.error('Error asignando inspector:', error);
    return { success: false, error: 'Error al asignar inspector' };
  }
}

export async function updateNotesAction(id: number, adminNotes: string) {
  try {
    await updateInspectionNotes(id, { adminNotes });
    revalidatePath('/admin/inspecciones');
    return { success: true };
  } catch (error) {
    console.error('Error actualizando notas:', error);
    return { success: false, error: 'Error al guardar las notas' };
  }
}

// Acción combinada para guardar todos los cambios de una inspección
export async function saveInspectionChangesAction(
  id: number,
  changes: {
    status?: BookingStatus;
    inspectorId?: string;
    adminNotes?: string;
  }
) {
  try {
    const results: { status?: boolean; inspector?: boolean; notes?: boolean } = {};

    // Actualizar estado si cambió
    if (changes.status) {
      await updateInspectionStatus(id, changes.status);
      results.status = true;
    }

    // Asignar inspector si cambió
    if (changes.inspectorId) {
      await assignInspector(id, changes.inspectorId);
      results.inspector = true;
    }

    // Actualizar notas si cambió
    if (changes.adminNotes !== undefined) {
      await updateInspectionNotes(id, { adminNotes: changes.adminNotes });
      results.notes = true;
    }

    revalidatePath('/admin/inspecciones');
    return { success: true, results };
  } catch (error) {
    console.error('Error guardando cambios:', error);
    return { success: false, error: 'Error al guardar los cambios' };
  }
}
