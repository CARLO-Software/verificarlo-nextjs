import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { InspectionResultStatus, PhotoCategory } from '@prisma/client';

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
  vinNumber?: string;
  engineNumber?: string;
  actualColor?: string;

  // Verificación de documentos
  ownershipCardVerified?: boolean;
  soatValid?: boolean;
  soatExpiryDate?: Date;
  technicalReviewValid?: boolean;
  technicalReviewExpiryDate?: Date;

  // Resumen
  executiveSummary?: string;
  recommendations?: string;
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
  category: PhotoCategory;
  label?: string;
}

// ============================================
// Verificar acceso de inspector
// ============================================

async function verifyInspectorAccess(bookingId: number) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const userId = Number(session.user.id);
  const userRole = session.user.role;

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

  // La inspección debe estar en estado CONFIRMED o COMPLETED
  if (!['CONFIRMED', 'COMPLETED'].includes(booking.status)) {
    throw new Error('La inspección debe estar confirmada para crear el informe');
  }

  return { booking, userId, isAdmin };
}

// ============================================
// CREATE - Crear informe de inspección
// ============================================

export async function createReport(input: CreateReportInput) {
  const { booking } = await verifyInspectorAccess(input.bookingId);

  // Verificar que no exista ya un informe
  const existingReport = await db.inspectionReport.findUnique({
    where: { bookingId: input.bookingId },
  });

  if (existingReport) {
    throw new Error('Ya existe un informe para esta inspección');
  }

  const report = await db.inspectionReport.create({
    data: {
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

export async function getReportByBookingId(bookingId: number) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const userId = Number(session.user.id);
  const userRole = session.user.role;

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

export async function updateReport(reportId: number, input: UpdateReportInput) {
  // Obtener el informe para verificar acceso
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    select: { bookingId: true, completedAt: true },
  });

  if (!report) {
    throw new Error('Informe no encontrado');
  }

  // Si el informe ya está completado, no se puede modificar (excepto admin)
  const session = await getServerSession(authOptions);
  if (report.completedAt && session?.user?.role !== 'ADMIN') {
    throw new Error('El informe ya está finalizado y no puede modificarse');
  }

  await verifyInspectorAccess(report.bookingId);

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
  if (input.vinNumber !== undefined) updateData.vinNumber = input.vinNumber;
  if (input.engineNumber !== undefined) updateData.engineNumber = input.engineNumber;
  if (input.actualColor !== undefined) updateData.actualColor = input.actualColor;

  // Verificación de documentos
  if (input.ownershipCardVerified !== undefined) updateData.ownershipCardVerified = input.ownershipCardVerified;
  if (input.soatValid !== undefined) updateData.soatValid = input.soatValid;
  if (input.soatExpiryDate !== undefined) updateData.soatExpiryDate = input.soatExpiryDate;
  if (input.technicalReviewValid !== undefined) updateData.technicalReviewValid = input.technicalReviewValid;
  if (input.technicalReviewExpiryDate !== undefined) updateData.technicalReviewExpiryDate = input.technicalReviewExpiryDate;

  // Resumen
  if (input.executiveSummary !== undefined) updateData.executiveSummary = input.executiveSummary;
  if (input.recommendations !== undefined) updateData.recommendations = input.recommendations;
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
  }
) {
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    select: { bookingId: true, completedAt: true },
  });

  if (!report) throw new Error('Informe no encontrado');
  if (report.completedAt) throw new Error('El informe ya está finalizado');

  await verifyInspectorAccess(report.bookingId);

  return db.inspectionReport.update({
    where: { id: reportId },
    data: {
      legalStatus: data.status,
      legalScore: data.score,
      legalObservations: data.observations,
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
  }
) {
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    select: { bookingId: true, completedAt: true },
  });

  if (!report) throw new Error('Informe no encontrado');
  if (report.completedAt) throw new Error('El informe ya está finalizado');

  await verifyInspectorAccess(report.bookingId);

  return db.inspectionReport.update({
    where: { id: reportId },
    data: {
      mechanicalStatus: data.status,
      mechanicalScore: data.score,
      mechanicalObservations: data.observations,
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
  }
) {
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    select: { bookingId: true, completedAt: true },
  });

  if (!report) throw new Error('Informe no encontrado');
  if (report.completedAt) throw new Error('El informe ya está finalizado');

  await verifyInspectorAccess(report.bookingId);

  return db.inspectionReport.update({
    where: { id: reportId },
    data: {
      bodyStatus: data.status,
      bodyScore: data.score,
      bodyObservations: data.observations,
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
    vinNumber?: string;
    engineNumber?: string;
    actualColor?: string;
  }
) {
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    select: { bookingId: true, completedAt: true },
  });

  if (!report) throw new Error('Informe no encontrado');
  if (report.completedAt) throw new Error('El informe ya está finalizado');

  await verifyInspectorAccess(report.bookingId);

  return db.inspectionReport.update({
    where: { id: reportId },
    data,
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
  }
) {
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    select: { bookingId: true, completedAt: true },
  });

  if (!report) throw new Error('Informe no encontrado');
  if (report.completedAt) throw new Error('El informe ya está finalizado');

  await verifyInspectorAccess(report.bookingId);

  return db.inspectionReport.update({
    where: { id: reportId },
    data,
  });
}

// ============================================
// COMPLETE - Finalizar informe
// ============================================

export async function completeReport(reportId: number) {
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    select: {
      bookingId: true,
      completedAt: true,
      legalStatus: true,
      mechanicalStatus: true,
      bodyStatus: true,
      legalScore: true,
      mechanicalScore: true,
      bodyScore: true,
    },
  });

  if (!report) throw new Error('Informe no encontrado');
  if (report.completedAt) throw new Error('El informe ya está finalizado');

  const { userId } = await verifyInspectorAccess(report.bookingId);

  // Validar que todas las secciones estén completadas
  if (report.legalStatus === 'PENDING') {
    throw new Error('La sección legal no ha sido completada');
  }
  if (report.mechanicalStatus === 'PENDING') {
    throw new Error('La sección mecánica no ha sido completada');
  }
  if (report.bodyStatus === 'PENDING') {
    throw new Error('La sección de carrocería no ha sido completada');
  }

  // Calcular puntaje general (promedio ponderado)
  const legalWeight = 0.2;
  const mechanicalWeight = 0.5;
  const bodyWeight = 0.3;

  const overallScore = Math.round(
    (report.legalScore || 0) * legalWeight +
    (report.mechanicalScore || 0) * mechanicalWeight +
    (report.bodyScore || 0) * bodyWeight
  );

  // Determinar estado general
  let overallStatus: InspectionResultStatus = 'OK';
  if (
    report.legalStatus === 'CRITICAL' ||
    report.mechanicalStatus === 'CRITICAL' ||
    report.bodyStatus === 'CRITICAL'
  ) {
    overallStatus = 'CRITICAL';
  } else if (
    report.legalStatus === 'WARNING' ||
    report.mechanicalStatus === 'WARNING' ||
    report.bodyStatus === 'WARNING'
  ) {
    overallStatus = 'WARNING';
  }

  // Obtener nombre del inspector para la firma
  const inspector = await db.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  // Actualizar informe y booking en una transacción
  const [updatedReport] = await db.$transaction([
    db.inspectionReport.update({
      where: { id: reportId },
      data: {
        overallScore,
        overallStatus,
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
  ]);

  return updatedReport;
}

// ============================================
// PHOTOS - Agregar foto
// ============================================

export async function addPhoto(input: AddPhotoInput) {
  const report = await db.inspectionReport.findUnique({
    where: { id: input.reportId },
    select: { bookingId: true, completedAt: true },
  });

  if (!report) throw new Error('Informe no encontrado');
  if (report.completedAt) throw new Error('El informe ya está finalizado');

  await verifyInspectorAccess(report.bookingId);

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
      category: input.category,
      label: input.label,
      sortOrder: (lastPhoto?.sortOrder || 0) + 1,
    },
  });

  return photo;
}

// ============================================
// PHOTOS - Eliminar foto
// ============================================

export async function deletePhoto(photoId: number) {
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

  await verifyInspectorAccess(photo.report.bookingId);

  await db.inspectionPhoto.delete({
    where: { id: photoId },
  });

  return { success: true };
}

// ============================================
// PHOTOS - Obtener fotos del informe
// ============================================

export async function getReportPhotos(reportId: number) {
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    select: { bookingId: true },
  });

  if (!report) throw new Error('Informe no encontrado');

  // Verificar acceso básico
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
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

export async function getInspectorPendingInspections() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Usuario no autenticado');
  }

  if (session.user.role !== 'INSPECTOR' && session.user.role !== 'ADMIN') {
    throw new Error('No autorizado');
  }

  const userId = Number(session.user.id);

  const bookings = await db.booking.findMany({
    where: {
      inspectorId: userId,
      status: 'CONFIRMED',
    },
    include: {
      client: {
        select: { id: true, name: true, phone: true },
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

export async function getInspectorCompletedInspections() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Usuario no autenticado');
  }

  if (session.user.role !== 'INSPECTOR' && session.user.role !== 'ADMIN') {
    throw new Error('No autorizado');
  }

  const userId = Number(session.user.id);

  const bookings = await db.booking.findMany({
    where: {
      inspectorId: userId,
      status: 'COMPLETED',
    },
    include: {
      client: {
        select: { id: true, name: true },
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
