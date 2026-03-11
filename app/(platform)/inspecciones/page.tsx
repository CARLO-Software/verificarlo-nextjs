/**
 * Lista de Inspecciones del Cliente (/inspecciones).
 *
 * Muestra todas las inspecciones con:
 * - Filtros por estado (tabs)
 * - Búsqueda por vehículo o código
 * - Cards con acciones contextuales según estado
 * - Acceso a detalle y descarga de informe
 */
import { getClientInspections } from '@/services/inspections/inspections.server';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { InspectionsListClient } from './InspectionsListClient';

export default async function InspectionsPage() {
  const inspections = await getClientInspections();

  // Transformar datos para el cliente
  const formattedInspections = inspections.map((inspection) => ({
    id: inspection.id,
    code: inspection.code,
    status: inspection.status,
    startTime: inspection.startTime,
    timeSlot: inspection.timeSlot,
    vehicle: {
      brand: inspection.vehicle.model.brand.name,
      brandLogo: inspection.vehicle.model.brand.logo,
      model: inspection.vehicle.model.name,
      year: inspection.vehicle.year,
      plate: inspection.vehicle.plate,
    },
    plan: inspection.inspectionPlan.title,
    planType: inspection.inspectionPlan.type,
    hasReport: !!inspection.report,
    overallStatus: inspection.report?.overallStatus || null,
    overallScore: inspection.report?.overallScore || null,
  }));

  // Extraer marcas únicas para el filtro
  const uniqueBrands = [...new Set(inspections.map(i => i.vehicle.model.brand.name))].sort();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Mis Inspecciones
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {inspections.length} inspección{inspections.length !== 1 ? 'es' : ''} en total
          </p>
        </div>

        <Link
          href="/agendar"
          className="
            inline-flex items-center gap-2
            bg-[#F5D849] hover:bg-[#e5c83a]
            text-gray-900 font-semibold text-sm
            px-4 py-2.5 rounded-lg
            transition-colors duration-200
          "
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nueva inspección</span>
          <span className="sm:hidden">Nueva</span>
        </Link>
      </div>

      {/* Lista con filtros (componente cliente para interactividad) */}
      <InspectionsListClient inspections={formattedInspections} brands={uniqueBrands} />
    </div>
  );
}
