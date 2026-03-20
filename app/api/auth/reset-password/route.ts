import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 });
  }

  // Buscar el token
  const record = await db.verificationToken.findUnique({
    where: { token },
  });

  if (!record || !record.identifier.startsWith("reset:")) {
    return NextResponse.json({ error: "El enlace no es válido." }, { status: 400 });
  }

  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { token } });
    return NextResponse.json({ error: "El enlace ha expirado. Solicita uno nuevo." }, { status: 400 });
  }

  const email = record.identifier.replace("reset:", "");

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.$transaction([
    db.user.update({
      where: { email },
      data: { password: hashedPassword },
    }),
    db.verificationToken.delete({ where: { token } }),
  ]);

  return NextResponse.json({ message: "Contraseña actualizada correctamente." });
}
