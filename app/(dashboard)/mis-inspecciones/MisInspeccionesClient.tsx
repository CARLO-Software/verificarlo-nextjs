'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InspectionCard } from '@/app/components/Inspections/InspectionCard/InspectionCard';
import { EmptyState } from '@/app/components/ui/EmptyState/EmptyState';
import { BookingStatus } from '@prisma/client';

type FilterStatus = 'all' | BookingStatus;

interface FormattedInspection {
  id: number;
  code: string;
  status: BookingStatus;
  date: Date;
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plate: string | null;
  };
  location?: string;
  inspectionType: string;
  progress?: {
    current: number;
    total: number;
    label?: string;
  };
  results?: {
    legal: 'ok' | 'warning' | 'critical' | 'pending';
    mechanical: 'ok' | 'warning' | 'critical' | 'pending';
    body: 'ok' | 'warning' | 'critical' | 'pending';
  };
  hasCriticalObservations?: boolean;
}

interface MisInspeccionesClientProps {
  inspections: FormattedInspection[];
}

const filterOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'PENDING_PAYMENT', label: 'Pendientes' },
  { value: 'CONFIRMED', label: 'En proceso' },
  { value: 'COMPLETED', label: 'Completadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
];

export function MisInspeccionesClient({ inspections }: MisInspeccionesClientProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar bookings
  const filteredInspections = inspections.filter((inspection) => {
    // Filtro por estado
    if (statusFilter !== 'all') {
      if (statusFilter === 'CONFIRMED' && !['PAID', 'CONFIRMED'].includes(inspection.status)) {
        return false;
      } else if (statusFilter !== 'CONFIRMED' && inspection.status !== statusFilter) {
        return false;
      }
    }

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesVehicle =
        inspection.vehicle.brand.toLowerCase().includes(query) ||
        inspection.vehicle.model.toLowerCase().includes(query) ||
        (inspection.vehicle.plate?.toLowerCase().includes(query) ?? false);
      const matchesCode = inspection.code.toLowerCase().includes(query);

      if (!matchesVehicle && !matchesCode) {
        return false;
      }
    }

    return true;
  });

  const handleViewReport = (id: number) => {
    router.push(`/mis-inspecciones/${id}`);
  };

  const handleDownloadPdf = (id: number) => {
    // TODO: Implementar descarga de PDF
    console.log('Descargar PDF:', id);
  };
  
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-[70px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#2D2D2D]">
              Mis Inspecciones
            </h1>
            <p className="text-gray-500 mt-1">
              Consulta el estado y resultados de tus inspecciones
            </p>
          </div>

          <a
            href="/agendar"
            className="
              inline-flex items-center justify-center gap-2
              px-6 py-3 rounded-lg
              bg-[#FFE14C] text-[#2D2D2D]
              font-semibold text-sm
              hover:bg-[#FFD700]
              transition-colors duration-200
              whitespace-nowrap
            "
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva inspección
          </a>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Status filter pills */}
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value as FilterStatus)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium
                  transition-all duration-200
                  ${statusFilter === option.value
                    ? 'bg-[#FFE14C] text-[#2D2D2D] border-[#FFE14C]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#FFE14C]'
                  }
                  border
                `}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative sm:ml-auto">
            <input
              type="text"
              placeholder="Buscar por vehículo o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full sm:w-64 pl-10 pr-4 py-2
                border border-gray-200 rounded-lg
                text-sm text-[#2D2D2D]
                placeholder-gray-400
                focus:outline-none focus:border-[#FFE14C]
                transition-colors duration-200
              "
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        {filteredInspections.length === 0 ? (
          inspections.length === 0 ? (
            <EmptyState
              title="Aún no tienes inspecciones"
              description="Agenda tu primera inspección y compra con confianza"
              actionLabel="Agendar inspección"
              actionHref="/agendar"
            />
          ) : (
            <EmptyState
              title="No hay resultados"
              description="No encontramos inspecciones que coincidan con tu búsqueda"
              actionLabel="Limpiar filtros"
              onAction={() => {
                setStatusFilter('all');
                setSearchQuery('');
              }}
            />
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInspections.map((inspection, index) => (
              <div
                key={inspection.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <InspectionCard
                  inspection={inspection}
                  onClick={() => handleViewReport(inspection.id)}
                  onViewReport={() => handleViewReport(inspection.id)}
                  onDownloadPdf={() => handleDownloadPdf(inspection.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
