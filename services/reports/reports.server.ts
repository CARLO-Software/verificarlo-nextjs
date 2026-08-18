import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-jwt';
import { InspectionResultStatus, PhotoCategory } from '@prisma/client';
import { generateInspectionPDF, uploadPDFToCloudinary } from '@/lib/pdf';
import { cloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';
import { createLegalReport } from '@/services/legalReport/legalReport.server';
import { sendLegalReviewNotification } from '@/lib/email/sendLegalReviewNotification';
import { sendEmail } from '@/lib/email/resend';
import { getInspectionCompleteHtml } from '@/lib/email/templates/InspectionComplete';

// ============================================
// Tipos
// ============================================

export interface CreateReportInput {
  bookingId: number;
}

export interface UpdateReportInput {
  // Revisión Legal
  legalStatus?: InspectionResultStatus;
  legalScore?: number;
  legalObservations?: LegalObservation[];

  // Revisión Mecánica
  mechanicalStatus?: InspectionResultStatus;
  mechanicalScore?: number;
  mechanicalObservations?: MechanicalObservation[];

  // Revisión Carrocería
  bodyStatus?: InspectionResultStatus;
  bodyScore?: number;
  bodyObservations?: BodyObservation[];

  // Datos del vehículo
  mileageAtInspection?: number;

  // Verificación de documentos
  ownershipCardVerified?: boolean;
  soatValid?: boolean;
  soatExpiryDate?: Date;
  technicalReviewValid?: boolean;
  technicalReviewExpiryDate?: Date;

  // Resumen
  executiveSummary?: string;
  estimatedRepairCost?: number;
}

export interface LegalObservation {
  item: string;
  status: 'OK' | 'WARNING' | 'CRITICAL';
  note?: string;
}

export interface MechanicalObservation {
  category: string;
  item: string;
  status: 'OK' | 'WARNING' | 'CRITICAL';
  note?: string;
}

export interface BodyObservation {
  area: string;
  issue: string;
  severity: 'minor' | 'moderate' | 'severe';
  note?: string;
}

export interface AddPhotoInput {
  reportId: number;
  url: string;
  thumbnailUrl?: string;
  category?: PhotoCategory;  // Opcional, default DAMAGE
  label?: string;
  checklistItemId?: string;  // ID del item del checklist (ej: "mec-sonidos-motor")
}

// ============================================
// Verificar acceso de inspector
// ============================================

async function verifyInspectorAccess(bookingId: number, request?: Request) {
  const user = await getAuthUser(request);

  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const userId = user.id;
  const userRole = user.role;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      inspectorId: true,
    },
  });

  if (!booking) {
    throw new Error('Reserva no encontrada');
  }
  
  // Solo el inspector asignado o un admin pueden modificar el informe
  const isAssignedInspector = booking.inspectorId === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isAssignedInspector && !isAdmin) {
    throw new Error('No autorizado para modificar este informe');
  }

  // La inspección debe estar en estado PAID o COMPLETED
  if (!['PAID', 'COMPLETED'].includes(booking.status)) {
    throw new Error('La inspección debe estar pagada para crear el informe');
  }

  return { booking, userId, isAdmin };
}

// ============================================
// CREATE - Crear informe de inspección
// ============================================

export async function createReport(input: CreateReportInput, request?: Request) {
  const { booking } = await verifyInspectorAccess(input.bookingId, request);

  // Usar upsert para evitar race conditions
  const report = await db.inspectionReport.upsert({
    where: { bookingId: input.bookingId },
    update: {}, // No actualizar nada si ya existe
    create: {
      bookingId: input.bookingId,
      legalStatus: 'PENDING',
      mechanicalStatus: 'PENDING',
      bodyStatus: 'PENDING',
      overallStatus: 'PENDING',
    },
  });

  return report;
}

// ============================================
// GET - Obtener informe por booking ID
// ============================================

export async function getReportByBookingId(bookingId: number, request?: Request) {
  const user = await getAuthUser(request);

  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const userId = user.id;
  const userRole = user.role;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      clientId: true,
      inspectorId: true,
    },
  });

  if (!booking) {
    throw new Error('Reserva no encontrada');
  }

  // Verificar acceso: cliente, inspector asignado o admin
  const isOwner = booking.clientId === userId;
  const isAssignedInspector = booking.inspectorId === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isOwner && !isAssignedInspector && !isAdmin) {
    throw new Error('No autorizado');
  }

  const report = await db.inspectionReport.findUnique({
    where: { bookingId },
    include: {
      photos: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  return report;
}

// ============================================
// UPDATE - Actualizar informe
// ============================================

export async function updateReport(reportId: number, input: UpdateReportInput, request?: Request) {
  // Obtener el informe para verificar acceso
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    select: { bookingId: true, completedAt: true },
  });

  if (!report) {
    throw new Error('Informe no encontrado');
  }

  // Si el informe ya está completado, no se puede modificar (excepto admin)
  const user = await getAuthUser(request);
  if (report.completedAt && user?.role !== 'ADMIN') {
    throw new Error('El informe ya está finalizado y no puede modificarse');
  }

  await verifyInspectorAccess(report.bookingId, request);

  const updateData: any = {};

  // Revisión Legal
  if (input.legalStatus !== undefined) updateData.legalStatus = input.legalStatus;
  if (input.legalScore !== undefined) updateData.legalScore = input.legalScore;
  if (input.legalObservations !== undefined) updateData.legalObservations = input.legalObservations;

  // Revisión Mecánica
  if (input.mechanicalStatus !== undefined) updateData.mechanicalStatus = input.mechanicalStatus;
  if (input.mechanicalScore !== undefined) updateData.mechanicalScore = input.mechanicalScore;
  if (input.mechanicalObservations !== undefined) updateData.mechanicalObservations = input.mechanicalObservations;

  // Revisión Carrocería
  if (input.bodyStatus !== undefined) updateData.bodyStatus = input.bodyStatus;
  if (input.bodyScore !== undefined) updateData.bodyScore = input.bodyScore;
  if (input.bodyObservations !== undefined) updateData.bodyObservations = input.bodyObservations;

  // Datos del vehículo
  if (input.mileageAtInspection !== undefined) updateData.mileageAtInspection = input.mileageAtInspection;

  // Verificación de documentos
  if (input.ownershipCardVerified !== undefined) updateData.ownershipCardVerified = input.ownershipCardVerified;
  if (input.soatValid !== undefined) updateData.soatValid = input.soatValid;
  if (input.soatExpiryDate !== undefined) updateData.soatExpiryDate = input.soatExpiryDate;
  if (input.technicalReviewValid !== undefined) updateData.technicalReviewValid = input.technicalReviewValid;
  if (input.technicalReviewExpiryDate !== undefined) updateData.technicalReviewExpiryDate = input.technicalReviewExpiryDate;

  // Resumen
  if (input.executiveSummary !== undefined) updateData.executiveSummary = input.executiveSummary;
  if (input.estimatedRepairCost !== undefined) updateData.estimatedRepairCost = input.estimatedRepairCost;

  const updatedReport = await db.inspectionReport.update({
    where: { id: reportId },
    data: updateData,
  });

  return updatedReport;
}

// ============================================
// UPDATE - Actualizar sección legal
// ============================================

export async function updateLegalSection(
  reportId: number,
  data: {
    status: InspectionResultStatus;
    score: number;
    observations: LegalObservation[];
  },
  request?: Request
) {
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    select: { bookingId: true, completedAt: true },
  });

  if (!report) throw new Error('Informe no encontrado');
  if (report.completedAt) throw new Error('El informe ya está finalizado');

  await verifyInspectorAccess(report.bookingId, request);

  return db.inspectionReport.update({
    where: { id: reportId },
    data: {
      legalStatus: data.status,
      legalScore: data.score,
      legalObservations: JSON.parse(JSON.stringify(data.observations)),
    },
  });
}

// ============================================
// UPDATE - Actualizar sección mecánica
// ============================================

export async function updateMechanicalSection(
  reportId: number,
  data: {
    status: InspectionResultStatus;
    score: number;
    observations: MechanicalObservation[];
  },
  request?: Request
) {
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    select: { bookingId: true, completedAt: true },
  });

  if (!report) throw new Error('Informe no encontrado');
  if (report.completedAt) throw new Error('El informe ya está finalizado');

  await verifyInspectorAccess(report.bookingId, request);

  return db.inspectionReport.update({
    where: { id: reportId },
    data: {
      mechanicalStatus: data.status,
      mechanicalScore: data.score,
      mechanicalObservations: JSON.parse(JSON.stringify(data.observations)),
    },
  });
}

// ============================================
// UPDATE - Actualizar sección carrocería
// ============================================

export async function updateBodySection(
  reportId: number,
  data: {
    status: InspectionResultStatus;
    score: number;
    observations: BodyObservation[];
  },
  request?: Request
) {
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    select: { bookingId: true, completedAt: true },
  });

  if (!report) throw new Error('Informe no encontrado');
  if (report.completedAt) throw new Error('El informe ya está finalizado');

  await verifyInspectorAccess(report.bookingId, request);

  return db.inspectionReport.update({
    where: { id: reportId },
    data: {
      bodyStatus: data.status,
      bodyScore: data.score,
      bodyObservations: JSON.parse(JSON.stringify(data.observations)),
    },
  });
}

// ============================================
// UPDATE - Actualizar datos del vehículo
// ============================================

export async function updateVehicleData(
  reportId: number,
  data: {
    mileageAtInspection?: number;
  },
  request?: Request
) {
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    select: { bookingId: true, completedAt: true },
  });

  if (!report) throw new Error('Informe no encontrado');
  if (report.completedAt) throw new Error('El informe ya está finalizado');

  await verifyInspectorAccess(report.bookingId, request);

  return db.inspectionReport.update({
    where: { id: reportId },
    data,
  });
}

// ============================================
// UPDATE - Actualizar checklist de inspección
// ============================================

export interface ChecklistItemResult {
  status: "OK" | "OBSERVACION" | "DEFECTO" | "NO_APLICA" | null;
  comment?: string;
}

export type ChecklistResults = Record<string, ChecklistItemResult>;

export async function updateChecklistResults(
  reportId: number,
  data: {
    checklistResults: ChecklistResults;
  },
  request?: Request
) {
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    select: { bookingId: true, completedAt: true },
  });

  if (!report) throw new Error('Informe no encontrado');
  if (report.completedAt) throw new Error('El informe ya está finalizado');

  await verifyInspectorAccess(report.bookingId, request);

  return db.inspectionReport.update({
    where: { id: reportId },
    data: {
      checklistResults: JSON.parse(JSON.stringify(data.checklistResults)),
    },
  });
}

// ============================================
// UPDATE - Actualizar documentos verificados
// ============================================

export async function updateDocumentsVerification(
  reportId: number,
  data: {
    ownershipCardVerified?: boolean;
    soatValid?: boolean;
    soatExpiryDate?: Date;
    technicalReviewValid?: boolean;
    technicalReviewExpiryDate?: Date;
  },
  request?: Request
) {
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    select: { bookingId: true, completedAt: true },
  });

  if (!report) throw new Error('Informe no encontrado');
  if (report.completedAt) throw new Error('El informe ya está finalizado');

  await verifyInspectorAccess(report.bookingId, request);

  return db.inspectionReport.update({
    where: { id: reportId },
    data,
  });
}

// ============================================
// COMPLETE - Finalizar informe
// ============================================

// Categorías del checklist para validación
const CHECKLIST_CATEGORIES = ['legal', 'mecanica', 'carroceria', 'interior'];

// Mapeo de prefijos de items a categorías
const CATEGORY_PREFIXES: Record<string, string> = {
  'legal-': 'legal',
  'mec-': 'mecanica',
  'car-': 'carroceria',
  'int-': 'interior',
};

function calculateScoresFromChecklist(checklistResults: ChecklistResults): {
  byCategory: Record<string, { score: number; status: InspectionResultStatus; completed: number }>;
  overall: { score: number; status: InspectionResultStatus };
} {
  const byCategory: Record<string, { ok: number; obs: number; def: number; completed: number }> = {
    legal: { ok: 0, obs: 0, def: 0, completed: 0 },
    mecanica: { ok: 0, obs: 0, def: 0, completed: 0 },
    carroceria: { ok: 0, obs: 0, def: 0, completed: 0 },
    interior: { ok: 0, obs: 0, def: 0, completed: 0 },
  };

  // Contar resultados por categoría
  for (const [itemId, result] of Object.entries(checklistResults)) {
    if (!result || result.status === null) continue;

    // Determinar categoría del item
    let category = 'legal';
    for (const [prefix, cat] of Object.entries(CATEGORY_PREFIXES)) {
      if (itemId.startsWith(prefix)) {
        category = cat;
        break;
      }
    }

    byCategory[category].completed++;

    switch (result.status) {
      case 'OK':
        byCategory[category].ok++;
        break;
      case 'OBSERVACION':
        byCategory[category].obs++;
        break;
      case 'DEFECTO':
        byCategory[category].def++;
        break;
      // NO_APLICA no cuenta para el score
    }
  }

  // Calcular score y status por categoría
  const categoryResults: Record<string, { score: number; status: InspectionResultStatus; completed: number }> = {};

  for (const [catId, counts] of Object.entries(byCategory)) {
    const aplicables = counts.ok + counts.obs + counts.def;
    const score = aplicables > 0
      ? Math.round(((counts.ok * 100) + (counts.obs * 50)) / aplicables)
      : 0;

    let status: InspectionResultStatus = 'PENDING';
    if (counts.completed > 0) {
      if (counts.def > 0) {
        status = 'CRITICAL';
      } else if (counts.obs > 0) {
        status = 'WARNING';
      } else if (counts.ok > 0) {
        status = 'OK';
      }
    }

    categoryResults[catId] = { score, status, completed: counts.completed };
  }

  // Calcular score general (promedio de categorías con items)
  const categoriesWithItems = Object.values(categoryResults).filter(c => c.completed > 0);
  const overallScore = categoriesWithItems.length > 0
    ? Math.round(categoriesWithItems.reduce((sum, c) => sum + c.score, 0) / categoriesWithItems.length)
    : 0;

  // Status general es el peor de todos
  let overallStatus: InspectionResultStatus = 'OK';
  for (const cat of categoriesWithItems) {
    if (cat.status === 'CRITICAL') {
      overallStatus = 'CRITICAL';
      break;
    } else if (cat.status === 'WARNING') {
      overallStatus = 'WARNING';
    }
  }

  if (categoriesWithItems.length === 0) {
    overallStatus = 'PENDING';
  }

  return {
    byCategory: categoryResults,
    overall: { score: overallScore, status: overallStatus },
  };
}

export interface CompleteReportInput {
  mechanicalVerdict?: 'APROBADO' | 'OBSERVADO' | 'NO_APROBADO';
  hasSiniestro?: boolean;
  hasKilometrajeAdulterado?: boolean;
  executiveSummary?: string;
  estimatedRepairCost?: number;
  mileageAtInspection?: number;
}

export async function completeReport(reportId: number, input?: CompleteReportInput, request?: Request) {
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    select: {
      bookingId: true,
      completedAt: true,
      checklistResults: true,
    },
  });

  if (!report) throw new Error('Informe no encontrado');
  if (report.completedAt) throw new Error('El informe ya está finalizado');

  const { userId } = await verifyInspectorAccess(report.bookingId, request);

  // Procesar veredicto del mecánico
  const hasSiniestro = input?.hasSiniestro ?? false;
  const hasKilometrajeAdulterado = input?.hasKilometrajeAdulterado ?? false;

  // Si hay siniestro o kilometraje adulterado, forzar NO_APROBADO
  let mechanicalVerdict = input?.mechanicalVerdict || 'PENDING';
  if (hasSiniestro || hasKilometrajeAdulterado) {
    mechanicalVerdict = 'NO_APROBADO';
  }

  // Validar que se haya seleccionado un veredicto
  if (mechanicalVerdict === 'PENDING') {
    throw new Error('Debe seleccionar un veredicto antes de finalizar');
  }

  // Validar que haya resultados del checklist
  const checklistResults = (report.checklistResults as unknown as ChecklistResults) || {};

  if (Object.keys(checklistResults).length === 0) {
    throw new Error('No se han completado items del checklist');
  }

  // Calcular scores desde el checklist
  const scores = calculateScoresFromChecklist(checklistResults);

  // Validar que todas las categorías tengan al menos algunos items completados
  for (const catId of CHECKLIST_CATEGORIES) {
    const catScore = scores.byCategory[catId];
    if (!catScore || catScore.completed === 0) {
      const categoryNames: Record<string, string> = {
        legal: 'Legal',
        mecanica: 'Mecánica',
        carroceria: 'Carrocería',
        interior: 'Interior',
      };
      throw new Error(`La sección ${categoryNames[catId]} no ha sido completada`);
    }
  }

  const overallScore = scores.overall.score;
  const overallStatus = scores.overall.status;

  // Obtener nombre del inspector para la firma
  const inspector = await db.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  // Obtener el booking para conseguir el vehicleId
  const booking = await db.booking.findUnique({
    where: { id: report.bookingId },
    select: { vehicleId: true, clientId: true },
  });

  // Obtener el VehicleInspection asociado al vehículo
  const vehicleInspection = booking ? await db.vehicleInspection.findFirst({
    where: {
      vehicleId: booking.vehicleId,
      clientId: booking.clientId,
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
  }) : null;

  // Actualizar informe, booking y vehicleInspection en una transacción
  const [updatedReport] = await db.$transaction([
    db.inspectionReport.update({
      where: { id: reportId },
      data: {
        // Scores por categoría (para compatibilidad)
        legalStatus: scores.byCategory.legal?.status || 'PENDING',
        legalScore: scores.byCategory.legal?.score || 0,
        mechanicalStatus: scores.byCategory.mecanica?.status || 'PENDING',
        mechanicalScore: scores.byCategory.mecanica?.score || 0,
        bodyStatus: scores.byCategory.carroceria?.status || 'PENDING',
        bodyScore: scores.byCategory.carroceria?.score || 0,
        // Score general
        overallScore,
        overallStatus,
        // Veredicto del mecánico
        mechanicalVerdict: mechanicalVerdict as 'APROBADO' | 'OBSERVADO' | 'NO_APROBADO',
        hasSiniestro,
        hasKilometrajeAdulterado,
        // Resumen ejecutivo (si se proporciona)
        ...(input?.executiveSummary !== undefined && { executiveSummary: input.executiveSummary || null }),
        ...(input?.estimatedRepairCost !== undefined && { estimatedRepairCost: input.estimatedRepairCost || null }),
        ...(input?.mileageAtInspection !== undefined && { mileageAtInspection: input.mileageAtInspection || null }),
        completedAt: new Date(),
        inspectorSignature: `Firmado digitalmente por ${inspector?.name || 'Inspector'} - ${new Date().toISOString()}`,
      },
    }),
    db.booking.update({
      where: { id: report.bookingId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    }),
    // Actualizar VehicleInspection.mechanicalStatus a COMPLETADO
    ...(vehicleInspection ? [
      db.vehicleInspection.update({
        where: { id: vehicleInspection.id },
        data: {
          mechanicalStatus: 'COMPLETADO',
          mechanicCompletedAt: new Date(),
        },
      }),
    ] : []),
  ]);

  // Generar PDF en segundo plano (no bloquea la respuesta)
  if (isCloudinaryConfigured()) {
    generateAndUploadPDF(reportId).catch((error) => {
      console.error('Error generando/subiendo PDF:', error);
    });
  }

  // Crear LegalReport y notificar a admins (en segundo plano)
  createLegalReportAndNotify(reportId).catch((error) => {
    console.error('Error creando LegalReport o enviando notificación:', error);
  });

  // Email al cliente notificando que su inspección está lista (en segundo plano)
  sendInspectionCompleteEmail(reportId, mechanicalVerdict).catch((error) => {
    console.error('Error enviando email de inspección completa:', error);
  });

  return updatedReport;
}

// Función auxiliar para generar y subir PDF
async function generateAndUploadPDF(reportId: number): Promise<void> {
  try {
    console.log(`Generando PDF para reporte ${reportId}...`);

    const { buffer, hash } = await generateInspectionPDF(reportId);
    console.log(`PDF generado (${buffer.length} bytes, hash: ${hash.substring(0, 16)}...)`);

    const { public_id } = await uploadPDFToCloudinary(buffer, reportId);
    console.log(`PDF subido a Cloudinary. Public ID: ${public_id}`);

    // Guardamos el public_id para generar URLs firmadas después
    await db.inspectionReport.update({
      where: { id: reportId },
      data: {
        pdfUrl: public_id,
        pdfHash: hash,
      },
    });

    console.log(`Public ID del PDF guardado en la base de datos para reporte ${reportId}`);
  } catch (error) {
    console.error(`Error en generateAndUploadPDF para reporte ${reportId}:`, error);
    throw error;
  }
}

async function sendInspectionCompleteEmail(reportId: number, verdict: string): Promise<void> {
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    select: {
      bookingId: true,
      booking: {
        select: {
          id: true,
          client: { select: { email: true, name: true } },
          vehicle: { select: { plate: true, year: true, model: { select: { name: true, brand: { select: { name: true } } } } } },
        },
      },
    },
  });

  if (!report?.booking?.client?.email) return;

  const { client, vehicle } = report.booking;

  const html = getInspectionCompleteHtml({
    clientName: client.name || 'Cliente',
    vehiclePlate: vehicle.plate || 'N/A',
    vehicleBrand: vehicle.model.brand.name,
    vehicleModel: vehicle.model.name,
    vehicleYear: vehicle.year,
    verdict,
    bookingId: report.bookingId,
  });

  await sendEmail({
    to: client.email,
    subject: 'Tu inspección mecánica está lista - Verificarlo',
    html,
  });
}

// Función auxiliar para crear LegalReport y notificar a admins
async function createLegalReportAndNotify(reportId: number): Promise<void> {
  try {
    console.log(`Creando LegalReport para reporte ${reportId}...`);

    // Crear el LegalReport
    await createLegalReport(reportId);
    console.log(`LegalReport creado para reporte ${reportId}`);

    // Obtener datos para la notificación
    const report = await db.inspectionReport.findUnique({
      where: { id: reportId },
      include: {
        booking: {
          include: {
            vehicle: {
              include: {
                model: {
                  include: { brand: true },
                },
              },
            },
            client: {
              select: { name: true },
            },
            inspector: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!report) {
      console.error(`Reporte ${reportId} no encontrado para notificación`);
      return;
    }

    // Enviar notificación por email a los admins
    await sendLegalReviewNotification({
      reportId,
      vehicleBrand: report.booking.vehicle.model.brand.name,
      vehicleModel: report.booking.vehicle.model.name,
      vehicleYear: report.booking.vehicle.year,
      vehiclePlate: report.booking.vehicle.plate || undefined,
      clientName: report.booking.client.name,
      inspectorName: report.booking.inspector?.name || 'Inspector',
      inspectionDate: report.booking.startTime,
    });

    console.log(`Notificación de revisión legal enviada para reporte ${reportId}`);
  } catch (error) {
    console.error(`Error en createLegalReportAndNotify para reporte ${reportId}:`, error);
    throw error;
  }
}

// ============================================
// PHOTOS - Agregar foto
// ============================================

export async function addPhoto(input: AddPhotoInput, request?: Request) {
  const report = await db.inspectionReport.findUnique({
    where: { id: input.reportId },
    select: { bookingId: true, completedAt: true },
  });

  if (!report) throw new Error('Informe no encontrado');
  if (report.completedAt) throw new Error('El informe ya está finalizado');

  await verifyInspectorAccess(report.bookingId, request);

  // Obtener el último sortOrder
  const lastPhoto = await db.inspectionPhoto.findFirst({
    where: { reportId: input.reportId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  const photo = await db.inspectionPhoto.create({
    data: {
      reportId: input.reportId,
      url: input.url,
      thumbnailUrl: input.thumbnailUrl,
      category: input.category || 'DAMAGE',
      label: input.label,
      checklistItemId: input.checklistItemId,
      sortOrder: (lastPhoto?.sortOrder || 0) + 1,
    },
  });

  return photo;
}

// ============================================
// PHOTOS - Eliminar foto
// ============================================

export async function deletePhoto(photoId: number, request?: Request) {
  const photo = await db.inspectionPhoto.findUnique({
    where: { id: photoId },
    include: {
      report: {
        select: { bookingId: true, completedAt: true },
      },
    },
  });

  if (!photo) throw new Error('Foto no encontrada');
  if (photo.report.completedAt) throw new Error('El informe ya está finalizado');

  await verifyInspectorAccess(photo.report.bookingId, request);

  // Intentar eliminar de Cloudinary si está configurado
  if (isCloudinaryConfigured() && photo.url.includes('cloudinary')) {
    try {
      // Extraer public_id de la URL de Cloudinary
      // URL típica: https://res.cloudinary.com/xxx/image/upload/v123/inspections/123/abc123.webp
      const urlParts = photo.url.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1) {
        // Tomar desde después de 'upload' y 'v123...' hasta el final, sin extensión
        const publicIdParts = urlParts.slice(uploadIndex + 2);
        const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, '');
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (err) {
      // Log pero no fallar si no se puede eliminar de Cloudinary
      console.error('Error eliminando imagen de Cloudinary:', err);
    }
  }

  await db.inspectionPhoto.delete({
    where: { id: photoId },
  });

  return { success: true };
}

// ============================================
// PHOTOS - Obtener fotos del informe
// ============================================

export async function getReportPhotos(reportId: number, request?: Request) {
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    select: { bookingId: true },
  });

  if (!report) throw new Error('Informe no encontrado');

  // Verificar acceso básico
  const user = await getAuthUser(request);
  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const photos = await db.inspectionPhoto.findMany({
    where: { reportId },
    orderBy: { sortOrder: 'asc' },
  });

  return photos;
}

// ============================================
// GET - Obtener inspecciones pendientes del inspector
// ============================================

export async function getInspectorPendingInspections(request?: Request) {
  const user = await getAuthUser(request);

  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  if (user.role !== 'INSPECTOR' && user.role !== 'ADMIN') {
    throw new Error('No autorizado');
  }

  const userId = user.id;

  const bookings = await db.booking.findMany({
    where: {
      inspectorId: userId,
      status: 'PAID',
    },
    include: {
      client: {
        select: { id: true, name: true, phone: true, address: true, district: true },
      },
      vehicle: {
        include: {
          model: {
            include: { brand: true },
          },
        },
      },
      inspectionPlan: {
        select: { id: true, type: true, title: true },
      },
      report: {
        select: { id: true, overallStatus: true },
      },
    },
    orderBy: { startTime: 'asc' },
  });

  return bookings;
}

// ============================================
// GET - Obtener inspecciones completadas del inspector
// ============================================

export async function getInspectorCompletedInspections(request?: Request) {
  const user = await getAuthUser(request);

  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  if (user.role !== 'INSPECTOR' && user.role !== 'ADMIN') {
    throw new Error('No autorizado');
  }

  const userId = user.id;

  const bookings = await db.booking.findMany({
    where: {
      inspectorId: userId,
      status: 'COMPLETED',
    },
    include: {
      client: {
        select: { id: true, name: true, address: true, district: true },
      },
      vehicle: {
        include: {
          model: {
            include: { brand: true },
          },
        },
      },
      inspectionPlan: {
        select: { id: true, type: true, title: true },
      },
      report: {
        select: {
          id: true,
          overallScore: true,
          overallStatus: true,
          completedAt: true,
        },
      },
    },
    orderBy: { completedAt: 'desc' },
  });

  return bookings;
}
