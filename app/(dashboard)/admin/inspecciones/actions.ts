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

// ============================================
// Acciones para buscar clientes
// ============================================

export async function searchClientsAction(query: string) {
  try {
    const { db } = await import('@/lib/db');

    if (!query || query.trim().length < 2) {
      return { success: true, clients: [] };
    }

    const clients = await db.user.findMany({
      where: {
        role: 'CLIENT',
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      take: 10,
      orderBy: { name: 'asc' },
    });

    return { success: true, clients };
  } catch (error) {
    console.error('Error buscando clientes:', error);
    return { success: false, error: 'Error al buscar clientes', clients: [] };
  }
}

// ============================================
// Acciones para disponibilidad de horarios
// ============================================

export async function getAvailabilityForDateAction(date: string) {
  try {
    const { getAvailabilityForDate } = await import('@/lib/scheduling/availability');
    const availability = await getAvailabilityForDate(date);
    return { success: true, availability };
  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error);
    return { success: false, error: 'Error al obtener disponibilidad' };
  }
}

export async function getAvailableInspectorsForSlotAction(date: string, timeSlot: string) {
  try {
    const { db } = await import('@/lib/db');
    const { startOfDay } = await import('date-fns');
    const { parse } = await import('date-fns');
    const { BLOCKING_STATUSES } = await import('@/lib/scheduling/constants');

    const dateObj = parse(date, 'yyyy-MM-dd', new Date());

    // Obtener todos los inspectores activos
    const allInspectors = await db.user.findMany({
      where: {
        role: 'INSPECTOR',
        isInspectorAvailable: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    // Obtener reservas para este slot específico
    const bookingsInSlot = await db.booking.findMany({
      where: {
        date: startOfDay(dateObj),
        timeSlot,
        status: {
          in: [...BLOCKING_STATUSES],
        },
      },
      select: {
        inspectorId: true,
      },
    });

    // IDs de inspectores ocupados en este slot
    const busyInspectorIds = new Set(
      bookingsInSlot
        .map((b) => b.inspectorId)
        .filter((id): id is string => id !== null)
    );

    // Marcar disponibilidad de cada inspector
    const inspectors = allInspectors.map((inspector) => ({
      ...inspector,
      available: !busyInspectorIds.has(inspector.id),
    }));

    return { success: true, inspectors };
  } catch (error) {
    console.error('Error obteniendo inspectores disponibles:', error);
    return { success: false, error: 'Error al obtener inspectores', inspectors: [] };
  }
}
