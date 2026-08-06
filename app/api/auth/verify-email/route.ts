import { NextResponse } from "next/server";
import { verifyEmailCode } from "@/services/auth/auth.server";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit: 5 intentos por IP cada 15 minutos (previene brute force del OTP)
  const blocked = rateLimitResponse(req, "verify-email", 5, 15 * 60 * 1000);
  if (blocked) return blocked;

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
