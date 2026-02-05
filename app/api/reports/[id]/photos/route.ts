// ============================================
// GET /api/reports/[id]/photos - Obtener fotos del informe
// POST /api/reports/[id]/photos - Agregar foto al informe
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { addPhoto, getReportPhotos } from "@/services/reports/reports.server";
import { PhotoCategory } from "@prisma/client";

// GET - Obtener fotos del informe
export async function GET(
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

    const photos = await getReportPhotos(reportId);

    return NextResponse.json({
      success: true,
      photos,
    });
  } catch (error: any) {
    console.error("Error obteniendo fotos:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener las fotos" },
      { status: 500 }
    );
  }
}

// POST - Agregar foto al informe
export async function POST(
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
    const { url, thumbnailUrl, category, label } = body;

    if (!url) {
      return NextResponse.json(
        { error: "La URL de la imagen es requerida" },
        { status: 400 }
      );
    }

    if (!category || !Object.values(PhotoCategory).includes(category)) {
      return NextResponse.json(
        { error: "Categoría de foto inválida" },
        { status: 400 }
      );
    }

    const photo = await addPhoto({
      reportId,
      url,
      thumbnailUrl,
      category,
      label,
    });

    return NextResponse.json({
      success: true,
      photo,
    });
  } catch (error: any) {
    console.error("Error agregando foto:", error);
    return NextResponse.json(
      { error: error.message || "Error al agregar la foto" },
      { status: error.message?.includes("autorizado") ? 403 : 500 }
    );
  }
}
