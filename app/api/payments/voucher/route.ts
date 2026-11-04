import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "Cloudinary no configurado" }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const bookingId = parseInt(formData.get("bookingId") as string);

  if (!file || isNaN(bookingId)) {
    return NextResponse.json({ error: "Archivo y bookingId requeridos" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "La imagen no debe superar 5MB" }, { status: 400 });
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { clientId: true, status: true, payment: { select: { id: true } } },
  });

  if (!booking || booking.clientId !== session.user.id) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  if (booking.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "Esta reserva ya no está pendiente de pago" }, { status: 400 });
  }

  if (!booking.payment) {
    return NextResponse.json({ error: "No se encontró información de pago" }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "vouchers",
            resource_type: "image",
            transformation: [{ width: 800, crop: "limit", quality: "auto:low", fetch_format: "webp" }],
          },
          (error, res) => {
            if (error) reject(error);
            else resolve(res as { secure_url: string; public_id: string });
          }
        )
        .end(buffer);
    });

    await db.payment.update({
      where: { id: booking.payment.id },
      data: {
        voucherUrl: result.secure_url,
        voucherPublicId: result.public_id,
      },
    });

    return NextResponse.json({ success: true, voucherUrl: result.secure_url });
  } catch (error) {
    console.error("[voucher] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al subir el comprobante" }, { status: 500 });
  }
}
