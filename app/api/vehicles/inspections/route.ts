import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// OPTIMIZADO: Cache por 24 horas - tipos de inspección raramente cambian
export const revalidate = 86400;

export async function GET() {
  try {
    const inspections = await db.inspection.findMany({
      include: {
        items: true,
      },
    });

    return NextResponse.json(inspections, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error) {
    console.error("Error al obtener inspecciones:", error);
    return NextResponse.json(
      { message: "Error al obtener inspecciones" },
      { status: 500 }
    );
  }
}
