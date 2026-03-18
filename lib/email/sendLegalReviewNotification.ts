/**
 * Enviar notificación de revisión legal pendiente a todos los admins
 */

import { db } from '@/lib/db';
import { sendEmail } from './resend';
import { LegalReviewPendingEmail } from './templates/LegalReviewPending';

interface NotificationData {
  reportId: number;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePlate?: string;
  clientName: string;
  inspectorName: string;
  inspectionDate: Date;
}

/**
 * Envía email de notificación a todos los administradores
 * cuando se completa una inspección y requiere revisión legal
 */
export async function sendLegalReviewNotification(data: NotificationData) {
  try {
    // Obtener todos los admins activos
    const admins = await db.user.findMany({
      where: {
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      select: {
        email: true,
        name: true,
      },
    });

    if (admins.length === 0) {
      console.warn('No hay administradores activos para notificar');
      return { success: true, sent: 0 };
    }

    const adminEmails = admins.map((admin: { email: string }) => admin.email);

    // Construir URL de revisión
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://verificarlo.pe';
    const reviewUrl = `${baseUrl}/admin/inspecciones/${data.reportId}/legal`;

    // Formatear fecha
    const inspectionDate = new Date(data.inspectionDate).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // Enviar email
    const result = await sendEmail({
      to: adminEmails,
      subject: `Nueva revisión legal pendiente: ${data.vehicleBrand} ${data.vehicleModel}`,
      react: LegalReviewPendingEmail({
        vehicleBrand: data.vehicleBrand,
        vehicleModel: data.vehicleModel,
        vehicleYear: data.vehicleYear,
        vehiclePlate: data.vehiclePlate,
        clientName: data.clientName,
        inspectorName: data.inspectorName,
        inspectionDate,
        reportId: data.reportId,
        reviewUrl,
      }),
    });

    if (result.success) {
      console.log(`Notificación de revisión legal enviada a ${adminEmails.length} admins`);
    }

    return { success: result.success, sent: adminEmails.length };
  } catch (error) {
    console.error('Error enviando notificación de revisión legal:', error);
    return { success: false, error };
  }
}
