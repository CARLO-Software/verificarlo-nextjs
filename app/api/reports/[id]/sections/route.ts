// ============================================
// PATCH /api/reports/[id]/sections - Actualizar secciones del informe
// ============================================

import { NextRequest, NextResponse } from "next/server";
import {
  updateLegalSection,
  updateMechanicalSection,
  updateBodySection,
  updateVehicleData,
  updateDocumentsVerification,
} from "@/services/reports/reports.server";

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
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json(
        { error: "Sección y datos son requeridos" },
        { status: 400 }
      );
    }

    let result;

    switch (section) {
      case "legal":
        result = await updateLegalSection(reportId, data);
        break;

      case "mechanical":
        result = await updateMechanicalSection(reportId, data);
        break;

      case "body":
        result = await updateBodySection(reportId, data);
        break;

      case "vehicle":
        result = await updateVehicleData(reportId, data);
        break;

      case "documents":
        result = await updateDocumentsVerification(reportId, data);
        break;

      default:
        return NextResponse.json(
          { error: "Sección no válida" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      report: result,
    });
  } catch (error: any) {
    console.error("Error actualizando sección:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar la sección" },
      { status: error.message?.includes("autorizado") ? 403 : 500 }
    );
  }
}
