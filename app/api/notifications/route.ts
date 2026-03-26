/**
 * GET /api/notifications
 * Retorna las notificaciones del usuario autenticado.
 * Query params:
 *   ?unread=true  → solo no leídas
 *   ?limit=20     → máximo de resultados (default 30)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const onlyUnread = searchParams.get("unread") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "30", 10), 100);

    const notifications = await db.notification.findMany({
      where: {
        userId: session.user.id,
        ...(onlyUnread ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        // Incluir VehicleInspection para obtener vehicleId y clientId
        inspection: {
          select: {
            id: true,
            vehicleId: true,
            clientId: true,
          },
        },
      },
    });

    // Obtener los bookingIds correspondientes a las VehicleInspections
    const vehicleClientPairs = notifications
      .filter((n) => n.inspection)
      .map((n) => ({
        vehicleId: n.inspection!.vehicleId,
        clientId: n.inspection!.clientId,
      }));

    // Buscar bookings que coincidan con vehicleId y clientId
    const bookings = await db.booking.findMany({
      where: {
        OR: vehicleClientPairs.map((pair) => ({
          vehicleId: pair.vehicleId,
          clientId: pair.clientId,
        })),
      },
      select: {
        id: true,
        vehicleId: true,
        clientId: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Crear mapa de vehicleId+clientId -> bookingId
    const bookingMap = new Map<string, number>();
    bookings.forEach((b) => {
      const key = `${b.vehicleId}-${b.clientId}`;
      // Solo guardar el primero (más reciente) si hay múltiples
      if (!bookingMap.has(key)) {
        bookingMap.set(key, b.id);
      }
    });

    // Enriquecer notificaciones con bookingId
    const enrichedNotifications = notifications.map((n) => {
      const key = n.inspection
        ? `${n.inspection.vehicleId}-${n.inspection.clientId}`
        : null;
      const bookingId = key ? bookingMap.get(key) : null;

      return {
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        inspectionId: n.inspectionId,
        bookingId: bookingId ?? null,
        read: n.read,
        createdAt: n.createdAt,
      };
    });

    const unreadCount = await db.notification.count({
      where: { userId: session.user.id, read: false },
    });

    return NextResponse.json({
      notifications: enrichedNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error("[GET /notifications]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
