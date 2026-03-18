/**
 * API: /api/admin/legal-reviews/[id]/lock
 * POST - Adquirir bloqueo exclusivo
 * DELETE - Liberar bloqueo
 * PATCH - Renovar bloqueo
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  acquireLock,
  releaseLock,
  renewLock,
} from "@/services/legalReport/legalReport.server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST - Adquirir bloqueo exclusivo
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const legalReportId = parseInt(id, 10);

    if (isNaN(legalReportId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const report = await acquireLock(legalReportId, session.user.id);

    return NextResponse.json({
      success: true,
      lockExpiresAt: report.lockExpiresAt,
      lockedByUser: report.lockedByUser,
    });
  } catch (error: any) {
    console.error("Error al adquirir bloqueo:", error);

    // Bloqueo ya tomado por otro admin
    if (error.message?.includes("editado por")) {
      return NextResponse.json(
        {
          error: error.message,
          locked: true,
        },
        { status: 409 } // Conflict
      );
    }

    // Informe ya completado
    if (error.message?.includes("completado")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Liberar bloqueo
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const legalReportId = parseInt(id, 10);

    if (isNaN(legalReportId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await releaseLock(legalReportId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al liberar bloqueo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Renovar bloqueo (extender tiempo)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const legalReportId = parseInt(id, 10);

    if (isNaN(legalReportId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const report = await renewLock(legalReportId, session.user.id);

    return NextResponse.json({
      success: true,
      lockExpiresAt: report.lockExpiresAt,
    });
  } catch (error: any) {
    console.error("Error al renovar bloqueo:", error);

    if (
      error.message?.includes("expirado") ||
      error.message?.includes("bloqueo")
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
