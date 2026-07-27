/**
 * PATCH /api/notifications/all/read
 * Marca TODAS las notificaciones del usuario como leídas.
 */

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-jwt";
import { db } from "@/lib/db";

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const result = await db.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    return NextResponse.json({ marked: result.count });
  } catch (error) {
    console.error("[PATCH /notifications/all/read]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
