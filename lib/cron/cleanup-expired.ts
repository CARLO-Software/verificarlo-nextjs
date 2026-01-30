// ============================================
// JOB: LIMPIAR RESERVAS EXPIRADAS
// Ejecutar cada 5 minutos con Vercel Cron o similar
// ============================================

import { db } from "@/lib/db";

export interface CleanupResult {
  expiredCount: number;
  timestamp: Date;
}

/**
 * Marca como EXPIRED las reservas que:
 * - Están en estado PENDING_PAYMENT
 * - Su tiempo de expiración (expiresAt) ya pasó
 *
 * Esto libera los slots para que otros clientes puedan reservar.
 */
export async function cleanupExpiredBookings(): Promise<CleanupResult> {
  const now = new Date();

  const result = await db.booking.updateMany({
    where: {
      status: "PENDING_PAYMENT",
      expiresAt: {
        lt: now,
      },
    },
    data: {
      status: "EXPIRED",
    },
  });

  if (result.count > 0) {
    console.log(
      `[CRON] ${result.count} reserva(s) expirada(s) a las ${now.toISOString()}`
    );
  }

  return {
    expiredCount: result.count,
    timestamp: now,
  };
}

/**
 * Limpia pagos pendientes huérfanos (sin booking asociado válido)
 * Esto no debería pasar normalmente, pero es una medida de seguridad.
 */
export async function cleanupOrphanPayments(): Promise<number> {
  const orphanPayments = await db.payment.findMany({
    where: {
      status: "PENDING",
      booking: {
        status: {
          in: ["EXPIRED", "CANCELLED"],
        },
      },
    },
    select: { id: true },
  });

  if (orphanPayments.length > 0) {
    await db.payment.updateMany({
      where: {
        id: {
          in: orphanPayments.map((p) => p.id),
        },
      },
      data: {
        status: "FAILED",
        errorMessage: "Booking expirado o cancelado",
      },
    });

    console.log(
      `[CRON] ${orphanPayments.length} pago(s) huérfano(s) marcado(s) como FAILED`
    );
  }

  return orphanPayments.length;
}

/**
 * Ejecutar todas las tareas de limpieza
 */
export async function runAllCleanupTasks(): Promise<{
  expired: number;
  orphanPayments: number;
}> {
  const [expiredResult, orphanPayments] = await Promise.all([
    cleanupExpiredBookings(),
    cleanupOrphanPayments(),
  ]);

  return {
    expired: expiredResult.expiredCount,
    orphanPayments,
  };
}
