import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateAndSendOTP } from "@/services/auth/auth.server";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email requerido." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ error: "Este email ya fue verificado." }, { status: 400 });
  }

  await generateAndSendOTP(email, user.name);

  return NextResponse.json({ message: "Código reenviado." });
}
