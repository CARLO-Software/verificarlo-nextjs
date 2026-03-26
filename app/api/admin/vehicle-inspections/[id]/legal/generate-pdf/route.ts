/**
 * API: Generar PDF del informe legal
 * POST - Genera el PDF y lo sube a Cloudinary
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateLegalPDF } from "@/lib/pdf/legal/generate-legal-pdf";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

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

    // 4. Verificar la inspección
    const inspection = await db.vehicleInspection.findUnique({
      where: { id: inspectionId },
      select: {
        id: true,
        legalStatus: true,
        assignedAdminId: true,
        legalScreenshots: true,
        plate: true,
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: "Inspección no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que sea el admin asignado o que el estado sea COMPLETADO
    if (
      inspection.assignedAdminId !== session.user.id &&
      inspection.legalStatus !== "COMPLETADO"
    ) {
      return NextResponse.json(
        { error: "No tienes permiso para generar este PDF" },
        { status: 403 }
      );
    }

    // 5. Verificar que haya capturas subidas
    const screenshots = inspection.legalScreenshots as Record<string, any>;
    if (!screenshots || Object.keys(screenshots).length === 0) {
      return NextResponse.json(
        { error: "Debes subir al menos una captura antes de generar el PDF" },
        { status: 400 }
      );
    }

    // 6. Generar el PDF
    const pdfBuffer = await generateLegalPDF(inspectionId);

    // 7. Subir a Cloudinary
    const timestamp = Date.now();
    const plateSlug = (inspection.plate || "sin-placa")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    const publicId = `informe-legal-${plateSlug}-${timestamp}.pdf`;

    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "raw",
              type: "upload",
              public_id: publicId,
              folder: "verificarlo/legal-reports",
              overwrite: true,
              tags: ["informe-legal", `inspection-${inspectionId}`],
            },
            (error, result) => {
              if (error) {
                console.error("Error subiendo PDF a Cloudinary:", error);
                reject(new Error(`Error al subir PDF: ${error.message}`));
                return;
              }
              if (!result) {
                reject(new Error("No se recibió respuesta de Cloudinary"));
                return;
              }
              resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
              });
            }
          )
          .end(pdfBuffer);
      }
    );

    // 8. Guardar URL del PDF en la BD
    await db.vehicleInspection.update({
      where: { id: inspectionId },
      data: { legalPdfUrl: uploadResult.secure_url },
    });

    return NextResponse.json({
      success: true,
      pdfUrl: uploadResult.secure_url,
    });
  } catch (error: any) {
    console.error("Error generating legal PDF:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar el PDF" },
      { status: 500 }
    );
  }
}
