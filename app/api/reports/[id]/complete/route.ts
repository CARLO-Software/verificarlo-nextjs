// ============================================
// POST /api/reports/[id]/complete - Finalizar informe
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { completeReport } from "@/services/reports/reports.server";

export async function POST(
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

    const report = await completeReport(reportId);

    return NextResponse.json({
      success: true,
      message: "Informe finalizado exitosamente",
      report,
    });
  } catch (error: any) {
    console.error("Error finalizando informe:", error);

    // Mensajes de error específicos
    if (error.message?.includes("no ha sido completada")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Error al finalizar el informe" },
      { status: error.message?.includes("autorizado") ? 403 : 500 }
    );
  }
}
