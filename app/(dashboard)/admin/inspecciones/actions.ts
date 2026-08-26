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
    address?: string;
    district?: string;
  }
) {
  try {
    const { db } = await import('@/lib/db');

    const results: {
      status?: boolean;
      inspector?: boolean;
      notes?: boolean;
      dateTime?: boolean;
      autoAssigned?: { inspectorId: string; inspectorName: string };
      vehicleInspectionCreated?: boolean;
    } = {};

    // Actualizar estado si cambió
    if (changes.status) {
      await updateInspectionStatus(id, changes.status);
      results.status = true;

      // Si cambia a PAID, verificar y crear VehicleInspection si no existe
      if (changes.status === 'PAID') {
        // Obtener el booking con sus datos completos
        const booking = await db.booking.findUnique({
          where: { id },
          include: {
            vehicle: {
              include: {
                model: { include: { brand: true } },
                vehicleInspections: {
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
            client: { select: { id: true, name: true } },
          },
        });

        // Solo crear VehicleInspection si no existe para este vehículo
        if (booking && booking.vehicle.vehicleInspections.length === 0) {
          const { createVehicleInspection } = await import('@/lib/vehicle-inspection/create-inspection');
          const vehicleDescription = `${booking.vehicle.model.brand.name} ${booking.vehicle.model.name} ${booking.vehicle.year}`;
          const dateStr = booking.date.toISOString().split('T')[0];

          await createVehicleInspection({
            bookingId: booking.id,
            vehicleId: booking.vehicleId,
            clientId: booking.clientId,
            plate: booking.vehicle.plate,
            vehicleDescription,
            clientName: booking.client.name,
            scheduledDate: dateStr,
            scheduledTime: booking.timeSlot,
          });
          results.vehicleInspectionCreated = true;
        }
      }
    }

    // Asignar inspector si cambió (manual)
    if (changes.inspectorId) {
      await assignInspector(id, changes.inspectorId);
      results.inspector = true;
    }
    // Si el estado cambió a PAID y NO se asignó inspector manualmente,
    // verificar si ya tiene inspector asignado antes de asignar automáticamente
    else if (changes.status === 'PAID') {
      // Verificar si la inspección ya tiene un inspector asignado
      const currentBooking = await db.booking.findUnique({
        where: { id },
        select: { inspectorId: true },
      });

      // Solo asignar automáticamente si NO tiene inspector
      if (!currentBooking?.inspectorId) {
        const autoResult = await autoAssignInspector(id);
        if (autoResult.success && autoResult.inspectorId && autoResult.inspectorName) {
          results.autoAssigned = {
            inspectorId: autoResult.inspectorId,
            inspectorName: autoResult.inspectorName,
          };
        }
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

    // Actualizar ubicación si cambió
    if (changes.address !== undefined || changes.district !== undefined) {
      await db.booking.update({
        where: { id },
        data: {
          ...(changes.address !== undefined && { address: changes.address || null }),
          ...(changes.district !== undefined && { district: changes.district || null }),
        },
      });
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

    const trimmed = query.trim();

    const clients = await db.user.findMany({
      where: {
        role: 'CLIENT',
        ...(trimmed.length >= 2 && {
          OR: [
            { name: { contains: trimmed, mode: 'insensitive' } },
            { email: { contains: trimmed, mode: 'insensitive' } },
            { phone: { contains: trimmed, mode: 'insensitive' } },
          ],
        }),
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

export async function deleteCancelledInspectionAction(bookingId: number) {
  try {
    const { db } = await import('@/lib/db');

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        status: true,
        inspectorId: true,
        vehicle: { select: { model: { select: { name: true, brand: { select: { name: true } } } }, year: true } },
        client: { select: { name: true } },
      },
    });

    if (!booking) {
      return { success: false, error: 'Inspección no encontrada' };
    }

    if (!['CANCELLED', 'EXPIRED', 'NO_SHOW'].includes(booking.status)) {
      return { success: false, error: 'Solo se pueden eliminar inspecciones canceladas, expiradas o no presentadas' };
    }

    if (booking.inspectorId) {
      const { sendPushToUser } = await import('@/lib/push-notifications');
      const vehicleDesc = `${booking.vehicle.model.brand.name} ${booking.vehicle.model.name} ${booking.vehicle.year}`;
      await sendPushToUser(booking.inspectorId, {
        type: 'inspection_deleted',
        inspectionId: bookingId,
        title: 'Inspección eliminada',
        message: `${vehicleDesc} — Cliente: ${booking.client.name} fue eliminada`,
      }).catch((err) => console.error('[deleteInspection] Push to inspector failed:', err));
    }

    await db.$transaction([
      db.payment.deleteMany({ where: { bookingId } }),
      db.booking.delete({ where: { id: bookingId } }),
    ]);

    revalidatePath('/admin/inspecciones');
    return { success: true };
  } catch (error) {
    console.error('Error eliminando inspección:', error);
    return { success: false, error: 'Error al eliminar la inspección' };
  }
}

// ============================================
// Acciones para disponibilidad de horarios
// ============================================

export async function getAvailabilityForDateAction(date: string) {
  try {
    const { getAvailabilityForDate } = await import('@/lib/scheduling/availability');
    // Admin puede agendar sin restricción de horas mínimas de anticipación
    const availability = await getAvailabilityForDate(date, { isAdmin: true });
    return { success: true, availability };
  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error);
    return { success: false, error: 'Error al obtener disponibilidad' };
  }
}

export async function getAvailableInspectorsForSlotAction(date: string, timeSlot: string) {
  try {
    const { db } = await import('@/lib/db');
    const { crearFechaSinConversion } = await import('@/app/domain/datetime');
    const { BLOCKING_STATUSES } = await import('@/lib/scheduling/constants');

    // Usar crearFechaSinConversion para crear la fecha consistente con el almacenamiento (12:00 UTC)
    const dateObj = crearFechaSinConversion(date);

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
        date: dateObj,
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
