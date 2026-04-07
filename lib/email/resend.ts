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
export const EMAIL_FROM = process.env.EMAIL_FROM || 'Verificarlo <no-reply@verificarlo.com>';

/**
 * Enviar email usando Resend
 * Soporta contenido React o texto plano
 */
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  react?: React.ReactElement | null;
  text?: string;
}) {
  const resend = getResendClient();

  // Construir payload - al menos uno de react o text debe estar presente
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {
    from: EMAIL_FROM,
    to: options.to,
    subject: options.subject,
  };

  if (options.react) {
    payload.react = options.react;
  }

  if (options.text) {
    payload.text = options.text;
  }

  try {
    const { data, error } = await resend.emails.send(payload);

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
