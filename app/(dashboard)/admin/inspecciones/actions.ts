'use server';

import { revalidatePath } from 'next/cache';
import {
  updateInspectionStatus,
  assignInspector,
  updateInspectionNotes,
  updateInspectionDateTime,
  createManualBooking,
  getBrands,
  getModelsByBrand,
  getInspectionPlans,
  ManualBookingInput,
} from '@/services/inspections/inspections.server';
import { assignInspector as autoAssignInspector } from '@/lib/scheduling/inspector-assignment';
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
    date?: string;
    timeSlot?: string;
  }
) {
  try {
    const results: {
      status?: boolean;
      inspector?: boolean;
      notes?: boolean;
      dateTime?: boolean;
      autoAssigned?: { inspectorId: string; inspectorName: string };
    } = {};

    // Actualizar estado si cambió
    if (changes.status) {
      await updateInspectionStatus(id, changes.status);
      results.status = true;
    }

    // Asignar inspector si cambió (manual)
    if (changes.inspectorId) {
      await assignInspector(id, changes.inspectorId);
      results.inspector = true;
    }
    // Si el estado cambió a PAID y NO se asignó inspector manualmente,
    // intentar asignación automática
    else if (changes.status === 'PAID') {
      const autoResult = await autoAssignInspector(id);
      if (autoResult.success && autoResult.inspectorId && autoResult.inspectorName) {
        results.autoAssigned = {
          inspectorId: autoResult.inspectorId,
          inspectorName: autoResult.inspectorName,
        };
      }
    }

    // Actualizar notas si cambió
    if (changes.adminNotes !== undefined) {
      await updateInspectionNotes(id, { adminNotes: changes.adminNotes });
      results.notes = true;
    }

    // Actualizar fecha y hora si cambió
    if (changes.date && changes.timeSlot) {
      await updateInspectionDateTime(id, changes.date, changes.timeSlot);
      results.dateTime = true;
    }

    revalidatePath('/admin/inspecciones');
    return { success: true, results };
  } catch (error) {
    console.error('Error guardando cambios:', error);
    return { success: false, error: 'Error al guardar los cambios' };
  }
}

// ============================================
// Acciones para crear inspección manual
// ============================================

export async function createManualInspectionAction(input: ManualBookingInput) {
  try {
    const booking = await createManualBooking(input);
    revalidatePath('/admin/inspecciones');
    return { success: true, booking };
  } catch (error) {
    console.error('Error creando inspección manual:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear la inspección'
    };
  }
}

export async function getBrandsAction() {
  try {
    const brands = await getBrands();
    return { success: true, brands };
  } catch (error) {
    console.error('Error obteniendo marcas:', error);
    return { success: false, error: 'Error al obtener marcas', brands: [] };
  }
}

export async function getModelsAction(brandId: number) {
  try {
    const models = await getModelsByBrand(brandId);
    return { success: true, models };
  } catch (error) {
    console.error('Error obteniendo modelos:', error);
    return { success: false, error: 'Error al obtener modelos', models: [] };
  }
}

export async function getInspectionPlansAction() {
  try {
    const plans = await getInspectionPlans();
    return { success: true, plans };
  } catch (error) {
    console.error('Error obteniendo planes:', error);
    return { success: false, error: 'Error al obtener planes', plans: [] };
  }
}
