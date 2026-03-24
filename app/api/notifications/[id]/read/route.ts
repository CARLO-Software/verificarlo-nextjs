/**
 * PATCH /api/notifications/[id]/read
 * Marca una notificación como leída.
 * Solo el dueño puede marcarla.
 *
 * PATCH /api/notifications/all/read  (ver ruta separada)
 * para marcar todas como leídas.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const notificationId = parseInt(id, 10);

    if (isNaN(notificationId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // updateMany con userId garantiza que solo el dueño puede marcarla
    const result = await db.notification.updateMany({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
      data: { read: true },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /notifications/[id]/read]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
