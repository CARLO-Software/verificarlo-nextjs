/**
 * Servicio para crear VehicleInspection al confirmar pago.
 *
 * Lógica de fork basada en placa:
 *  - CON placa  → legalStatus=PENDIENTE + notifica admins (paralelo)
 *  - SIN placa  → legalStatus=BLOQUEADO (secuencial, espera mecánico)
 *  En ambos casos se asigna mecánico aleatoriamente.
 */

import { db } from "@/lib/db";
import { selectAvailableMechanic } from "./assign-mechanic";
import {
  notifyMechanicAssigned,
  notifyNewInspectionWithPlate,
} from "./notifications";

export interface CreateInspectionParams {
  bookingId: number;
  vehicleId: number;
  clientId: string;
  plate: string | null;
  vehicleDescription: string;
  clientName: string;
  scheduledDate?: string; // Fecha de la cita: "2026-03-25"
  scheduledTime?: string; // Hora de la cita: "10:00"
}

export interface CreateInspectionResult {
  success: boolean;
  inspectionId?: number;
  mechanicId?: string;
  mechanicName?: string;
  hasPlate: boolean;
  error?: string;
}

/**
 * Crea una VehicleInspection después de confirmar el pago.
 * Si ya existe una para este booking, la retorna sin crear duplicados.
 */
export async function createVehicleInspection(
  params: CreateInspectionParams
): Promise<CreateInspectionResult> {
  const {
    bookingId,
    vehicleId,
    clientId,
    plate,
    vehicleDescription,
    clientName,
    scheduledDate,
    scheduledTime,
  } = params;

  try {
    // Verificar si ya existe una inspección para este booking
    // (evitar duplicados si se llama múltiples veces)
    const existing = await db.vehicleInspection.findFirst({
      where: { vehicleId, clientId },
      orderBy: { createdAt: "desc" },
    });

    // Si ya existe una inspección reciente (últimos 5 minutos), retornarla
    if (existing) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (existing.createdAt > fiveMinutesAgo) {
        return {
          success: true,
          inspectionId: existing.id,
          mechanicId: existing.assignedMechanicId ?? undefined,
          hasPlate: !!existing.plate,
        };
      }
    }

    // Seleccionar mecánico disponible
    const mechanicResult = await selectAvailableMechanic();
    if (!mechanicResult.success) {
      return {
        success: false,
        hasPlate: !!plate,
        error: mechanicResult.error,
      };
    }

    const normalizedPlate = plate?.trim().toUpperCase() || null;
    const hasPlate = !!normalizedPlate;

    // Crear inspección con estado basado en si hay placa
    const inspection = await db.vehicleInspection.create({
      data: {
        vehicleId,
        clientId,
        plate: normalizedPlate,
        legalStatus: hasPlate ? "PENDIENTE" : "BLOQUEADO",
        mechanicalStatus: "PENDIENTE",
        assignedMechanicId: mechanicResult.mechanicId,
        mechanicAssignedAt: new Date(),
        // Guardamos referencia al booking en notas para trazabilidad
        adminNotes: `Creado desde booking #${bookingId}`,
      },
    });

    // Notificaciones en paralelo (fire-and-forget)
    const notifyTasks: Promise<unknown>[] = [
      notifyMechanicAssigned({
        inspectionId: inspection.id,
        mechanicId: mechanicResult.mechanicId,
        vehicleDescription,
        clientName,
        scheduledDate,
        scheduledTime,
      }),
    ];

    // Si tiene placa, notificar admins para revisión legal (flujo paralelo)
    if (hasPlate) {
      notifyTasks.push(
        notifyNewInspectionWithPlate({
          inspectionId: inspection.id,
          plate: normalizedPlate!,
          vehicleDescription,
          clientName,
          scheduledDate,
          scheduledTime,
        })
      );
    }

    Promise.all(notifyTasks).catch((err) =>
      console.error("[createVehicleInspection] Error en notificaciones:", err)
    );

    return {
      success: true,
      inspectionId: inspection.id,
      mechanicId: mechanicResult.mechanicId,
      mechanicName: mechanicResult.mechanicName,
      hasPlate,
    };
  } catch (error) {
    console.error("[createVehicleInspection] Error:", error);
    return {
      success: false,
      hasPlate: !!plate,
      error: "Error interno al crear inspección",
    };
  }
}
