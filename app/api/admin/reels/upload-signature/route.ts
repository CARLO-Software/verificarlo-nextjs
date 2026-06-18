// ============================================
// API: /api/admin/reels/upload-signature
// Genera firma para subida directa a Cloudinary
// Esto permite subir videos grandes sin pasar por el servidor
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar configuración de Cloudinary
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Cloudinary no está configurado" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { resourceType = "video" } = body;

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = resourceType === "video" ? "reels/videos" : "reels";

    // Solo incluir parámetros que Cloudinary acepta en la firma
    // resource_type, format, transformation NO van en la firma
    const paramsToSign: Record<string, string | number> = {
      timestamp,
      folder,
    };

    // Generar firma
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
      resourceType,
    });
  } catch (error) {
    console.error("Error generating upload signature:", error);
    return NextResponse.json(
      { error: "Error al generar firma de subida" },
      { status: 500 }
    );
  }
}
