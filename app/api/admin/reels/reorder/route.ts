// ============================================
// API: /api/admin/reels/reorder
// Reordenar reels (drag & drop)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

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
// PATCH - Reordenar reels
// Recibe: { orderedIds: [3, 1, 5, 2, 4] }
// ============================================

export async function PATCH(req: NextRequest) {
  const authCheck = await verifyAdmin();

  if ("error" in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const body = await req.json();
    const { orderedIds } = body;

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "Se requiere un array 'orderedIds' con los IDs en el nuevo orden" },
        { status: 400 }
      );
    }

    // Validar que todos los IDs sean números
    if (!orderedIds.every((id: unknown) => typeof id === "number")) {
      return NextResponse.json(
        { error: "Todos los IDs deben ser números" },
        { status: 400 }
      );
    }

    // Actualizar el sortOrder de cada reel según su posición en el array
    const updatePromises = orderedIds.map((id: number, index: number) =>
      db.reel.update({
        where: { id },
        data: { sortOrder: index },
      })
    );

    await Promise.all(updatePromises);

    // Retornar la lista actualizada
    const reels = await db.reel.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      message: "Orden actualizado",
      reels,
    });
  } catch (error) {
    console.error("Error reordenando reels:", error);
    return NextResponse.json(
      { error: "Error al reordenar los reels" },
      { status: 500 }
    );
  }
}
