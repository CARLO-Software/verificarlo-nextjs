// ============================================
// API: /api/reels
// Endpoints públicos para reels educativos
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================
// GET - Listar reels activos (público)
// ============================================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const reels = await db.reel.findMany({
      where: {
        isActive: true,
        ...(category && { category: category as "TIPS" | "FRAUDES" | "PROCESO" | "TESTIMONIOS" }),
      },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        embedUrl: true,
        embedType: true,
        thumbnailUrl: true,
        category: true,
        views: true,
      },
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
