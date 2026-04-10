/**
 * API: Subir/Eliminar capturas de fuentes legales
 * POST - Subir una captura (soporta múltiples imágenes por fuente)
 * DELETE - Eliminar una captura (por sourceId e índice opcional)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { LEGAL_SOURCES } from "@/lib/constants/legal-sources";

// Estructura de una imagen
interface ScreenshotImage {
  imageUrl: string;
  publicId: string;
  uploadedAt: string;
}

// Obtener el máximo de imágenes permitidas para una fuente
function getMaxImagesForSource(sourceId: string): number {
  const source = LEGAL_SOURCES.find((s) => s.id === sourceId);
  return source?.maxImages || 1;
}

// POST - Subir una captura de pantalla
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Verificar Cloudinary
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Cloudinary no está configurado" },
        { status: 500 }
      );
    }

    // 3. Validar inspectionId
    const inspectionId = parseInt(params.id);
    if (isNaN(inspectionId)) {
      return NextResponse.json(
        { error: "ID de inspección inválido" },
        { status: 400 }
      );
    }

    // 4. Obtener la inspección
    const inspection = await db.vehicleInspection.findUnique({
      where: { id: inspectionId },
      select: {
        id: true,
        legalStatus: true,
        legalScreenshots: true,
        assignedAdminId: true,
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: "Inspección no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el admin asignado es quien sube
    if (inspection.assignedAdminId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para esta inspección" },
        { status: 403 }
      );
    }

    // 5. Obtener datos del FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sourceId = formData.get("sourceId") as string | null;

    if (!file || !sourceId) {
      return NextResponse.json(
        { error: "Falta archivo o sourceId" },
        { status: 400 }
      );
    }

    // 6. Validar imagen
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "La imagen no debe superar 5MB" },
        { status: 400 }
      );
    }

    // 7. Subir a Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `legal-inspections/${inspectionId}`,
            resource_type: "image",
            transformation: [
              { width: 1600, crop: "limit", quality: "auto", format: "webp" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as { secure_url: string; public_id: string });
          }
        )
        .end(buffer);
    });

    // 8. Actualizar JSON de screenshots en la BD (soporta múltiples imágenes)
    const existingScreenshots = (inspection.legalScreenshots as Record<string, any>) || {};
    const maxImages = getMaxImagesForSource(sourceId);

    // Nueva imagen
    const newImage: ScreenshotImage = {
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      uploadedAt: new Date().toISOString(),
    };

    let updatedScreenshots;

    if (maxImages > 1) {
      // Fuente que soporta múltiples imágenes - usar array
      const existingImages = Array.isArray(existingScreenshots[sourceId])
        ? existingScreenshots[sourceId]
        : existingScreenshots[sourceId]
        ? [existingScreenshots[sourceId]] // Migrar formato antiguo a array
        : [];

      // Verificar límite
      if (existingImages.length >= maxImages) {
        return NextResponse.json(
          { error: `Máximo ${maxImages} imágenes permitidas para esta fuente` },
          { status: 400 }
        );
      }

      updatedScreenshots = {
        ...existingScreenshots,
        [sourceId]: [...existingImages, newImage],
      };
    } else {
      // Fuente con una sola imagen - formato original
      updatedScreenshots = {
        ...existingScreenshots,
        [sourceId]: newImage,
      };
    }

    await db.vehicleInspection.update({
      where: { id: inspectionId },
      data: { legalScreenshots: updatedScreenshots },
    });

    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.secure_url,
      index: maxImages > 1 ? (Array.isArray(existingScreenshots[sourceId]) ? existingScreenshots[sourceId].length : (existingScreenshots[sourceId] ? 1 : 0)) : 0,
    });
  } catch (error: any) {
    console.error("Error uploading legal screenshot:", error);
    return NextResponse.json(
      { error: error.message || "Error al subir la imagen" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una captura (soporta índice para múltiples imágenes)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Validar inspectionId
    const inspectionId = parseInt(params.id);
    if (isNaN(inspectionId)) {
      return NextResponse.json(
        { error: "ID de inspección inválido" },
        { status: 400 }
      );
    }

    // 3. Obtener sourceId e índice del query param
    const { searchParams } = new URL(req.url);
    const sourceId = searchParams.get("sourceId");
    const indexParam = searchParams.get("index");
    const imageIndex = indexParam !== null ? parseInt(indexParam) : null;

    if (!sourceId) {
      return NextResponse.json(
        { error: "Falta sourceId" },
        { status: 400 }
      );
    }

    // 4. Obtener la inspección
    const inspection = await db.vehicleInspection.findUnique({
      where: { id: inspectionId },
      select: {
        id: true,
        legalScreenshots: true,
        assignedAdminId: true,
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: "Inspección no encontrada" },
        { status: 404 }
      );
    }

    if (inspection.assignedAdminId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para esta inspección" },
        { status: 403 }
      );
    }

    // 5. Obtener screenshots existentes
    const existingScreenshots = (inspection.legalScreenshots as Record<string, any>) || {};
    const sourceData = existingScreenshots[sourceId];

    if (!sourceData) {
      return NextResponse.json(
        { error: "No hay imágenes para esta fuente" },
        { status: 404 }
      );
    }

    let updatedScreenshots;
    const maxImages = getMaxImagesForSource(sourceId);

    if (maxImages > 1 && Array.isArray(sourceData)) {
      // Fuente con múltiples imágenes
      if (imageIndex === null || imageIndex < 0 || imageIndex >= sourceData.length) {
        return NextResponse.json(
          { error: "Índice de imagen inválido" },
          { status: 400 }
        );
      }

      // Eliminar de Cloudinary
      const imageToDelete = sourceData[imageIndex];
      if (imageToDelete?.publicId) {
        try {
          await cloudinary.uploader.destroy(imageToDelete.publicId);
        } catch (e) {
          console.error("Error deleting from Cloudinary:", e);
        }
      }

      // Eliminar del array
      const newImages = sourceData.filter((_: any, i: number) => i !== imageIndex);

      if (newImages.length === 0) {
        // Si no quedan imágenes, eliminar la key
        const { [sourceId]: _, ...remaining } = existingScreenshots;
        updatedScreenshots = remaining;
      } else {
        updatedScreenshots = {
          ...existingScreenshots,
          [sourceId]: newImages,
        };
      }
    } else {
      // Fuente con una sola imagen (formato original o migrado)
      const screenshot = Array.isArray(sourceData) ? sourceData[0] : sourceData;

      if (screenshot?.publicId) {
        try {
          await cloudinary.uploader.destroy(screenshot.publicId);
        } catch (e) {
          console.error("Error deleting from Cloudinary:", e);
        }
      }

      const { [sourceId]: _, ...remaining } = existingScreenshots;
      updatedScreenshots = remaining;
    }

    await db.vehicleInspection.update({
      where: { id: inspectionId },
      data: { legalScreenshots: updatedScreenshots },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting legal screenshot:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar la imagen" },
      { status: 500 }
    );
  }
}
