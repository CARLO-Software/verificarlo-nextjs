// ============================================
// DELETE /api/photos/[id] - Eliminar foto
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { deletePhoto } from "@/services/reports/reports.server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = parseInt(params.id);

    if (isNaN(photoId)) {
      return NextResponse.json(
        { error: "ID de foto inválido" },
        { status: 400 }
      );
    }

    await deletePhoto(photoId);

    return NextResponse.json({
      success: true,
      message: "Foto eliminada exitosamente",
    });
  } catch (error: any) {
    console.error("Error eliminando foto:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar la foto" },
      { status: error.message?.includes("autorizado") ? 403 : 500 }
    );
  }
}
