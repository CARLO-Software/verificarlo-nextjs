// ============================================
// API: /api/reels/[id]/view
// Incrementar contador de vistas
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimitResponse } from "@/lib/rate-limit";

// ============================================
// POST - Incrementar vistas de un reel
// ============================================

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limit: 30 views por IP por minuto
    const blocked = rateLimitResponse(_req, "reel-view", 30, 60 * 1000);
    if (blocked) return blocked;

    const { id } = await params;
    const reelId = parseInt(id);

    if (isNaN(reelId)) {
      return NextResponse.json(
        { error: "ID de reel inválido" },
        { status: 400 }
      );
    }

    const reel = await db.reel.update({
      where: { id: reelId },
      data: { views: { increment: 1 } },
      select: { id: true, views: true },
    });

    return NextResponse.json(reel);
  } catch (error) {
    console.error("Error incrementando vistas:", error);
    return NextResponse.json(
      { error: "Error al registrar la vista" },
      { status: 500 }
    );
  }
}
