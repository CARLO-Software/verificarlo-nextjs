// ============================================
// GET /api/inspections/[id]/report/pdf - Generar PDF del informe
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

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
        client: {
          select: { id: true, name: true, email: true },
        },
        inspector: {
          select: { id: true, name: true },
        },
        vehicle: {
          include: {
            model: {
              include: { brand: true },
            },
          },
        },
        inspectionPlan: true,
        payment: true,
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

    // TODO: Implementar generación real del PDF
    // Por ahora retornamos un placeholder
    // En producción se usaría una librería como @react-pdf/renderer, pdfkit, o puppeteer

    const pdfContent = generatePlaceholderPdf(booking);

    return new NextResponse(pdfContent, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="informe-INS-${booking.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generando PDF:", error);
    return NextResponse.json(
      { error: "Error al generar el informe" },
      { status: 500 }
    );
  }
}

// Placeholder PDF generator - En producción usar una librería real
function generatePlaceholderPdf(booking: any): Buffer {
  // PDF mínimo válido con texto
  const year = booking.createdAt.getFullYear();
  const code = `#INS-${year}-${String(booking.id).padStart(4, "0")}`;

  // Este es un PDF muy básico - en producción usar pdfkit, react-pdf, etc.
  const pdfHeader = "%PDF-1.4\n";
  const content = `
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj

4 0 obj
<< /Length 200 >>
stream
BT
/F1 24 Tf
100 700 Td
(INFORME DE INSPECCION) Tj
/F1 14 Tf
0 -40 Td
(Codigo: ${code}) Tj
0 -25 Td
(Vehiculo: ${booking.vehicle.model.brand.name} ${booking.vehicle.model.name}) Tj
0 -25 Td
(Placa: ${booking.vehicle.plate || "Sin placa"}) Tj
0 -25 Td
(Estado: Completado) Tj
ET
endstream
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
0000000518 00000 n

trailer
<< /Size 6 /Root 1 0 R >>
startxref
593
%%EOF`;

  return Buffer.from(pdfHeader + content, "utf-8");
}
