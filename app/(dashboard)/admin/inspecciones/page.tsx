import { getAllInspections, getInspectionStats, getAvailableInspectors } from '@/services/inspections/inspections.server';
import { AdminInspeccionesClient } from './AdminInspeccionesClient';

export default async function AdminInspeccionesPage() {
  const [inspections, stats, inspectors] = await Promise.all([
    getAllInspections(),
    getInspectionStats(),
    getAvailableInspectors(),
  ]);

  // Transformar datos para el componente cliente
  const formattedInspections = inspections.map((inspection) => ({
    id: inspection.id,
    code: inspection.code,
    status: inspection.status,
    date: inspection.date,
    startTime: inspection.startTime,
    timeSlot: inspection.timeSlot,
    createdAt: inspection.createdAt,
    client: {
      id: inspection.client.id,
      name: inspection.client.name,
      email: inspection.client.email,
      avatar: inspection.client.image,
    },
    vehicle: {
      brand: inspection.vehicle.model.brand.name,
      model: inspection.vehicle.model.name,
      year: inspection.vehicle.year,
      plate: inspection.vehicle.plate,
    },
    inspectionType: inspection.inspection.title,
    inspector: inspection.inspector ? {
      id: inspection.inspector.id,
      name: inspection.inspector.name,
      avatar: inspection.inspector.image,
    } : null,
    clientNotes: inspection.clientNotes,
    inspectorNotes: inspection.inspectorNotes,
    adminNotes: inspection.adminNotes,
  }));

  return (
    <AdminInspeccionesClient
      inspections={formattedInspections}
      stats={stats}
      inspectors={inspectors}
    />
  );
}
