// ============================================
// GET /api/cron/cleanup
// Endpoint para limpiar reservas expiradas
// Llamado por Vercel Cron cada 5 minutos
// ============================================

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { runAllCleanupTasks } from "@/lib/cron/cleanup-expired";

export async function GET(req: NextRequest) {
  // Verificar autorización con timing-safe comparison
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === "production") {
    if (!cronSecret || !authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    try {
      const isValid =
        token.length === cronSecret.length &&
        crypto.timingSafeEqual(Buffer.from(token), Buffer.from(cronSecret));
      if (!isValid) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runAllCleanupTasks();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cleaned: {
        expiredBookings: result.expired,
        orphanPayments: result.orphanPayments,
      },
    });
  } catch (error) {
    console.error("Error en cleanup cron:", error);
    return NextResponse.json(
      { error: "Error ejecutando limpieza" },
      { status: 500 }
    );
  }
}

// Configuración de Vercel Cron
// Añadir en vercel.json:
// {
//   "crons": [
//     {
//       "path": "/api/cron/cleanup",
//       "schedule": "*/5 * * * *"
//     }
//   ]
// }
