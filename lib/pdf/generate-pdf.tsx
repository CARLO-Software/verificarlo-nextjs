// ============================================
// Generación de PDF del informe de inspección
// ============================================

import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { createHash } from 'crypto';
import { db } from '@/lib/db';
import InspectionReportPDF, { PDFReportData } from '@/app/components/PDF/InspectionReportPDF';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface GeneratePDFResult {
  buffer: Buffer;
  hash: string;
}

// Generar código del informe
function generateReportCode(bookingId: number, createdAt: Date): string {
  const year = createdAt.getFullYear();
  const paddedId = String(bookingId).padStart(4, '0');
  return `#INS-${year}-${paddedId}`;
}

// Formatear fecha para el PDF
function formatDate(date: Date): string {
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: es });
}

// Formatear fecha y hora para firma (usando timezone explícito de Lima)
function formatDateTime(date: Date): string {
  // Usar toLocaleString con timezone explícito para evitar problemas de conversión
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  const formatted = date.toLocaleString('es-PE', options);
  // Formato: "07/05/2026, 10:30" -> "07/05/2026 a las 10:30"
  return formatted.replace(',', ' a las');
}

// Obtener datos completos del reporte para el PDF
export async function getReportDataForPDF(reportId: number): Promise<PDFReportData | null> {
  const report = await db.inspectionReport.findUnique({
    where: { id: reportId },
    include: {
      booking: {
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          inspector: {
            select: {
              name: true,
            },
          },
          vehicle: {
            include: {
              model: {
                include: {
                  brand: true,
                },
              },
            },
          },
        },
      },
      photos: {
        orderBy: { createdAt: 'asc' },
        select: {
          url: true,
          checklistItemId: true,
        },
      },
    },
  });

  if (!report || !report.booking) {
    return null;
  }

  const { booking } = report;

  // Buscar VehicleInspection para obtener la placa del mecánico (si existe)
  const vehicleInspection = await db.vehicleInspection.findFirst({
    where: {
      vehicleId: booking.vehicle.id,
      clientId: booking.client.id,
    },
    select: {
      plate: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Usar placa del mecánico si existe, sino la del vehículo original
  const plateToUse = vehicleInspection?.plate || booking.vehicle.plate;

  // Construir categorías con scores
  const categories = [
    {
      name: 'Legal',
      score: report.legalScore || 0,
      status: report.legalStatus,
    },
    {
      name: 'Mecanica',
      score: report.mechanicalScore || 0,
      status: report.mechanicalStatus,
    },
    {
      name: 'Carroceria',
      score: report.bodyScore || 0,
      status: report.bodyStatus,
    },
  ];

  // Formatear fechas de documentos
  const soatExpiryDate = report.soatExpiryDate
    ? format(report.soatExpiryDate, 'dd/MM/yyyy')
    : null;

  const technicalReviewExpiryDate = report.technicalReviewExpiryDate
    ? format(report.technicalReviewExpiryDate, 'dd/MM/yyyy')
    : null;

  // Derivar estado de SOAT y revisión técnica desde el checklist
  const checklistResults = (report.checklistResults as Record<string, { status: string; comment?: string }>) || {};
  const soatFromChecklist = checklistResults['legal-soat'];
  const revTecnicaFromChecklist = checklistResults['legal-revision-tecnica'];

  // Si hay resultado en el checklist, usarlo; sino usar el campo del reporte
  const soatValid = soatFromChecklist
    ? soatFromChecklist.status === 'OK'
    : report.soatValid;
  const technicalReviewValid = revTecnicaFromChecklist
    ? revTecnicaFromChecklist.status === 'OK'
    : report.technicalReviewValid;

  // Agrupar fotos por checklistItemId
  const photosByItem: Record<string, string[]> = {};
  report.photos.forEach((photo) => {
    if (photo.checklistItemId) {
      if (!photosByItem[photo.checklistItemId]) {
        photosByItem[photo.checklistItemId] = [];
      }
      photosByItem[photo.checklistItemId].push(photo.url);
    }
  });

  return {
    reportId: report.id,
    bookingId: booking.id,
    reportCode: generateReportCode(booking.id, report.createdAt),
    date: formatDate(report.completedAt || report.createdAt),
    completedAt: formatDateTime(report.completedAt || new Date()),

    client: {
      name: booking.client.name,
      email: booking.client.email,
      phone: booking.client.phone,
    },

    vehicle: {
      brand: booking.vehicle.model.brand.name,
      model: booking.vehicle.model.name,
      year: booking.vehicle.year,
      plate: plateToUse, // Usa placa del mecánico si existe, sino la del cliente
      mileage: report.mileageAtInspection || booking.vehicle.mileage,
    },

    overallScore: report.overallScore || 0,
    overallStatus: report.overallStatus,
    categories,

    checklistResults,

    soatValid,
    soatExpiryDate,
    technicalReviewValid,
    technicalReviewExpiryDate,

    executiveSummary: report.executiveSummary,
    estimatedRepairCost: report.estimatedRepairCost
      ? Number(report.estimatedRepairCost)
      : null,

    // Veredicto del mecánico
    mechanicalVerdict: report.mechanicalVerdict,
    hasSiniestro: report.hasSiniestro,
    hasKilometrajeAdulterado: report.hasKilometrajeAdulterado,

    inspectorName: booking.inspector?.name || 'Inspector',
    inspectorSignature: report.inspectorSignature,

    // Fotos agrupadas por item del checklist
    photosByItem,
  };
}

// Generar el PDF del informe
export async function generateInspectionPDF(reportId: number): Promise<GeneratePDFResult> {
  // Obtener datos del reporte
  const data = await getReportDataForPDF(reportId);

  if (!data) {
    throw new Error(`No se encontró el reporte con ID ${reportId}`);
  }

  // Renderizar el PDF a buffer
  const buffer = await renderToBuffer(
    <InspectionReportPDF data={data} />
  );

  // Calcular hash SHA-256 para integridad
  const hash = createHash('sha256').update(buffer).digest('hex');

  return { buffer, hash };
}

// Generar PDF on-demand (para el endpoint)
export async function generatePDFOnDemand(bookingId: number): Promise<Buffer> {
  const report = await db.inspectionReport.findUnique({
    where: { bookingId },
  });

  if (!report) {
    throw new Error('Informe no encontrado');
  }

  const { buffer } = await generateInspectionPDF(report.id);
  return buffer;
}
