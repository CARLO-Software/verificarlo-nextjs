// ============================================
// API: /api/admin/reels/upload-video
// Subir video nativo de reel a Cloudinary
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

// Configuración para subida de videos grandes
export const maxDuration = 60; // 60 segundos máximo (requiere plan Pro en Vercel)
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar configuración de Cloudinary
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Cloudinary no está configurado" },
        { status: 500 }
      );
    }

    // Obtener el archivo del form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Validar que sea un video (mp4, webm, mov)
    const validVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!validVideoTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "El archivo debe ser un video (MP4, WebM o MOV)" },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "El video no debe superar 50MB" },
        { status: 400 }
      );
    }

    // Convertir a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Subir a Cloudinary con transformación para videos verticales (9:16)
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "reels/videos",
              resource_type: "video",
              transformation: [
                {
                  width: 720,
                  height: 1280,
                  crop: "fill",
                  gravity: "auto",
                },
              ],
              format: "mp4",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as { secure_url: string; public_id: string });
            }
          )
          .end(buffer);
      }
    );

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Error uploading reel video:", error);
    return NextResponse.json(
      { error: "Error al subir el video" },
      { status: 500 }
    );
  }
}
