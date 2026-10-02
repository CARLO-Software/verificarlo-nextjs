import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signJwt } from "@/lib/auth-jwt";

export async function POST(req: Request) {
  const syncSecret = process.env.CARLO_SYNC_SECRET;
  const authHeader = req.headers.get("x-sync-secret");

  if (!syncSecret || authHeader !== syncSecret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { fullName, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await db.user.create({
        data: {
          name: fullName || email.split("@")[0],
          email,
          password: hashedPassword,
          role: "INSPECTOR",
          emailVerified: new Date(),
        },
      });
    } else if (user.role === "CLIENT") {
      await db.user.update({
        where: { email },
        data: { role: "INSPECTOR" },
      });
      user = { ...user, role: "INSPECTOR" };
    }

    const isValid = user.password
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!isValid) {
      return NextResponse.json(
        { error: "Contraseña no coincide" },
        { status: 401 }
      );
    }

    const token = signJwt({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error("[POST /api/sync-user]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
