interface InspectionCompleteProps {
  clientName: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  verdict: string;
  bookingId: number;
  pdfDownloadUrl?: string;
}

export function getInspectionCompleteHtml({
  clientName,
  vehiclePlate,
  vehicleBrand,
  vehicleModel,
  vehicleYear,
  verdict,
  bookingId,
  pdfDownloadUrl,
}: InspectionCompleteProps): string {
  const reportUrl = `https://verificarlo.com/mis-inspecciones/${bookingId}`;

  const verdictColors: Record<string, { bg: string; text: string }> = {
    APROBADO: { bg: '#22c55e', text: '#ffffff' },
    OBSERVADO: { bg: '#f59e0b', text: '#1a1a1a' },
    NO_APROBADO: { bg: '#ef4444', text: '#ffffff' },
  };

  const verdictLabels: Record<string, string> = {
    APROBADO: 'Aprobado',
    OBSERVADO: 'Observado',
    NO_APROBADO: 'No Aprobado',
  };

  const colors = verdictColors[verdict] || verdictColors.OBSERVADO;
  const label = verdictLabels[verdict] || verdict;

  const pdfButton = pdfDownloadUrl ? `
              <div style="text-align:center;margin:15px 0 30px;">
                <a href="${pdfDownloadUrl}" style="background:#1a1a1a;color:#FFD700;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;">
                  Descargar PDF del informe
                </a>
              </div>` : '';

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
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px;background:#ffffff;">
              <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 20px;line-height:1.3;">
                ¡Tu inspección mecánica está lista!
              </h1>

              <p style="font-size:16px;color:#333;line-height:1.6;margin:0 0 20px;">
                Hola ${clientName},
              </p>

              <p style="font-size:16px;color:#333;line-height:1.6;margin:0 0 25px;">
                El informe de inspección de tu vehículo <strong>${vehicleBrand} ${vehicleModel} ${vehicleYear}</strong> (placa: <strong>${vehiclePlate}</strong>) ha sido completado.
              </p>

              <!-- Verdict -->
              <div style="text-align:center;margin:25px 0;">
                <span style="background:${colors.bg};color:${colors.text};padding:10px 24px;border-radius:8px;font-weight:bold;font-size:18px;display:inline-block;">
                  Resultado: ${label}
                </span>
              </div>

              ${pdfButton}

              <div style="text-align:center;margin:15px 0;">
                <a href="${reportUrl}" style="background:#FFD700;color:#1a1a1a;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;">
                  Ver informe en la plataforma
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1a1a1a;padding:20px;text-align:center;">
              <p style="color:#888;font-size:12px;margin:0 0 10px;">
                Recibiste este correo porque tienes una inspección activa con nosotros.
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
