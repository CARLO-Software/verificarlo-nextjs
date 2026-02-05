// ============================================
// POST /api/reports - Crear informe de inspección
// GET /api/reports - Obtener informes del inspector
// ============================================

import { NextRequest, NextResponse } from "next/server";
import {
  createReport,
  getInspectorPendingInspections,
  getInspectorCompletedInspections,
} from "@/services/reports/reports.server";

// POST - Crear nuevo informe
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "El ID de la reserva es requerido" },
        { status: 400 }
      );
    }

    const report = await createReport({ bookingId });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("Error creando informe:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear el informe" },
      { status: error.message?.includes("autorizado") ? 403 : 500 }
    );
  }
}

// GET - Obtener inspecciones del inspector
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let inspections;

    if (status === "completed") {
      inspections = await getInspectorCompletedInspections();
    } else {
      inspections = await getInspectorPendingInspections();
    }

    return NextResponse.json({
      success: true,
      inspections,
    });
  } catch (error: any) {
    console.error("Error obteniendo inspecciones:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener inspecciones" },
      { status: error.message?.includes("autorizado") ? 403 : 500 }
    );
  }
}
