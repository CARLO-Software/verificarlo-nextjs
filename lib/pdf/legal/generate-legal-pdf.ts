/**
 * Generación de PDF del informe legal
 */

import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { db } from '@/lib/db';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
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
      assignedAdmin: {
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

  // Obtener estados y observaciones de categorías (nuevo sistema)
  const sourceStatuses = legalReportData.sourceStatuses || {};
  const sourceObservations = legalReportData.sourceObservations || {};

  // Debug: Ver qué datos tenemos
  console.log('[PDF DEBUG] legalReportData completo:', JSON.stringify(legalReportData, null, 2));
  console.log('[PDF DEBUG] sourceStatuses:', JSON.stringify(sourceStatuses, null, 2));
  console.log('[PDF DEBUG] sourceObservations:', JSON.stringify(sourceObservations, null, 2));

  // Mapeo de campos a IDs de categorías (nuevo sistema)
  const fieldToCategoryMap: Record<string, string> = {
    ownerHistory: 'historial_propietarios',
    sunarpLiens: 'gravamenes_sunat',
    satCaptureOrder: 'orden_captura_sunat',
    soat: 'soat',
    techReview: 'revision_tecnica',
    vehicleTax: 'impuesto_vehicular',
    gasConversion: 'conversion_gas',
    satTickets: 'papeletas_sat',
    callaoTickets: 'papeletas_callao',
    sutranTickets: 'papeletas_sutran',
    theftHistory: 'siniestralidad',
    transportRegistry: 'registro_transportes',
    lastTransfer: 'historial_propietarios',
    accidentHistory: 'siniestralidad',
  };

  // Construir campos del informe
  const fields = Object.entries(LEGAL_FIELD_LABELS).map(([key, label]) => {
    const categoryId = fieldToCategoryMap[key];
    let finalStatus: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING' = 'PENDING';
    let finalObservation = '';

    // 1. Intentar obtener del nuevo sistema (sourceStatuses por categoryId)
    if (categoryId && sourceStatuses[categoryId]) {
      finalStatus = sourceStatuses[categoryId] as 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';
      finalObservation = sourceObservations[categoryId] || '';
      console.log(`[PDF] Campo ${key} → Categoría ${categoryId}: ${finalStatus}`);
    }
    // 2. Fallback: sistema antiguo (campo directo en legalReportData)
    else if (legalReportData[key] && typeof legalReportData[key] === 'object') {
      const oldData = legalReportData[key];
      if (oldData.status) {
        finalStatus = oldData.status as 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';
        finalObservation = oldData.text || '';
        console.log(`[PDF] Campo ${key} (sistema antiguo): ${finalStatus}`);
      }
    }

    return {
      key,
      label,
      status: finalStatus,
      text: finalObservation,
    };
  });

  // Construir lista de capturas (soporta múltiples imágenes por fuente)
  const screenshots: { sourceId: string; sourceName: string; imageUrl: string }[] = [];

  LEGAL_SOURCES.forEach((source) => {
    const sourceData = legalScreenshots[source.id];
    if (!sourceData) return;

    if (Array.isArray(sourceData)) {
      // Fuente con múltiples imágenes
      sourceData.forEach((img, index) => {
        if (img?.imageUrl) {
          screenshots.push({
            sourceId: source.id,
            sourceName: sourceData.length > 1 ? `${source.name} (${index + 1})` : source.name,
            imageUrl: img.imageUrl,
          });
        }
      });
    } else if (sourceData?.imageUrl) {
      // Fuente con imagen única
      screenshots.push({
        sourceId: source.id,
        sourceName: source.name,
        imageUrl: sourceData.imageUrl,
      });
    }
  });

  // Descripción del vehículo
  const vehicleDescription = `${inspection.vehicle.model.brand.name} ${inspection.vehicle.model.name} ${inspection.vehicle.year}`;

  // Total de páginas: portada + resumen + capturas + cierre
  const totalPages = 2 + screenshots.length + 1;

  return {
    inspectionId: inspection.id,
    plate: inspection.plate || 'SIN PLACA',
    vehicleDescription,
    clientName: inspection.client.name,
    date: format(toZonedTime(inspection.updatedAt, 'America/Lima'), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm 'hrs'", { locale: es }),
    fields,
    otherObservations: legalReportData.otherObservations || '',
    screenshots,
    inspectorName: inspection.assignedAdmin?.name || 'Inspector Legal',
    totalPages,
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
