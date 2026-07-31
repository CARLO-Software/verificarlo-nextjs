/**
 * POST /api/devices/register
 * Registers an FCM token for push notifications.
 *
 * Body:
 *   token: string    — FCM registration token
 *   platform?: string — "android" | "ios" | "web" (default: "android")
 *
 * Requires authentication via NextAuth session.
 */

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-jwt";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);

    if (!user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { token, platform = "android" } = body as {
      token?: string;
      platform?: string;
    };

    if (!token || typeof token !== "string" || token.length < 10) {
      return NextResponse.json(
        { error: "Token FCM inválido" },
        { status: 400 }
      );
    }

    const validPlatforms = ["android", "ios", "web"];
    const normalizedPlatform = validPlatforms.includes(platform)
      ? platform
      : "android";

    // Upsert: update if token exists, create otherwise
    await db.deviceToken.upsert({
      where: { token },
      update: {
        userId: user.id,
        platform: normalizedPlatform,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        token,
        platform: normalizedPlatform,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/devices/register]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
