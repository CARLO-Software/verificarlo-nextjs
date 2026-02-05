// ============================================
// GET /api/bookings/[id]/report - Obtener informe de una reserva
// POST /api/bookings/[id]/report - Crear informe para una reserva
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getReportByBookingId, createReport } from "@/services/reports/reports.server";

// GET - Obtener informe de la reserva
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = parseInt(params.id);

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: "ID de reserva inválido" },
        { status: 400 }
      );
    }

    const report = await getReportByBookingId(bookingId);

    if (!report) {
      return NextResponse.json(
        { error: "No existe informe para esta reserva" },
        { status: 404 }
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
      { status: error.message?.includes("autorizado") ? 403 : 500 }
    );
  }
}

// POST - Crear informe para la reserva
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = parseInt(params.id);

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: "ID de reserva inválido" },
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
