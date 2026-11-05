import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { phone, code } = await req.json();

  if (!phone || !/^9\d{8}$/.test(phone)) {
    return NextResponse.json({ error: "Número de celular inválido" }, { status: 400 });
  }
  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "Código de 6 dígitos requerido" }, { status: 400 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SID;

  if (!accountSid || !authToken || !verifySid) {
    console.error("[verify/check-code] Missing Twilio env vars");
    return NextResponse.json({ error: "Servicio no configurado" }, { status: 500 });
  }

  try {
    const client = twilio(accountSid, authToken);
    const check = await client.verify.v2.services(verifySid).verificationChecks.create({
      to: `+51${phone}`,
      code,
    });

    if (!check.valid) {
      return NextResponse.json({ error: "Código incorrecto" }, { status: 400 });
    }

    await db.consultaLead.updateMany({
      where: { phone, verified: false },
      data: { verified: true },
    });

    return NextResponse.json({ valid: true });
  } catch (err: unknown) {
    const twilioCode = (err as { code?: number })?.code;
    if (twilioCode === 20404) {
      return NextResponse.json({ error: "Código expirado. Solicita uno nuevo." }, { status: 400 });
    }
    console.error("[verify/check-code] Error:", err);
    return NextResponse.json({ error: "Error verificando código" }, { status: 500 });
  }
}
