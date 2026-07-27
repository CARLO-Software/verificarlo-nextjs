// ============================================
// GET /api/reports/[id] - Obtener informe
// PATCH /api/reports/[id] - Actualizar informe
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-jwt";
import { updateReport } from "@/services/reports/reports.server";

// GET - Obtener informe por ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);

    if (!user?.id) {
      return NextResponse.json(
        { error: "Debe iniciar sesión" },
        { status: 401 }
      );
    }

    const reportId = parseInt(params.id);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: "ID de informe inválido" },
        { status: 400 }
      );
    }

    const report = await db.inspectionReport.findUnique({
      where: { id: reportId },
      include: {
        photos: {
          orderBy: { sortOrder: "asc" },
        },
        booking: {
          include: {
            client: {
              select: { id: true, name: true, email: true, phone: true },
            },
            vehicle: {
              include: {
                model: {
                  include: { brand: true },
                },
              },
            },
            inspectionPlan: true,
            inspector: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Informe no encontrado" },
        { status: 404 }
      );
    }

    // Verificar acceso
    const userId = user.id;
    const isOwner = report.booking.clientId === userId;
    const isInspector = report.booking.inspectorId === userId;
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isInspector && !isAdmin) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("Error obteniendo informe:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener el informe" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar informe
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = parseInt(params.id);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: "ID de informe inválido" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const report = await updateReport(reportId, body, req);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("Error actualizando informe:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar el informe" },
      { status: error.message?.includes("autorizado") ? 403 : 500 }
    );
  }
}
