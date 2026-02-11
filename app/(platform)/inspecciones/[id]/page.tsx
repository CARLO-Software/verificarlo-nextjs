/**
 * Detalle de Inspección (/inspecciones/[id]).
 *
 * Vista completa de una inspección con:
 * - Estado visual prominente
 * - Información del vehículo y servicio
 * - Acciones contextuales (cancelar, reprogramar)
 * - Regla de 24h para cancelaciones
 * - Descarga de informe (solo si está completado)
 * - Timeline de eventos
 */
import { notFound } from 'next/navigation';
import { getInspectionById } from '@/services/inspections/inspections.server';
import { InspectionDetailClient } from './InspectionDetailClient';

interface Props {
  params: { id: string };
}

export default async function InspectionDetailPage({ params }: Props) {
  const inspectionId = parseInt(params.id);

  if (isNaN(inspectionId)) {
    notFound();
  }

  const inspection = await getInspectionById(inspectionId);

  if (!inspection) {
    notFound();
  }

  // Transformar datos para el cliente
  const formattedInspection = {
    id: inspection.id,
    code: inspection.code,
    status: inspection.status,
    date: inspection.date,
    startTime: inspection.startTime,
    timeSlot: inspection.timeSlot,
    createdAt: inspection.createdAt,
    vehicle: {
      brand: inspection.vehicle.model.brand.name,
      model: inspection.vehicle.model.name,
      year: inspection.vehicle.year,
      plate: inspection.vehicle.plate,
      mileage: inspection.vehicle.mileage,
    },
    plan: {
      title: inspection.inspectionPlan.title,
      type: inspection.inspectionPlan.type,
      price: inspection.inspectionPlan.price,
    },
    inspector: inspection.inspector
      ? {
          name: inspection.inspector.name,
          image: inspection.inspector.image,
        }
      : null,
    clientNotes: inspection.clientNotes,
    report: inspection.report
      ? {
          overallScore: inspection.report.overallScore,
          overallStatus: inspection.report.overallStatus,
          legalScore: inspection.report.legalScore,
          legalStatus: inspection.report.legalStatus,
          mechanicalScore: inspection.report.mechanicalScore,
          mechanicalStatus: inspection.report.mechanicalStatus,
          bodyScore: inspection.report.bodyScore,
          bodyStatus: inspection.report.bodyStatus,
          executiveSummary: inspection.report.executiveSummary,
          recommendations: inspection.report.recommendations,
          pdfUrl: inspection.report.pdfUrl,
          completedAt: inspection.report.completedAt,
        }
      : null,
  };

  return <InspectionDetailClient inspection={formattedInspection} />;
}
