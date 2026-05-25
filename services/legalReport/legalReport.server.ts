/**
 * Servicio de Informe Legal
 * Maneja la creación, actualización y bloqueo de informes legales
 * que los administradores completan después de que el inspector finaliza la inspección.
 */

import { db as prisma } from "@/lib/db";
import { LegalReportStatus, LegalFieldStatus } from "@prisma/client";

// Duración del bloqueo exclusivo en minutos
const LOCK_DURATION_MINUTES = 15;

// ============================================
// TIPOS
// ============================================

export interface LegalReportUpdateData {
  // Columna Izquierda
  ownerHistoryStatus?: LegalFieldStatus;
  ownerHistoryText?: string | null;
  sunarpLiensStatus?: LegalFieldStatus;
  sunarpLiensText?: string | null;
  satCaptureOrderStatus?: LegalFieldStatus;
  satCaptureOrderText?: string | null;
  soatStatus?: LegalFieldStatus;
  soatText?: string | null;
  soatExpiryDate?: Date | null;
  techReviewStatus?: LegalFieldStatus;
  techReviewText?: string | null;
  techReviewExpiryDate?: Date | null;
  vehicleTaxStatus?: LegalFieldStatus;
  vehicleTaxText?: string | null;
  gasConversionStatus?: LegalFieldStatus;
  gasConversionText?: string | null;

  // Columna Derecha
  satTicketsStatus?: LegalFieldStatus;
  satTicketsText?: string | null;
  callaoTicketsStatus?: LegalFieldStatus;
  callaoTicketsText?: string | null;
  sutranTicketsStatus?: LegalFieldStatus;
  sutranTicketsText?: string | null;
  siniestroSoatStatus?: LegalFieldStatus;
  siniestroSoatText?: string | null;
  transportRegistryStatus?: LegalFieldStatus;
  transportRegistryText?: string | null;
  lastTransferStatus?: LegalFieldStatus;
  lastTransferText?: string | null;
  accidentHistoryStatus?: LegalFieldStatus;
  accidentHistoryText?: string | null;

  // Observaciones generales
  otherObservations?: string | null;
}

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Crear un nuevo informe legal cuando el inspector completa la inspección
 */
export async function createLegalReport(reportId: number) {
  // Verificar que no exista ya
  const existing = await prisma.legalReport.findUnique({
    where: { reportId },
  });

  if (existing) {
    return existing;
  }

  return prisma.legalReport.create({
    data: {
      reportId,
      status: LegalReportStatus.PENDING_REVIEW,
    },
  });
}

/**
 * Obtener un informe legal por su ID
 */
export async function getLegalReport(id: number) {
  return prisma.legalReport.findUnique({
    where: { id },
    include: {
      report: {
        include: {
          booking: {
            include: {
              vehicle: {
                include: {
                  model: {
                    include: { brand: true },
                  },
                },
              },
              client: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
              inspectionPlan: true,
            },
          },
        },
      },
      lockedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      completedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Obtener informe legal por el ID del InspectionReport
 */
export async function getLegalReportByReportId(reportId: number) {
  return prisma.legalReport.findUnique({
    where: { reportId },
    include: {
      report: {
        include: {
          booking: {
            include: {
              vehicle: {
                include: {
                  model: {
                    include: { brand: true },
                  },
                },
              },
              client: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
              inspectionPlan: true,
            },
          },
        },
      },
      lockedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      completedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Actualizar los campos del informe legal
 * Solo puede actualizar si tiene el bloqueo activo
 */
export async function updateLegalReport(
  id: number,
  adminId: string,
  data: LegalReportUpdateData
) {
  // Verificar que el admin tenga el bloqueo
  const report = await prisma.legalReport.findUnique({
    where: { id },
    select: {
      lockedBy: true,
      lockExpiresAt: true,
      status: true,
    },
  });

  if (!report) {
    throw new Error("Informe legal no encontrado");
  }

  if (report.status === LegalReportStatus.COMPLETED) {
    throw new Error("Este informe ya está completado y no se puede editar");
  }

  const now = new Date();
  const hasValidLock =
    report.lockedBy === adminId &&
    report.lockExpiresAt &&
    report.lockExpiresAt > now;

  if (!hasValidLock) {
    throw new Error("No tienes el bloqueo activo para editar este informe");
  }

  // Actualizar campos
  return prisma.legalReport.update({
    where: { id },
    data: {
      ...data,
      status: LegalReportStatus.IN_PROGRESS,
    },
  });
}

/**
 * Marcar el informe legal como completado
 */
export async function completeLegalReport(id: number, adminId: string) {
  // Verificar bloqueo
  const report = await prisma.legalReport.findUnique({
    where: { id },
    select: {
      lockedBy: true,
      lockExpiresAt: true,
      status: true,
    },
  });

  if (!report) {
    throw new Error("Informe legal no encontrado");
  }

  if (report.status === LegalReportStatus.COMPLETED) {
    throw new Error("Este informe ya está completado");
  }

  const now = new Date();
  const hasValidLock =
    report.lockedBy === adminId &&
    report.lockExpiresAt &&
    report.lockExpiresAt > now;

  if (!hasValidLock) {
    throw new Error("No tienes el bloqueo activo para completar este informe");
  }

  return prisma.legalReport.update({
    where: { id },
    data: {
      status: LegalReportStatus.COMPLETED,
      completedAt: now,
      completedBy: adminId,
      // Liberar bloqueo
      lockedBy: null,
      lockedAt: null,
      lockExpiresAt: null,
    },
  });
}

// ============================================
// SISTEMA DE BLOQUEO EXCLUSIVO
// ============================================

/**
 * Adquirir bloqueo exclusivo para editar el informe
 * Devuelve el informe actualizado o null si no se pudo bloquear
 */
export async function acquireLock(id: number, adminId: string) {
  const now = new Date();

  // Verificar estado actual
  const report = await prisma.legalReport.findUnique({
    where: { id },
    select: {
      lockedBy: true,
      lockExpiresAt: true,
      status: true,
    },
  });

  if (!report) {
    throw new Error("Informe legal no encontrado");
  }

  if (report.status === LegalReportStatus.COMPLETED) {
    throw new Error("Este informe ya está completado y no requiere edición");
  }

  // Verificar si hay un bloqueo activo de otro admin
  const hasActiveOtherLock =
    report.lockedBy &&
    report.lockedBy !== adminId &&
    report.lockExpiresAt &&
    report.lockExpiresAt > now;

  if (hasActiveOtherLock) {
    // Obtener información del admin que tiene el bloqueo
    const lockedUser = await prisma.user.findUnique({
      where: { id: report.lockedBy! },
      select: { name: true },
    });
    throw new Error(
      `Este informe está siendo editado por ${lockedUser?.name || "otro administrador"}`
    );
  }

  // Adquirir bloqueo
  const lockExpiresAt = new Date(now.getTime() + LOCK_DURATION_MINUTES * 60000);

  return prisma.legalReport.update({
    where: { id },
    data: {
      lockedBy: adminId,
      lockedAt: now,
      lockExpiresAt,
      status:
        report.status === LegalReportStatus.PENDING_REVIEW
          ? LegalReportStatus.IN_PROGRESS
          : report.status,
    },
    include: {
      lockedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Liberar bloqueo del informe
 */
export async function releaseLock(id: number, adminId: string) {
  const report = await prisma.legalReport.findUnique({
    where: { id },
    select: { lockedBy: true },
  });

  if (!report) {
    throw new Error("Informe legal no encontrado");
  }

  // Solo el que tiene el bloqueo puede liberarlo
  if (report.lockedBy !== adminId) {
    return report; // No hacer nada si no es el dueño del bloqueo
  }

  return prisma.legalReport.update({
    where: { id },
    data: {
      lockedBy: null,
      lockedAt: null,
      lockExpiresAt: null,
    },
  });
}

/**
 * Renovar el bloqueo (extender 15 minutos más)
 * Útil para evitar que expire mientras el admin sigue trabajando
 */
export async function renewLock(id: number, adminId: string) {
  const now = new Date();

  const report = await prisma.legalReport.findUnique({
    where: { id },
    select: {
      lockedBy: true,
      lockExpiresAt: true,
    },
  });

  if (!report) {
    throw new Error("Informe legal no encontrado");
  }

  // Solo el que tiene el bloqueo puede renovarlo
  if (report.lockedBy !== adminId) {
    throw new Error("No tienes el bloqueo de este informe");
  }

  // Verificar que el bloqueo no haya expirado
  if (report.lockExpiresAt && report.lockExpiresAt < now) {
    throw new Error("El bloqueo ha expirado. Debes adquirirlo de nuevo.");
  }

  const lockExpiresAt = new Date(now.getTime() + LOCK_DURATION_MINUTES * 60000);

  return prisma.legalReport.update({
    where: { id },
    data: {
      lockExpiresAt,
    },
  });
}

// ============================================
// CONSULTAS
// ============================================

/**
 * Contar informes legales pendientes de revisión
 * Para mostrar en el badge del sidebar admin
 */
export async function getPendingCount() {
  return prisma.legalReport.count({
    where: {
      status: {
        in: [LegalReportStatus.PENDING_REVIEW, LegalReportStatus.IN_PROGRESS],
      },
    },
  });
}

/**
 * Obtener lista de informes legales con filtros
 */
export async function getLegalReports(options?: {
  status?: LegalReportStatus;
  limit?: number;
  offset?: number;
}) {
  const { status, limit = 20, offset = 0 } = options || {};

  const where = status ? { status } : {};

  const [reports, total] = await Promise.all([
    prisma.legalReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        report: {
          include: {
            booking: {
              include: {
                vehicle: {
                  include: {
                    model: {
                      include: { brand: true },
                    },
                  },
                },
                client: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        lockedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.legalReport.count({ where }),
  ]);

  return { reports, total };
}

/**
 * Liberar bloqueos expirados (para cron job o limpieza periódica)
 */
export async function releaseExpiredLocks() {
  const now = new Date();

  return prisma.legalReport.updateMany({
    where: {
      lockedBy: { not: null },
      lockExpiresAt: { lt: now },
    },
    data: {
      lockedBy: null,
      lockedAt: null,
      lockExpiresAt: null,
    },
  });
}
