// ============================================
// API: /api/admin/reels
// CRUD de reels educativos (protegido para admins)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmbedType, ReelCategory } from "@prisma/client";

// ============================================
// Helper: Verificar rol de admin
// ============================================

async function verifyAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Debe iniciar sesión", status: 401 };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return { error: "Acceso denegado. Solo para administradores.", status: 403 };
  }

  return { success: true };
}

// ============================================
// GET - Listar todos los reels (admin)
// ============================================

export async function GET() {
  const authCheck = await verifyAdmin();

  if ("error" in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const reels = await db.reel.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(reels);
  } catch (error) {
    console.error("Error obteniendo reels:", error);
    return NextResponse.json(
      { error: "Error al obtener los reels" },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Crear nuevo reel
// ============================================

export async function POST(req: NextRequest) {
  const authCheck = await verifyAdmin();

  if ("error" in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const body = await req.json();
    const { title, description, embedUrl, embedType, thumbnailUrl, category } = body;

    // Validaciones
    if (!title || !embedUrl || !thumbnailUrl) {
      return NextResponse.json(
        { error: "Título, URL del video y thumbnail son obligatorios" },
        { status: 400 }
      );
    }

    if (title.length > 100) {
      return NextResponse.json(
        { error: "El título no puede exceder 100 caracteres" },
        { status: 400 }
      );
    }

    if (description && description.length > 300) {
      return NextResponse.json(
        { error: "La descripción no puede exceder 300 caracteres" },
        { status: 400 }
      );
    }

    // Validar embedType
    const validEmbedTypes: EmbedType[] = ["INSTAGRAM", "TIKTOK", "YOUTUBE_SHORTS"];
    if (embedType && !validEmbedTypes.includes(embedType)) {
      return NextResponse.json(
        { error: "Tipo de embed inválido. Usar: INSTAGRAM, TIKTOK o YOUTUBE_SHORTS" },
        { status: 400 }
      );
    }

    // Validar category
    const validCategories: ReelCategory[] = ["TIPS", "FRAUDES", "PROCESO", "TESTIMONIOS"];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Categoría inválida. Usar: TIPS, FRAUDES, PROCESO o TESTIMONIOS" },
        { status: 400 }
      );
    }

    // Obtener el máximo sortOrder actual
    const maxOrder = await db.reel.aggregate({
      _max: { sortOrder: true },
    });

    const newReel = await db.reel.create({
      data: {
        title,
        description: description || null,
        embedUrl,
        embedType: embedType || "INSTAGRAM",
        thumbnailUrl,
        category: category || "TIPS",
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(newReel, { status: 201 });
  } catch (error) {
    console.error("Error creando reel:", error);
    return NextResponse.json(
      { error: "Error al crear el reel" },
      { status: 500 }
    );
  }
}
