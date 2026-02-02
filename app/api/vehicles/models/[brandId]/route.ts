import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const brandId = parseInt(params.brandId);

    if (isNaN(brandId)) {
      return NextResponse.json(
        { message: "ID de marca inválido" },
        { status: 400 }
      );
    }

    const models = await db.model.findMany({
      where: { brand_id: brandId },
      orderBy: { name: "asc" },
    });

    // Transformar a camelCase para el frontend
    const formattedModels = models.map((model) => ({
      id: model.id,
      name: model.name,
      brandId: model.brand_id,
      yearFrom: model.year_from,
      yearTo: model.year_to,
    }));

    return NextResponse.json(formattedModels);
  } catch (error) {
    console.error("Error al obtener modelos:", error);
    return NextResponse.json(
      { message: "Error al obtener modelos" },
      { status: 500 }
    );
  }
}
