interface BlogNewsletterProps {
  title: string;
  excerpt: string;
  coverImage: string;
  slug: string;
  author: string;
}

export function getBlogNewsletterHtml({
  title,
  excerpt,
  coverImage,
  slug,
  author,
}: BlogNewsletterProps): string {
  const blogUrl = `https://verificarlo.com/blog/${slug}`;

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
            <td style="background:#FFD700;padding:15px 20px;text-align:center;">
              <span style="font-size:20px;font-weight:bold;color:#1a1a1a;">Verificarlo</span>
              <span style="font-size:14px;color:#333;margin-left:10px;">| Newsletter</span>
            </td>
          </tr>

          <!-- Cover Image -->
          <tr>
            <td style="padding:0;">
              <img src="${coverImage}" alt="${title}" style="width:100%;height:auto;display:block;" />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px;background:#ffffff;">
              <h1 style="font-size:24px;color:#1a1a1a;margin:0 0 15px;line-height:1.3;">
                ${title}
              </h1>

              <p style="font-size:14px;color:#666;margin:0 0 20px;">
                Por ${author}
              </p>

              <p style="font-size:16px;color:#333;line-height:1.6;margin:0 0 25px;">
                ${excerpt}
              </p>

              <div style="text-align:center;margin:30px 0;">
                <a href="${blogUrl}" style="background:#FFD700;color:#1a1a1a;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;">
                  Leer artículo completo
                </a>
              </div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 30px;">
              <hr style="border:none;border-top:1px solid #eee;margin:0;" />
            </td>
          </tr>

          <!-- CTA Section -->
          <tr>
            <td style="padding:25px 30px;background:#f9f9f9;text-align:center;">
              <p style="font-size:15px;color:#333;margin:0 0 15px;">
                ¿Vas a comprar un auto usado? Asegúrate de que esté en buen estado.
              </p>
              <a href="https://verificarlo.com" style="background:#1a1a1a;color:#FFD700;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;display:inline-block;">
                Agenda tu inspección
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1a1a1a;padding:20px;text-align:center;">
              <p style="color:#888;font-size:12px;margin:0 0 10px;">
                Recibiste este correo porque estás suscrito a nuestro newsletter.
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
