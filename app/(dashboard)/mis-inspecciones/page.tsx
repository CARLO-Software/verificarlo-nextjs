import { getClientInspections } from "@/services/inspections/inspections.server";
import { MisInspeccionesClient } from "./MisInspeccionesClient";

// Extrae solo la fecha (YYYY-MM-DD) de un Date UTC y crea un nuevo Date al mediodía UTC
// Esto evita problemas de timezone al serializar para el cliente
function preservarFechaParaCliente(fecha: Date): Date {
  const year = fecha.getUTCFullYear();
  const month = fecha.getUTCMonth();
  const day = fecha.getUTCDate();
  // Mediodía UTC para que al convertir a Lima (UTC-5) siga siendo el mismo día
  return new Date(Date.UTC(year, month, day, 12, 0, 0));
}

export default async function MisInspeccionesPage() {
  const inspections = await getClientInspections();

  // Transformar datos para el componente cliente
  const formattedInspections = inspections.map((inspection) => {
    // Determinar si tiene observaciones críticas basándose en el reporte
    const hasCriticalObservations = inspection.report?.overallStatus === 'CRITICAL';
    const hasObservations = inspection.report?.overallStatus === 'WARNING';

    return {
      id: inspection.id,
      code: inspection.code,
      status: inspection.status,
      date: preservarFechaParaCliente(inspection.date),
      expiresAt: inspection.expiresAt,
      vehicle: {
        brand: inspection.vehicle.model.brand.name,
        brandLogo: inspection.vehicle.model.brand.logo || undefined,
        model: inspection.vehicle.model.name,
        year: inspection.vehicle.year,
        plate: inspection.vehicle.plate,
      },
      location: "Lima, Perú", // TODO: Agregar ubicación al modelo si es necesario
      inspectionType: inspection.inspectionPlan.type, // 'LEGAL', 'BASIC', 'PREMIUM'
      grade: null as number | null, // TODO: Obtener de VehicleInspection cuando se implemente
      progress: getProgressForStatus(inspection.status),
      results:
        inspection.status === "COMPLETED"
          ? {
              legal: "ok" as const,
              mechanical: "ok" as const,
              body: "ok" as const,
            }
          : undefined,
      hasCriticalObservations,
      hasObservations,
    };
  });

  return <MisInspeccionesClient inspections={formattedInspections} />;
}

// Helper para obtener el progreso según el estado
function getProgressForStatus(status: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return { current: 1, total: 3, label: "Pendiente de pago" };
    case "PAID":
      return { current: 2, total: 3, label: "Pagado" };
    case "COMPLETED":
      return { current: 3, total: 3, label: "Completada" };
    default:
      return undefined;
  }
}
