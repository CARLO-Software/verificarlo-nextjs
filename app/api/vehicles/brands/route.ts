import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// OPTIMIZADO: Cache por 24 horas - marcas raramente cambian
export const revalidate = 86400;

export async function GET() {
  try {
    const brands = await db.brand.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(brands, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error) {
    console.error("Error al obtener marcas:", error);
    return NextResponse.json(
      { message: "Error al obtener marcas" },
      { status: 500 }
    );
  }
}
