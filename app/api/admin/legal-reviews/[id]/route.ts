/**
 * API: /api/admin/legal-reviews/[id]
 * GET - Obtener informe legal
 * PATCH - Actualizar campos del informe
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getLegalReport,
  updateLegalReport,
} from "@/services/legalReport/legalReport.server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
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

    const report = await getLegalReport(legalReportId);

    if (!report) {
      return NextResponse.json(
        { error: "Informe legal no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error al obtener informe legal:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();

    const updatedReport = await updateLegalReport(
      legalReportId,
      session.user.id,
      body
    );

    return NextResponse.json(updatedReport);
  } catch (error: any) {
    console.error("Error al actualizar informe legal:", error);

    // Errores de negocio conocidos
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
