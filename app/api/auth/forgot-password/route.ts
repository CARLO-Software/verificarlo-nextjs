import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { getResendClient, EMAIL_FROM } from "@/lib/email/resend";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit: 3 solicitudes por IP cada 15 minutos
  const blocked = rateLimitResponse(req, "forgot-password", 3, 15 * 60 * 1000);
  if (blocked) return blocked;

  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email requerido." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Single query: fetch only password existence and Google provider check
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      name: true,
      password: true,
      accounts: {
        where: { provider: "google" },
        select: { id: true },
        take: 1,
      },
    },
  });

  // Siempre responder igual para no revelar si el email existe
  const okResponse = NextResponse.json({
    message:
      "Si el correo está registrado, recibirás un enlace en tu bandeja de entrada.",
  });

  if (!user) return okResponse;

  // Usuarios de Google sin contraseña no pueden resetear por este flujo
  if (!user.password && user.accounts.length > 0) return okResponse;

  // Generar token único
  const rawToken = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
  const identifier = `reset:${normalizedEmail}`;

  // Single DB round trip: delete old tokens + insert new in one statement
  await db.$executeRaw`
    WITH deleted AS (
      DELETE FROM "VerificationToken" WHERE identifier = ${identifier}
    )
    INSERT INTO "VerificationToken" (identifier, token, expires)
    VALUES (${identifier}, ${rawToken}, ${expires})
  `;

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`;

  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: normalizedEmail,
    subject: "Restablece tu contraseña — VerifiCARLO",
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:480px;width:100%;">
        <tr><td style="background:#131211;padding:28px 40px;text-align:center;">
          <span style="color:#FBBF24;font-size:22px;font-weight:700;">VerifiCARLO</span>
        </td></tr>
        <tr><td style="padding:40px;text-align:center;">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;">Restablecer contraseña</h1>
          <p style="margin:0 0 32px;color:#6b7280;font-size:15px;line-height:1.6;">
            Hola <strong>${user.name}</strong>, recibimos una solicitud para restablecer tu contraseña.
            Este enlace expira en <strong>1 hora</strong>.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#FBBF24;color:#111827;font-weight:700;font-size:15px;padding:14px 32px;border-radius:100px;text-decoration:none;">
            Restablecer contraseña
          </a>
          <p style="margin:28px 0 0;font-size:13px;color:#9ca3af;">
            Si no solicitaste esto, puedes ignorar este mensaje. Tu contraseña no cambiará.
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:16px 40px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">© 2025 VerifiCARLO — verificarlo.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) {
    console.error("[forgot-password] Error enviando email:", error);
  } else {
    console.log("[forgot-password] Email enviado:", data?.id);
  }

  return okResponse;
}
