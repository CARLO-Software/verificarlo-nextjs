// ============================================================================
// EMAIL — Confirmación de pago exitoso
// ============================================================================

import { getResendClient, EMAIL_FROM } from "./resend";

interface PaymentConfirmationOptions {
  to: string;
  clientName: string;
  bookingId: number;
  amount: number; // en soles (ej: 150.00)
  paymentMethod: string; // "Visa", "Yape", etc.
  chargeId: string;
  planTitle: string;
  vehicleLabel: string;
}

export async function sendPaymentConfirmationEmail(
  opts: PaymentConfirmationOptions
): Promise<void> {
  const resend = getResendClient();

  const subject = `✅ Pago confirmado — Reserva #${opts.bookingId}`;
  const amountFormatted = `S/ ${opts.amount.toFixed(2)}`;

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
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#131211;padding:32px 40px;text-align:center;">
              <img src="https://verificarlo.com/assets/images/verificarlo-logo.png"
                   alt="VerifiCARLO" height="32" style="display:block;margin:0 auto;" />
            </td>
          </tr>

          <!-- Success badge -->
          <tr>
            <td style="padding:40px 40px 0;text-align:center;">
              <div style="display:inline-block;background:#dcfce7;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;">✅</div>
              <h1 style="margin:20px 0 8px;font-size:24px;font-weight:700;color:#111827;">
                ¡Pago confirmado!
              </h1>
              <p style="margin:0;color:#6b7280;font-size:15px;">
                Hola ${opts.clientName}, tu pago fue procesado exitosamente.
              </p>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                <tr style="background:#f9fafb;">
                  <td colspan="2" style="padding:16px 20px;font-size:13px;font-weight:600;
                    color:#374151;text-transform:uppercase;letter-spacing:0.05em;">
                    Detalles del pago
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;font-size:14px;color:#6b7280;border-top:1px solid #f3f4f6;">Reserva</td>
                  <td style="padding:12px 20px;font-size:14px;font-weight:600;color:#111827;text-align:right;border-top:1px solid #f3f4f6;">#${opts.bookingId}</td>
                </tr>
                <tr style="background:#f9fafb;">
                  <td style="padding:12px 20px;font-size:14px;color:#6b7280;">Plan</td>
                  <td style="padding:12px 20px;font-size:14px;font-weight:600;color:#111827;text-align:right;">${opts.planTitle}</td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;font-size:14px;color:#6b7280;border-top:1px solid #f3f4f6;">Vehículo</td>
                  <td style="padding:12px 20px;font-size:14px;font-weight:600;color:#111827;text-align:right;border-top:1px solid #f3f4f6;">${opts.vehicleLabel}</td>
                </tr>
                <tr style="background:#f9fafb;">
                  <td style="padding:12px 20px;font-size:14px;color:#6b7280;">Método de pago</td>
                  <td style="padding:12px 20px;font-size:14px;font-weight:600;color:#111827;text-align:right;">${opts.paymentMethod}</td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;font-size:15px;font-weight:700;color:#111827;border-top:1px solid #e5e7eb;">Total</td>
                  <td style="padding:16px 20px;font-size:18px;font-weight:700;color:#16a34a;text-align:right;border-top:1px solid #e5e7eb;">${amountFormatted}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 40px;text-align:center;">
              <a href="https://verificarlo.com/mis-inspecciones"
                style="display:inline-block;background:#FBBF24;color:#111827;font-weight:700;
                font-size:15px;padding:14px 32px;border-radius:100px;text-decoration:none;">
                Ver mis inspecciones
              </a>
              <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">
                ID de transacción: ${opts.chargeId}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;
              border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © 2025 VerifiCARLO — Cerro Azul 421, Santiago de Surco, Lima
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
    to: opts.to,
    subject,
    html,
  });
}
