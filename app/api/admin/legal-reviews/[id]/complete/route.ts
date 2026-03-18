/**
 * API: POST /api/admin/legal-reviews/[id]/complete
 * Marcar el informe legal como completado
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { completeLegalReport } from "@/services/legalReport/legalReport.server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

    const report = await completeLegalReport(legalReportId, session.user.id);

    return NextResponse.json({
      success: true,
      completedAt: report.completedAt,
    });
  } catch (error: any) {
    console.error("Error al completar informe legal:", error);

    if (
      error.message?.includes("bloqueo") ||
      error.message?.includes("completado")
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
