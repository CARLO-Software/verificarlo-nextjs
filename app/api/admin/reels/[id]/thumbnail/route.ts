// ============================================
// API: /api/admin/reels/[id]/thumbnail
// Subir/actualizar portada de un reel
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const reelId = parseInt(id);

    if (isNaN(reelId)) {
      return NextResponse.json({ error: "ID de reel inválido" }, { status: 400 });
    }

    // Verificar que el reel existe
    const reel = await db.reel.findUnique({ where: { id: reelId } });
    if (!reel) {
      return NextResponse.json({ error: "Reel no encontrado" }, { status: 404 });
    }

    // Verificar Cloudinary
    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ error: "Cloudinary no está configurado" }, { status: 500 });
    }

    // Obtener archivo
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 400 });
    }

    // Máximo 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "La imagen no debe superar 5MB" }, { status: 400 });
    }

    // Subir a Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "reels",
              resource_type: "image",
              transformation: [
                { width: 720, height: 1280, crop: "fill", gravity: "auto", quality: "auto:good", format: "webp" },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as { secure_url: string; public_id: string });
            }
          )
          .end(buffer);
      }
    );

    // Actualizar reel con nueva thumbnail
    const updatedReel = await db.reel.update({
      where: { id: reelId },
      data: { thumbnailUrl: result.secure_url },
    });

    return NextResponse.json({
      success: true,
      thumbnailUrl: result.secure_url,
      reel: updatedReel,
    });
  } catch (error) {
    console.error("Error actualizando thumbnail:", error);
    return NextResponse.json({ error: "Error al actualizar la portada" }, { status: 500 });
  }
}
