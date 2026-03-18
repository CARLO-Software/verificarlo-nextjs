/**
 * Cliente de Resend para envío de emails
 */

import { Resend } from 'resend';

// Cliente singleton
let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn('RESEND_API_KEY no está configurado - emails no serán enviados');
      // Retornar un mock que no hace nada para evitar errores
      return {
        emails: {
          send: async () => {
            console.log('[Email Mock] Email would be sent if RESEND_API_KEY was configured');
            return { data: null, error: null };
          },
        },
      } as unknown as Resend;
    }

    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

// Dirección de envío por defecto
export const EMAIL_FROM = process.env.EMAIL_FROM || 'Verificarlo <notificaciones@verificarlo.pe>';

/**
 * Enviar email usando Resend
 */
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
}) {
  const resend = getResendClient();

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      ...options,
    });

    if (error) {
      console.error('Error enviando email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Error enviando email:', err);
    return { success: false, error: err };
  }
}
