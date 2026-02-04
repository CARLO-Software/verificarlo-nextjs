import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// OPTIMIZADO: Cache por 24 horas - tipos de inspección raramente cambian
export const revalidate = 86400;

export async function GET() {
  try {
    const inspectionPlans = await db.inspectionPlan.findMany({
      include: {
        items: true,
      },
    });

    return NextResponse.json(inspectionPlans, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error) {
    console.error("Error al obtener planes de inspección:", error);
    return NextResponse.json(
      { message: "Error al obtener planes de inspección" },
      { status: 500 }
    );
  }
}
