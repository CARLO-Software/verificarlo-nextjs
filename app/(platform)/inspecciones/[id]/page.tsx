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
"use server";
import { notFound } from 'next/navigation';
import { getInspectionById } from '@/services/inspections/inspections.server';
import { InspectionDetailClient } from './InspectionDetailClient';

interface Props {
  params: { id: string };
}

//* Cuando el usuario accede a /inspecciones/[id], esta función se ejecuta en el servidor para obtener los datos de la inspección y luego renderizar el componente cliente con esos datos.
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
    // Ubicación del cliente (destino)
    clientLocation: {
      address: inspection.client.address,
      district: inspection.client.district,
    },
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
          // Usar API de Next.js para servir el PDF (no Cloudinary)
          pdfUrl: null,
          completedAt: inspection.report.completedAt,
          // Informe legal del admin
          legalReport: inspection.report.legalReport
            ? {
                status: inspection.report.legalReport.status,
                completedAt: inspection.report.legalReport.completedAt,
              }
            : null,
        }
      : null,
    // Flujo de inspección dual (mecánico + legal)
    vehicleInspection: inspection.vehicleInspection
      ? {
          id: inspection.vehicleInspection.id,
          plate: inspection.vehicleInspection.plate,
          legalStatus: inspection.vehicleInspection.legalStatus,
          mechanicalStatus: inspection.vehicleInspection.mechanicalStatus,
          assignedMechanic: inspection.vehicleInspection.assignedMechanic,
          assignedAdmin: inspection.vehicleInspection.assignedAdmin,
          createdAt: inspection.vehicleInspection.createdAt,
          plateAddedAt: inspection.vehicleInspection.plateAddedAt,
          legalUnlockedAt: inspection.vehicleInspection.legalUnlockedAt,
          legalStartedAt: inspection.vehicleInspection.legalStartedAt,
          legalCompletedAt: inspection.vehicleInspection.legalCompletedAt,
          mechanicAssignedAt: inspection.vehicleInspection.mechanicAssignedAt,
          mechanicStartedAt: inspection.vehicleInspection.mechanicStartedAt,
          mechanicCompletedAt: inspection.vehicleInspection.mechanicCompletedAt,
        }
      : null,
  };

  return <InspectionDetailClient inspection={formattedInspection} />;
}
