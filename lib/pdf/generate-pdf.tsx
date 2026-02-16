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

// Formatear fecha y hora para firma
function formatDateTime(date: Date): string {
  return format(date, "dd/MM/yyyy 'a las' HH:mm", { locale: es });
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
    },
  });

  if (!report || !report.booking) {
    return null;
  }

  const { booking } = report;

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
      plate: booking.vehicle.plate,
      vin: report.vinNumber,
      mileage: report.mileageAtInspection || booking.vehicle.mileage,
      color: report.actualColor,
      engineNumber: report.engineNumber,
    },

    overallScore: report.overallScore || 0,
    overallStatus: report.overallStatus,
    categories,

    checklistResults: (report.checklistResults as Record<string, { status: string; comment?: string }>) || {},

    soatValid: report.soatValid,
    soatExpiryDate,
    technicalReviewValid: report.technicalReviewValid,
    technicalReviewExpiryDate,

    executiveSummary: report.executiveSummary,
    recommendations: report.recommendations,
    estimatedRepairCost: report.estimatedRepairCost
      ? Number(report.estimatedRepairCost)
      : null,

    inspectorName: booking.inspector?.name || 'Inspector',
    inspectorSignature: report.inspectorSignature,
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
