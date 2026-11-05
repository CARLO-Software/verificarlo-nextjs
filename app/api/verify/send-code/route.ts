import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { phone, name, plate } = await req.json();

  if (!phone || !/^9\d{8}$/.test(phone)) {
    return NextResponse.json({ error: "Número de celular inválido" }, { status: 400 });
  }
  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }
  if (!plate) {
    return NextResponse.json({ error: "Placa requerida" }, { status: 400 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SID;

  if (!accountSid || !authToken || !verifySid) {
    console.error("[verify/send-code] Missing Twilio env vars");
    return NextResponse.json({ error: "Servicio no configurado" }, { status: 500 });
  }

  // const MAX_FREE_CONSULTAS = 3;

  try {
    // Límite desactivado por lanzamiento — descomentar cuando se active cobro
    // const usedCount = await db.consultaLead.count({ where: { phone, verified: true } });
    // if (usedCount >= MAX_FREE_CONSULTAS) {
    //   return NextResponse.json({ error: `Ya usaste tus ${MAX_FREE_CONSULTAS} consultas gratuitas. Contáctanos para más.` }, { status: 403 });
    // }

    await db.consultaLead.create({
      data: { name: name.trim(), phone, plate: plate.toUpperCase() },
    });

    const client = twilio(accountSid, authToken);
    await client.verify.v2.services(verifySid).verifications.create({
      to: `+51${phone}`,
      channel: "whatsapp",
    });

    return NextResponse.json({ sent: true });
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === 60203) {
      return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
    }
    console.error("[verify/send-code] Error:", err);
    return NextResponse.json({ error: "Error enviando código" }, { status: 500 });
  }
}
