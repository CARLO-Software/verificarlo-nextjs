/**
 * DELETE /api/devices/unregister
 * Removes an FCM token (e.g., on logout).
 *
 * Body:
 *   token: string — FCM registration token to remove
 *
 * Requires authentication via NextAuth session.
 */

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-jwt";
import { db } from "@/lib/db";

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser(request);

    if (!user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body as { token?: string };

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token FCM requerido" },
        { status: 400 }
      );
    }

    // Only delete if it belongs to the authenticated user
    await db.deviceToken.deleteMany({
      where: {
        token,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/devices/unregister]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
