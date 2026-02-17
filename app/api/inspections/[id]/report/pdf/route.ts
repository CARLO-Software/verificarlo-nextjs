// ============================================
// GET /api/inspections/[id]/report/pdf - Obtener PDF del informe
// POST /api/inspections/[id]/report/pdf - Regenerar PDF
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateInspectionPDF, generatePDFOnDemand, uploadPDFToCloudinary, generateSignedPdfUrl } from "@/lib/pdf";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesión" },
      { status: 401 }
    );
  }

  const bookingId = parseInt(params.id);

  if (isNaN(bookingId)) {
    return NextResponse.json(
      { error: "ID de inspección inválido" },
      { status: 400 }
    );
  }

  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        report: {
          select: {
            id: true,
            pdfUrl: true,
            pdfHash: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Inspección no encontrada" },
        { status: 404 }
      );
    }

    // Verificar acceso
    const userId = session.user.id;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isOwner = booking.clientId === userId;
    const isAssignedInspector = booking.inspectorId === userId;
    const isAdmin = user?.role === "ADMIN";

    if (!isOwner && !isAssignedInspector && !isAdmin) {
      return NextResponse.json(
        { error: "No tiene acceso a esta inspección" },
        { status: 403 }
      );
    }

    // Verificar que la inspección esté completada
    if (booking.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "El informe solo está disponible para inspecciones completadas" },
        { status: 400 }
      );
    }

    // Siempre generar PDF on-demand (Cloudinary bloqueado por cuenta untrusted)
    try {
      const pdfBuffer = await generatePDFOnDemand(bookingId);

      const year = booking.createdAt.getFullYear();
      const code = `INS-${year}-${String(booking.id).padStart(4, "0")}`;

      // Convertir Buffer a Uint8Array para NextResponse
      const uint8Array = new Uint8Array(pdfBuffer);

      return new NextResponse(uint8Array, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="informe-${code}.pdf"`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } catch (pdfError) {
      console.error("Error generando PDF on-demand:", pdfError);
      return NextResponse.json(
        { error: "Error al generar el informe PDF" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error obteniendo PDF:", error);
    return NextResponse.json(
      { error: "Error al obtener el informe" },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Regenerar PDF del informe
// ============================================

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesión" },
      { status: 401 }
    );
  }

  const bookingId = parseInt(params.id);

  if (isNaN(bookingId)) {
    return NextResponse.json(
      { error: "ID de inspección inválido" },
      { status: 400 }
    );
  }

  try {
    // Verificar permisos (solo admin o inspector asignado)
    const userId = session.user.id;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        report: {
          select: { id: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Inspección no encontrada" },
        { status: 404 }
      );
    }

    const isAssignedInspector = booking.inspectorId === userId;
    const isAdmin = user?.role === "ADMIN";

    if (!isAssignedInspector && !isAdmin) {
      return NextResponse.json(
        { error: "Solo el inspector asignado o un administrador puede regenerar el PDF" },
        { status: 403 }
      );
    }

    // Verificar que la inspección esté completada
    if (booking.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Solo se puede generar PDF de inspecciones completadas" },
        { status: 400 }
      );
    }

    if (!booking.report) {
      return NextResponse.json(
        { error: "No existe un informe para esta inspección" },
        { status: 404 }
      );
    }

    // Generar PDF
    console.log(`Regenerando PDF para reporte ${booking.report.id}...`);
    const { buffer, hash } = await generateInspectionPDF(booking.report.id);
    console.log(`PDF regenerado (${buffer.length} bytes)`);

    let publicId: string | null = null;
    let signedUrl: string | null = null;

    // Subir a Cloudinary si está configurado
    if (isCloudinaryConfigured()) {
      const result = await uploadPDFToCloudinary(buffer, booking.report.id);
      publicId = result.public_id;
      signedUrl = generateSignedPdfUrl(publicId);
      console.log(`PDF subido a Cloudinary. Public ID: ${publicId}`);

      // Guardar public_id en pdfUrl para generar URLs firmadas después
      await db.inspectionReport.update({
        where: { id: booking.report.id },
        data: {
          pdfUrl: publicId,
          pdfHash: hash,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "PDF regenerado exitosamente",
      pdfUrl: signedUrl,
      publicId: publicId,
      pdfHash: hash,
    });
  } catch (error) {
    console.error("Error regenerando PDF:", error);
    return NextResponse.json(
      { error: "Error al regenerar el PDF" },
      { status: 500 }
    );
  }
}
