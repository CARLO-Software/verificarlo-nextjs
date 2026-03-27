/**
 * API: Descargar PDF del informe legal
 * GET - Genera el PDF on-demand (evita restricciones de Cloudinary)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateLegalPDF } from "@/lib/pdf/legal/generate-legal-pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
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

    // 3. Obtener la inspección
    const inspection = await db.vehicleInspection.findUnique({
      where: { id: inspectionId },
      select: {
        id: true,
        legalPdfUrl: true,
        legalStatus: true,
        plate: true,
        clientId: true,
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: "Inspección no encontrada" },
        { status: 404 }
      );
    }

    // 4. Verificar que el usuario tiene acceso (admin o cliente dueño)
    const isAdmin = session.user.role === "ADMIN";
    const isOwner = inspection.clientId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "No tienes permiso para ver este PDF" },
        { status: 403 }
      );
    }

    // 5. Verificar que el informe legal está completado
    if (inspection.legalStatus !== "COMPLETADO") {
      return NextResponse.json(
        { error: "El informe legal aún no ha sido completado" },
        { status: 400 }
      );
    }

    // 6. Generar PDF on-demand
    const pdfBuffer = await generateLegalPDF(inspectionId);

    // 7. Enviar el PDF al cliente
    const filename = `informe-legal-${inspection.plate || inspection.id}.pdf`;

    // Convertir Buffer a Uint8Array para NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Error generando PDF legal:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar el PDF" },
      { status: 500 }
    );
  }
}
