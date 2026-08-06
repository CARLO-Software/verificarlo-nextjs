// ============================================
// API: /api/reels/[id]/like
// Incrementar contador de likes
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limit: 10 likes por IP por minuto
    const blocked = rateLimitResponse(_req, "reel-like", 10, 60 * 1000);
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
      data: { likes: { increment: 1 } },
      select: { id: true, likes: true },
    });

    return NextResponse.json(reel);
  } catch (error) {
    console.error("Error incrementando likes:", error);
    return NextResponse.json(
      { error: "Error al registrar el like" },
      { status: 500 }
    );
  }
}
