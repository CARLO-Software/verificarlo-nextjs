import { NextResponse } from "next/server";
import { verifyEmailCode } from "@/services/auth/auth.server";

export async function POST(req: Request) {
  const { email, code } = await req.json();

  if (!email || !code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const result = await verifyEmailCode(email, code.trim());

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ message: "Email verificado correctamente." });
}
