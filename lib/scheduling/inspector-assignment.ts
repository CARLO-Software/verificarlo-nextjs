// ============================================
// ALGORITMO DE ASIGNACIÓN DE INSPECTORES
// ============================================

import { db } from "@/lib/db";
import { startOfDay } from "date-fns";

// ============================================
// TIPOS
// ============================================

export interface AssignmentResult {
  success: boolean;
  inspectorId?: string;
  inspectorName?: string;
  error?: string;
}

export interface ReassignmentResult {
  success: boolean;
  reassigned: number;
  failed: number;
  details: string[];
}

interface InspectorWorkload {
  id: string;
  name: string;
  dailyCount: number;
  hasSlotConflict: boolean;
}

// ============================================
// ASIGNAR INSPECTOR (después del pago exitoso)
// ============================================

export async function assignInspector(
  bookingId: number
): Promise<AssignmentResult> {
  // Obtener el booking
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { inspectionPlan: true },
  });

  if (!booking) {
    return { success: false, error: "Reserva no encontrada" };
  }

  if (booking.status !== "PAID") {
    return { success: false, error: "La reserva no está en estado PAID" };
  }

  // Obtener inspectores activos
  const inspectors = await db.user.findMany({
    where: {
      role: "INSPECTOR",
      isInspectorAvailable: true,
    },
    select: { id: true, name: true },
  });

  if (inspectors.length === 0) {
    return { success: false, error: "No hay inspectores disponibles" };
  }

  // Calcular carga de trabajo de cada inspector
  const inspectorWorkload: InspectorWorkload[] = await Promise.all(
    inspectors.map(async (inspector) => {
      // Contar citas del día
      const dailyCount = await db.booking.count({
        where: {
          inspectorId: inspector.id,
          date: booking.date,
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
      });

      // Verificar si ya tiene cita en ese slot específico
      const hasSlotConflict = await db.booking
        .findFirst({
          where: {
            inspectorId: inspector.id,
            date: booking.date,
            timeSlot: booking.timeSlot,
            status: { in: ["CONFIRMED", "PAID"] },
          },
        })
        .then((result) => !!result);

      return {
        id: inspector.id,
        name: inspector.name,
        dailyCount,
        hasSlotConflict,
      };
    })
  );

  // Filtrar inspectores que NO tienen conflicto en ese slot
  // y ordenar por menor carga de trabajo
  const availableInspectors = inspectorWorkload
    .filter((i) => !i.hasSlotConflict)
    .sort((a, b) => a.dailyCount - b.dailyCount);

  if (availableInspectors.length === 0) {
    return {
      success: false,
      error: "Todos los inspectores están ocupados en ese horario",
    };
  }

  // Asignar al inspector con menor carga
  const selectedInspector = availableInspectors[0];

  // Actualizar booking
  await db.booking.update({
    where: { id: bookingId },
    data: {
      inspectorId: selectedInspector.id,
      status: "CONFIRMED",
      confirmedAt: new Date(),
    },
  });

  return {
    success: true,
    inspectorId: selectedInspector.id,
    inspectorName: selectedInspector.name,
  };
}

// ============================================
// REASIGNAR CITAS DE UN INSPECTOR
// (cuando se enferma o no está disponible)
// ============================================

export async function reassignInspectorBookings(
  inspectorId: string,
  date: Date,
  _reason: string
): Promise<ReassignmentResult> {
  // Obtener todas las citas confirmadas del inspector para esa fecha
  const bookings = await db.booking.findMany({
    where: {
      inspectorId,
      date: startOfDay(date),
      status: "CONFIRMED",
    },
    include: {
      client: { select: { name: true, email: true, phone: true } },
    },
  });

  if (bookings.length === 0) {
    return {
      success: true,
      reassigned: 0,
      failed: 0,
      details: ["No hay citas para reasignar"],
    };
  }

  const details: string[] = [];
  let reassigned = 0;
  let failed = 0;

  for (const booking of bookings) {
    // Buscar otro inspector disponible para ese slot
    const otherInspector = await db.user.findFirst({
      where: {
        role: "INSPECTOR",
        isInspectorAvailable: true,
        id: { not: inspectorId },
        inspectorBookings: {
          none: {
            date: startOfDay(date),
            timeSlot: booking.timeSlot,
            status: { in: ["CONFIRMED", "PAID"] },
          },
        },
      },
    });

    if (otherInspector) {
      await db.booking.update({
        where: { id: booking.id },
        data: { inspectorId: otherInspector.id },
      });

      details.push(
        `Cita #${booking.id} (${booking.timeSlot}) - ${booking.client.name} → Reasignada a ${otherInspector.name}`
      );
      reassigned++;

      // TODO: Enviar notificación al cliente y nuevo inspector
    } else {
      details.push(
        `Cita #${booking.id} (${booking.timeSlot}) - ${booking.client.name} → Sin inspector disponible`
      );
      failed++;
    }
  }

  // Si el inspector tiene citas que no pudieron reasignarse,
  // se debería notificar al admin
  if (failed > 0) {
    // TODO: Notificar al admin sobre citas sin reasignar
    console.warn(
      `[ALERTA] ${failed} citas no pudieron ser reasignadas para la fecha ${date.toISOString()}`
    );
  }

  return {
    success: failed === 0,
    reassigned,
    failed,
    details,
  };
}

// ============================================
// OBTENER ESTADÍSTICAS DE CARGA DE INSPECTORES
// ============================================

export async function getInspectorsWorkload(date: Date) {
  const inspectors = await db.user.findMany({
    where: {
      role: "INSPECTOR",
      isInspectorAvailable: true,
    },
    select: { id: true, name: true },
  });

  const workload = await Promise.all(
    inspectors.map(async (inspector) => {
      const bookings = await db.booking.findMany({
        where: {
          inspectorId: inspector.id,
          date: startOfDay(date),
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
        select: { timeSlot: true, status: true },
        orderBy: { timeSlot: "asc" },
      });

      return {
        id: inspector.id,
        name: inspector.name,
        totalBookings: bookings.length,
        slots: bookings.map((b) => ({
          time: b.timeSlot,
          status: b.status,
        })),
      };
    })
  );

  return workload;
}

// ============================================
// DESACTIVAR INSPECTOR TEMPORALMENTE
// ============================================

export async function toggleInspectorActive(
  inspectorId: string,
  isInspectorAvailable: boolean
): Promise<{ success: boolean; error?: string }> {
  const inspector = await db.user.findUnique({
    where: { id: inspectorId },
  });

  if (!inspector || inspector.role !== "INSPECTOR") {
    return { success: false, error: "Inspector no encontrado" };
  }

  await db.user.update({
    where: { id: inspectorId },
    data: { isInspectorAvailable },
  });

  return { success: true };
}
