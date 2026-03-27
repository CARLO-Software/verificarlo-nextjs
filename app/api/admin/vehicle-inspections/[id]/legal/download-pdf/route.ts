/**
 * API: Descargar PDF del informe legal
 * GET - Sirve el PDF a través del servidor (evita restricciones de Cloudinary)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { cloudinary } from "@/lib/cloudinary";

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

    // 6. Extraer public_id de la URL de Cloudinary y generar URL firmada
    // URL formato: https://res.cloudinary.com/CLOUD/raw/upload/vXXX/folder/file.pdf
    const urlParts = inspection.legalPdfUrl.split('/upload/');
    if (urlParts.length !== 2) {
      return NextResponse.json(
        { error: "URL del PDF inválida" },
        { status: 500 }
      );
    }

    // Obtener el path después de /upload/vXXX/
    const pathWithVersion = urlParts[1];
    const pathParts = pathWithVersion.split('/');
    pathParts.shift(); // Quitar versión (vXXX)
    const publicId = pathParts.join('/').replace('.pdf', '');

    // Generar URL firmada con expiración
    const signedUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      type: 'upload',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 60, // Expira en 60 segundos
    });

    // 7. Descargar el PDF usando la URL firmada
    const pdfResponse = await fetch(signedUrl);

    if (!pdfResponse.ok) {
      console.error("Error descargando PDF:", pdfResponse.status, await pdfResponse.text());
      return NextResponse.json(
        { error: "Error al obtener el PDF" },
        { status: 500 }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // 8. Enviar el PDF al cliente
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
