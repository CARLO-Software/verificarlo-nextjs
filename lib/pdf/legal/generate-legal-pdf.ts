/**
 * Generación de PDF del informe legal
 */

import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { db } from '@/lib/db';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import LegalReportPDF, { LegalReportData } from './LegalReportPDF';
import { LEGAL_SOURCES } from '@/lib/constants/legal-sources';

// Campos del informe legal (mapeo de keys a labels)
const LEGAL_FIELD_LABELS: Record<string, string> = {
  ownerHistory: 'Historial de Propietarios',
  sunarpLiens: 'Gravámenes SUNARP',
  satCaptureOrder: 'Orden de Captura SAT',
  soat: 'SOAT',
  techReview: 'Revisión Técnica',
  vehicleTax: 'Impuesto Vehicular',
  gasConversion: 'Conversión a Gas',
  satTickets: 'Papeletas SAT',
  callaoTickets: 'Papeletas Callao',
  sutranTickets: 'Papeletas SUTRAN',
  theftHistory: 'Historial de Robos',
  transportRegistry: 'Registro de Transportes',
  lastTransfer: 'Última Transferencia',
  accidentHistory: 'Siniestralidad',
};

// Obtener datos para el PDF legal
export async function getLegalReportDataForPDF(
  inspectionId: number
): Promise<LegalReportData | null> {
  const inspection = await db.vehicleInspection.findUnique({
    where: { id: inspectionId },
    include: {
      vehicle: {
        include: {
          model: {
            include: {
              brand: true,
            },
          },
        },
      },
      client: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!inspection) {
    return null;
  }

  // Parsear datos del informe legal
  const legalReportData = (inspection.legalReportData as Record<string, any>) || {};
  const legalScreenshots = (inspection.legalScreenshots as Record<string, any>) || {};

  // Construir campos del informe
  const fields = Object.entries(LEGAL_FIELD_LABELS).map(([key, label]) => {
    const field = legalReportData[key] || { status: 'PENDING', text: '' };
    return {
      key,
      label,
      status: field.status as 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING',
      text: field.text || '',
    };
  });

  // Construir lista de capturas
  const screenshots = LEGAL_SOURCES
    .filter((source) => legalScreenshots[source.id]?.imageUrl)
    .map((source) => ({
      sourceId: source.id,
      sourceName: source.name,
      imageUrl: legalScreenshots[source.id].imageUrl,
    }));

  // Descripción del vehículo
  const vehicleDescription = `${inspection.vehicle.model.brand.name} ${inspection.vehicle.model.name} ${inspection.vehicle.year}`;

  return {
    inspectionId: inspection.id,
    plate: inspection.plate || 'SIN PLACA',
    vehicleDescription,
    clientName: inspection.client.name,
    date: format(inspection.updatedAt, "dd 'de' MMMM 'de' yyyy", { locale: es }),
    fields,
    otherObservations: legalReportData.otherObservations || '',
    screenshots,
  };
}

// Generar el PDF legal
export async function generateLegalPDF(
  inspectionId: number
): Promise<Buffer> {
  const data = await getLegalReportDataForPDF(inspectionId);

  if (!data) {
    throw new Error(`No se encontró la inspección con ID ${inspectionId}`);
  }

  // Renderizar el PDF a buffer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfElement = React.createElement(LegalReportPDF, { data }) as any;
  const buffer = await renderToBuffer(pdfElement);

  return buffer;
}
