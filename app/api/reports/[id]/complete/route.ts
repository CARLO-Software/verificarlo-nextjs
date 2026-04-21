// ============================================
// POST /api/reports/[id]/complete - Finalizar informe
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { completeReport } from "@/services/reports/reports.server";

interface CompleteReportBody {
  mechanicalVerdict?: "APROBADO" | "OBSERVADO" | "NO_APROBADO";
  hasSiniestro?: boolean;
  hasKilometrajeAdulterado?: boolean;
}

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

    // Leer el body con el veredicto
    let body: CompleteReportBody = {};
    try {
      body = await req.json();
    } catch {
      // Body vacío es válido para compatibilidad
    }

    const report = await completeReport(reportId, {
      mechanicalVerdict: body.mechanicalVerdict,
      hasSiniestro: body.hasSiniestro,
      hasKilometrajeAdulterado: body.hasKilometrajeAdulterado,
    });

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
