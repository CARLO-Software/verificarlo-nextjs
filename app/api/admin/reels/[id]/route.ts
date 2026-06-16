// ============================================
// API: /api/admin/reels/[id]
// Operaciones sobre un reel específico
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
// GET - Obtener un reel por ID
// ============================================

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await verifyAdmin();

  if ("error" in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const { id } = await params;
    const reelId = parseInt(id);

    if (isNaN(reelId)) {
      return NextResponse.json(
        { error: "ID de reel inválido" },
        { status: 400 }
      );
    }

    const reel = await db.reel.findUnique({
      where: { id: reelId },
    });

    if (!reel) {
      return NextResponse.json(
        { error: "Reel no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(reel);
  } catch (error) {
    console.error("Error obteniendo reel:", error);
    return NextResponse.json(
      { error: "Error al obtener el reel" },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - Actualizar un reel
// ============================================

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await verifyAdmin();

  if ("error" in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const { id } = await params;
    const reelId = parseInt(id);

    if (isNaN(reelId)) {
      return NextResponse.json(
        { error: "ID de reel inválido" },
        { status: 400 }
      );
    }

    const existing = await db.reel.findUnique({
      where: { id: reelId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Reel no encontrado" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { title, description, embedUrl, embedType, thumbnailUrl, category, isActive, videoUrl } = body;

    // Validaciones
    if (title && title.length > 100) {
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

    const updatedReel = await db.reel.update({
      where: { id: reelId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(embedUrl !== undefined && { embedUrl }),
        ...(embedType !== undefined && { embedType }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(category !== undefined && { category }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updatedReel);
  } catch (error) {
    console.error("Error actualizando reel:", error);
    return NextResponse.json(
      { error: "Error al actualizar el reel" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Eliminar un reel
// ============================================

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await verifyAdmin();

  if ("error" in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const { id } = await params;
    const reelId = parseInt(id);

    if (isNaN(reelId)) {
      return NextResponse.json(
        { error: "ID de reel inválido" },
        { status: 400 }
      );
    }

    const existing = await db.reel.findUnique({
      where: { id: reelId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Reel no encontrado" },
        { status: 404 }
      );
    }

    await db.reel.delete({
      where: { id: reelId },
    });

    return NextResponse.json({
      success: true,
      message: `Reel "${existing.title}" eliminado`,
    });
  } catch (error) {
    console.error("Error eliminando reel:", error);
    return NextResponse.json(
      { error: "Error al eliminar el reel" },
      { status: 500 }
    );
  }
}
