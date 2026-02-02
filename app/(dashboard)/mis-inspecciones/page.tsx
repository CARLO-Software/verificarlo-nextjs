import { getClientInspections } from '@/services/inspections/inspections.server';
import { MisInspeccionesClient } from './MisInspeccionesClient';

export default async function MisInspeccionesPage() {
  const inspections = await getClientInspections();

  // Transformar datos para el componente cliente
  const formattedInspections = inspections.map((inspection) => ({
    id: inspection.id,
    code: inspection.code,
    status: inspection.status,
    date: inspection.date,
    vehicle: {
      brand: inspection.vehicle.model.brand.name,
      model: inspection.vehicle.model.name,
      year: inspection.vehicle.year,
      plate: inspection.vehicle.plate,
    },
    location: 'Lima, Perú', // TODO: Agregar ubicación al modelo si es necesario
    inspectionType: inspection.inspection.title,
    progress: getProgressForStatus(inspection.status),
    results: inspection.status === 'COMPLETED' ? {
      legal: 'ok' as const,
      mechanical: 'ok' as const,
      body: 'ok' as const,
    } : undefined,
    hasCriticalObservations: false, // TODO: Implementar lógica de observaciones críticas
  }));

  return <MisInspeccionesClient inspections={formattedInspections} />;
}

// Helper para obtener el progreso según el estado
function getProgressForStatus(status: string) {
  switch (status) {
    case 'PENDING_PAYMENT':
      return { current: 1, total: 4, label: 'Pendiente de pago' };
    case 'PAID':
      return { current: 2, total: 4, label: 'Pago confirmado' };
    case 'CONFIRMED':
      return { current: 3, total: 4, label: 'Inspector asignado' };
    case 'COMPLETED':
      return { current: 4, total: 4, label: 'Completada' };
    default:
      return undefined;
  }
}
