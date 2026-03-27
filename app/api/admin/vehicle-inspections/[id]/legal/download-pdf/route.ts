/**
 * API: Descargar PDF del informe legal
 * GET - Sirve el PDF a través del servidor (evita restricciones de Cloudinary)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

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

    // 3. Obtener la inspección con la URL del PDF
    const inspection = await db.vehicleInspection.findUnique({
      where: { id: inspectionId },
      select: {
        id: true,
        legalPdfUrl: true,
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

    // 5. Verificar que existe el PDF
    if (!inspection.legalPdfUrl) {
      return NextResponse.json(
        { error: "El PDF aún no ha sido generado" },
        { status: 404 }
      );
    }

    // 6. Descargar el PDF de Cloudinary
    const pdfResponse = await fetch(inspection.legalPdfUrl);

    if (!pdfResponse.ok) {
      console.error("Error descargando PDF de Cloudinary:", pdfResponse.status);
      return NextResponse.json(
        { error: "Error al obtener el PDF" },
        { status: 500 }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // 7. Enviar el PDF al cliente
    const filename = `informe-legal-${inspection.plate || inspection.id}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Error downloading legal PDF:", error);
    return NextResponse.json(
      { error: error.message || "Error al descargar el PDF" },
      { status: 500 }
    );
  }
}
