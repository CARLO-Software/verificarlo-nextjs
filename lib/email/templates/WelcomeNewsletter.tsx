export function getWelcomeNewsletterHtml(email: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#FFD700;padding:20px;text-align:center;">
              <h1 style="margin:0;color:#1a1a1a;font-size:28px;font-weight:bold;">
                ¡Bienvenido a Verificarlo!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px;background:#ffffff;">
              <p style="font-size:16px;color:#333;line-height:1.6;margin:0 0 16px;">
                Hola,
              </p>

              <p style="font-size:16px;color:#333;line-height:1.6;margin:0 0 16px;">
                Gracias por suscribirte a nuestro newsletter. A partir de ahora recibirás:
              </p>

              <ul style="font-size:16px;color:#333;line-height:1.8;margin:0 0 16px;padding-left:20px;">
                <li>Consejos para comprar autos usados de forma segura</li>
                <li>Guías de mantenimiento vehicular</li>
                <li>Novedades sobre nuestros servicios de inspección</li>
                <li>Ofertas y promociones exclusivas</li>
              </ul>

              <p style="font-size:16px;color:#333;line-height:1.6;margin:0 0 24px;">
                En Verificarlo nos especializamos en inspecciones vehiculares profesionales
                para que compres tu auto usado con total tranquilidad.
              </p>

              <div style="text-align:center;margin:30px 0;">
                <a href="https://verificarlo.pe" style="background:#FFD700;color:#1a1a1a;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;">
                  Agenda tu inspección
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1a1a1a;padding:20px;text-align:center;">
              <p style="color:#888;font-size:12px;margin:0 0 10px;">
                Este correo fue enviado a ${email}
              </p>
              <p style="color:#888;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} Verificarlo - Inspecciones Vehiculares
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
