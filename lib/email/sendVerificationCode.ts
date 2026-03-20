import { getResendClient, EMAIL_FROM } from "./resend";

export async function sendVerificationCodeEmail(options: {
  to: string;
  clientName: string;
  code: string;
}) {
  const resend = getResendClient();

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:480px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#131211;padding:28px 40px;text-align:center;">
              <span style="color:#FBBF24;font-size:22px;font-weight:700;letter-spacing:-0.5px;">VerifiCARLO</span>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 40px 24px;text-align:center;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;">
                Verifica tu correo
              </h1>
              <p style="margin:0 0 32px;color:#6b7280;font-size:15px;line-height:1.6;">
                Hola <strong>${options.clientName}</strong>, usa el siguiente código para activar tu cuenta en VerifiCARLO. Expira en <strong>15 minutos</strong>.
              </p>

              <!-- Code box -->
              <div style="background:#FEF3C7;border-radius:12px;padding:28px 24px;margin-bottom:28px;">
                <span style="font-size:42px;font-weight:700;color:#111827;letter-spacing:14px;font-family:monospace;">
                  ${options.code}
                </span>
              </div>

              <p style="margin:0;font-size:13px;color:#9ca3af;">
                Si no creaste una cuenta en VerifiCARLO, puedes ignorar este mensaje.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:16px 40px;text-align:center;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © 2025 VerifiCARLO — verificarlo.pe
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: options.to,
    subject: `${options.code} es tu código de verificación de VerifiCARLO`,
    html,
  });
}
