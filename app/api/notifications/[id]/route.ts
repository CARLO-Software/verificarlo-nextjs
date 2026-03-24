/**
 * DELETE /api/notifications/[id]
 * Elimina una notificación del usuario autenticado.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const notificationId = parseInt(id, 10);

    if (isNaN(notificationId)) {
      return NextResponse.json(
        { error: "ID de notificación inválido" },
        { status: 400 }
      );
    }

    // Verificar que la notificación pertenece al usuario
    const notification = await db.notification.findFirst({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    await db.notification.delete({
      where: { id: notificationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /notifications/[id]]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
