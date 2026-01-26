import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const inspections = await db.inspection.findMany({
      include: {
        items: true,
      },
    });
    return NextResponse.json(inspections);
  } catch (error) {
    console.error("Error al obtener inspecciones:", error);
    return NextResponse.json(
      { message: "Error al obtener inspecciones" },
      { status: 500 }
    );
  }
}
