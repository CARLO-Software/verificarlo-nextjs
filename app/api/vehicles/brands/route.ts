import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const brands = await db.brand.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(brands);
  } catch (error) {
    console.error("Error al obtener marcas:", error);
    return NextResponse.json(
      { message: "Error al obtener marcas" },
      { status: 500 }
    );
  }
}
