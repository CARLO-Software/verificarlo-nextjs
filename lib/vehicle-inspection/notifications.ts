/**
 * Servicio de notificaciones para inspecciones de vehículos.
 *
 * Cada función crea registros in-app en la tabla Notification
 * y opcionalmente dispara un email vía Resend.
 *
 * Reglas de destinatarios:
 *  - NUEVA_INSPECCION / LEGAL_DESBLOQUEADO → todos los ADMIN activos
 *  - MECANICO_ASIGNADO                     → solo el mecánico asignado
 *  - INSPECCION_COMPLETADA                 → solo el cliente
 */

import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";
import { sendEmail } from "@/lib/email/resend";

// ============================================
// HELPERS INTERNOS
// ============================================

/**
 * Formatea fecha y hora para mostrar en notificaciones
 * Ej: "25 mar 2026 a las 10:00"
 */
function formatSchedule(date: string, time: string): string {
  const dateObj = new Date(date);
  const day = dateObj.getUTCDate();
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const month = months[dateObj.getUTCMonth()];
  const year = dateObj.getUTCFullYear();
  return `${day} ${month} ${year} a las ${time}`;
}

async function createInAppNotifications(
  userIds: string[],
  payload: {
    type: NotificationType;
    title: string;
    message: string;
    inspectionId: number;
  }
) {
  if (userIds.length === 0) return;
  await db.notification.createMany({
    data: userIds.map((userId) => ({ ...payload, userId })),
  });
}

async function getActiveAdminIds(): Promise<string[]> {
  const admins = await db.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true, email: true },
  });
  return admins.map((a) => a.id);
}

async function getActiveAdminEmails(): Promise<string[]> {
  const admins = await db.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { email: true },
  });
  return admins.map((a) => a.email);
}

// ============================================
// EVENTO: Nueva inspección con placa
// → notifica a TODOS los admins
// ============================================

export async function notifyNewInspectionWithPlate(params: {
  inspectionId: number;
  plate: string;
  vehicleDescription: string; // Ej: "Toyota Corolla 2019"
  clientName: string;
  scheduledDate?: string; // Ej: "2026-03-25"
  scheduledTime?: string; // Ej: "10:00"
}) {
  const { inspectionId, plate, vehicleDescription, clientName, scheduledDate, scheduledTime } = params;

  const adminIds = await getActiveAdminIds();
  const adminEmails = await getActiveAdminEmails();

  // Formatear fecha y hora para el mensaje
  const scheduleInfo = scheduledDate && scheduledTime
    ? ` — Cita: ${formatSchedule(scheduledDate, scheduledTime)}`
    : "";

  // In-app
  await createInAppNotifications(adminIds, {
    type: "NUEVA_INSPECCION",
    title: "Nueva inspección legal disponible",
    message: `${vehicleDescription} (${plate}) — Cliente: ${clientName}${scheduleInfo}. El caso está listo para ser tomado.`,
    inspectionId,
  });

  // Email (no bloqueante — fallo silencioso para no romper el flujo)
  const emailScheduleInfo = scheduledDate && scheduledTime
    ? `\nFecha de cita: ${formatSchedule(scheduledDate, scheduledTime)}`
    : "";

  sendEmail({
    to: adminEmails,
    subject: `Nueva inspección legal: ${vehicleDescription} (${plate})`,
    react: null, // TODO: crear template NewInspectionEmail si se requiere
    text: `Hay una nueva inspección legal disponible.\n\nVehículo: ${vehicleDescription}\nPlaca: ${plate}\nCliente: ${clientName}${emailScheduleInfo}\n\nIngresa al panel para tomar el caso.`,
  }).catch((err) =>
    console.error("[notify] Error enviando email NUEVA_INSPECCION:", err)
  );
}

// ============================================
// EVENTO: Mecánico registra placa (sin desbloqueo)
// → notifica a TODOS los admins
// ============================================

export async function notifyPlateRegisteredByMechanic(params: {
  inspectionId: number;
  plate: string;
  vehicleDescription: string;
  mechanicName: string;
}) {
  const { inspectionId, plate, vehicleDescription, mechanicName } = params;

  const adminIds = await getActiveAdminIds();
  const adminEmails = await getActiveAdminEmails();

  // In-app
  await createInAppNotifications(adminIds, {
    type: "NUEVA_INSPECCION",
    title: "Placa registrada por mecánico",
    message: `${vehicleDescription} (${plate}) — El mecánico ${mechanicName} registró la placa faltante del cliente.`,
    inspectionId,
  });

  // Email
  sendEmail({
    to: adminEmails,
    subject: `Placa registrada: ${vehicleDescription} (${plate})`,
    react: null,
    text: `El mecánico ${mechanicName} registró la placa de un vehículo.\n\nVehículo: ${vehicleDescription}\nPlaca registrada: ${plate}\n\nEsta placa fue ingresada porque el cliente no la proporcionó.`,
  }).catch((err) =>
    console.error("[notify] Error enviando email PLACA_REGISTRADA:", err)
  );
}

// ============================================
// EVENTO: Mecánico registra placa (desbloqueo legal)
// → notifica a TODOS los admins
// ============================================

export async function notifyLegalUnlocked(params: {
  inspectionId: number;
  plate: string;
  vehicleDescription: string;
  mechanicName: string;
}) {
  const { inspectionId, plate, vehicleDescription, mechanicName } = params;

  const adminIds = await getActiveAdminIds();
  const adminEmails = await getActiveAdminEmails();

  // In-app
  await createInAppNotifications(adminIds, {
    type: "LEGAL_DESBLOQUEADO",
    title: "Inspección legal desbloqueada",
    message: `${vehicleDescription} (${plate}) — El mecánico ${mechanicName} registró la placa. El caso ya puede ser tomado.`,
    inspectionId,
  });

  // Email
  sendEmail({
    to: adminEmails,
    subject: `Inspección legal desbloqueada: ${vehicleDescription} (${plate})`,
    react: null,
    text: `La inspección legal fue desbloqueada.\n\nVehículo: ${vehicleDescription}\nPlaca registrada: ${plate}\nPor el mecánico: ${mechanicName}\n\nIngresa al panel para tomar el caso.`,
  }).catch((err) =>
    console.error("[notify] Error enviando email LEGAL_DESBLOQUEADO:", err)
  );
}

// ============================================
// EVENTO: Mecánico asignado automáticamente
// → notifica solo al mecánico
// ============================================

export async function notifyMechanicAssigned(params: {
  inspectionId: number;
  mechanicId: string;
  vehicleDescription: string;
  clientName: string;
  scheduledDate?: string;
  scheduledTime?: string;
}) {
  const { inspectionId, mechanicId, vehicleDescription, clientName, scheduledDate, scheduledTime } = params;

  // Formatear fecha y hora para el mensaje
  const scheduleInfo = scheduledDate && scheduledTime
    ? ` — Cita: ${formatSchedule(scheduledDate, scheduledTime)}`
    : "";

  // In-app
  await createInAppNotifications([mechanicId], {
    type: "MECANICO_ASIGNADO",
    title: "Nueva inspección mecánica asignada",
    message: `Se te asignó la inspección de ${vehicleDescription} — Cliente: ${clientName}${scheduleInfo}.`,
    inspectionId,
  });

  // Email al mecánico
  const mechanic = await db.user.findUnique({
    where: { id: mechanicId },
    select: { email: true },
  });

  if (mechanic) {
    const emailScheduleInfo = scheduledDate && scheduledTime
      ? `\nFecha de cita: ${formatSchedule(scheduledDate, scheduledTime)}`
      : "";

    sendEmail({
      to: [mechanic.email],
      subject: `Nueva inspección asignada: ${vehicleDescription}`,
      react: null,
      text: `Se te asignó una nueva inspección mecánica.\n\nVehículo: ${vehicleDescription}\nCliente: ${clientName}${emailScheduleInfo}\n\nIngresa al panel para ver los detalles.`,
    }).catch((err) =>
      console.error("[notify] Error enviando email MECANICO_ASIGNADO:", err)
    );
  }
}

// ============================================
// EVENTO: Inspección completada (ambos procesos)
// → notifica solo al cliente
// ============================================

export async function notifyInspectionCompleted(params: {
  inspectionId: number;
  clientId: string;
  vehicleDescription: string;
}) {
  const { inspectionId, clientId, vehicleDescription } = params;

  // In-app
  await createInAppNotifications([clientId], {
    type: "INSPECCION_COMPLETADA",
    title: "Tu inspección está lista",
    message: `La inspección de ${vehicleDescription} fue completada. Ya puedes ver el informe.`,
    inspectionId,
  });

  // Email al cliente
  const client = await db.user.findUnique({
    where: { id: clientId },
    select: { email: true },
  });

  if (client) {
    sendEmail({
      to: [client.email],
      subject: `Inspección completada: ${vehicleDescription}`,
      react: null,
      text: `Tu inspección de ${vehicleDescription} fue completada. Ingresa a la plataforma para ver el informe completo.`,
    }).catch((err) =>
      console.error("[notify] Error enviando email INSPECCION_COMPLETADA:", err)
    );
  }
}
