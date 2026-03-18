// ============================================
// POST /api/reports/[id]/photos/upload - Subir foto a Cloudinary
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { addPhoto } from "@/services/reports/reports.server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo inspectores y admins pueden subir fotos
    if (!["INSPECTOR", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // 2. Verificar configuración de Cloudinary
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Cloudinary no está configurado" },
        { status: 500 }
      );
    }

    // 3. Validar reportId
    const reportId = parseInt(params.id);
    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: "ID de informe inválido" },
        { status: 400 }
      );
    }

    // 4. Verificar que el report existe y no está completado
    const report = await db.inspectionReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        completedAt: true,
        booking: {
          select: { inspectorId: true }
        }
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Informe no encontrado" },
        { status: 404 }
      );
    }

    if (report.completedAt) {
      return NextResponse.json(
        { error: "No se pueden agregar fotos a un informe finalizado" },
        { status: 400 }
      );
    }

    // Verificar acceso (inspector asignado o admin)
    if (session.user.role === "INSPECTOR" && report.booking.inspectorId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes acceso a este informe" },
        { status: 403 }
      );
    }

    // 5. Obtener el archivo del FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const checklistItemId = formData.get("checklistItemId") as string | null;
    const label = formData.get("label") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // 6. Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen" },
        { status: 400 }
      );
    }

    // 7. Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "La imagen no debe superar 10MB" },
        { status: 400 }
      );
    }

    // 8. Convertir a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 9. Subir a Cloudinary con optimizaciones
    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `inspections/${reportId}`,
            resource_type: "image",
            transformation: [
              { width: 1200, crop: "limit", quality: "auto", format: "webp" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as { secure_url: string; public_id: string });
          }
        )
        .end(buffer);
    });

    // 10. Generar URL del thumbnail usando transformación de Cloudinary
    const thumbnailUrl = cloudinary.url(uploadResult.public_id, {
      width: 200,
      height: 200,
      crop: "fill",
      quality: "auto",
      format: "webp",
    });

    // 11. Guardar en la base de datos
    const photo = await addPhoto({
      reportId,
      url: uploadResult.secure_url,
      thumbnailUrl,
      checklistItemId: checklistItemId || undefined,
      label: label || undefined,
    });

    return NextResponse.json({
      success: true,
      photo: {
        id: photo.id,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        checklistItemId: photo.checklistItemId,
        label: photo.label,
      },
    });
  } catch (error: any) {
    console.error("Error uploading photo:", error);
    return NextResponse.json(
      { error: error.message || "Error al subir la imagen" },
      { status: 500 }
    );
  }
}
