// ============================================
// GET /api/availability
// Obtener disponibilidad por fecha o mes
// ============================================

import { NextRequest, NextResponse } from "next/server";
import {
  getAvailabilityForDate,
  getMonthAvailability,
} from "@/lib/scheduling/availability";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const date = searchParams.get("date"); // YYYY-MM-DD
  const month = searchParams.get("month"); // YYYY-MM

  try {
    // Disponibilidad de un día específico
    if (date) {
      // Validar formato de fecha
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json(
          { error: "Formato de fecha inválido. Use YYYY-MM-DD" },
          { status: 400 }
        );
      }

      const availability = await getAvailabilityForDate(date);
      return NextResponse.json(availability);
    }

    // Disponibilidad mensual (para calendario)
    if (month) {
      // Validar formato de mes
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json(
          { error: "Formato de mes inválido. Use YYYY-MM" },
          { status: 400 }
        );
      }

      //Separar año y mes por el guión
      const [year, monthNum] = month.split("-").map(Number);

      // Validar rango del mes
      if (monthNum < 1 || monthNum > 12) {
        return NextResponse.json(
          { error: "Mes debe estar entre 01 y 12" },
          { status: 400 }
        );
      }

      const availability = await getMonthAvailability(year, monthNum);
      return NextResponse.json(availability);
    }

    return NextResponse.json(
      { error: "Se requiere parámetro 'date' (YYYY-MM-DD) o 'month' (YYYY-MM)" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error obteniendo disponibilidad:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
