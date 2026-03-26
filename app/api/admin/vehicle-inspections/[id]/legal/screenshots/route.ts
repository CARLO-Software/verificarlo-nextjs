/**
 * API: Subir/Eliminar capturas de fuentes legales
 * POST - Subir una captura
 * DELETE - Eliminar una captura
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

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

    // 8. Actualizar JSON de screenshots en la BD
    const existingScreenshots = (inspection.legalScreenshots as Record<string, any>) || {};
    const updatedScreenshots = {
      ...existingScreenshots,
      [sourceId]: {
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        uploadedAt: new Date().toISOString(),
      },
    };

    await db.vehicleInspection.update({
      where: { id: inspectionId },
      data: { legalScreenshots: updatedScreenshots },
    });

    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.secure_url,
    });
  } catch (error: any) {
    console.error("Error uploading legal screenshot:", error);
    return NextResponse.json(
      { error: error.message || "Error al subir la imagen" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una captura
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

    // 3. Obtener sourceId del query param
    const { searchParams } = new URL(req.url);
    const sourceId = searchParams.get("sourceId");

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

    // 5. Eliminar de Cloudinary si existe
    const existingScreenshots = (inspection.legalScreenshots as Record<string, any>) || {};
    const screenshot = existingScreenshots[sourceId];

    if (screenshot?.publicId) {
      try {
        await cloudinary.uploader.destroy(screenshot.publicId);
      } catch (e) {
        console.error("Error deleting from Cloudinary:", e);
      }
    }

    // 6. Actualizar JSON quitando el screenshot
    const { [sourceId]: _, ...remainingScreenshots } = existingScreenshots;

    await db.vehicleInspection.update({
      where: { id: inspectionId },
      data: { legalScreenshots: remainingScreenshots },
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
