/**
 * InspectionsListClient: Lista interactiva de inspecciones.
 * Componente cliente que maneja filtros, búsqueda y renderizado
 * de las cards de inspección con sus acciones contextuales.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Calendar, Clock, FileText, ChevronRight } from 'lucide-react';
import { BookingStatus } from '@prisma/client';
import { formatearFechaHoraCorta } from '@/app/domain/datetime';

interface Inspection {
  id: number;
  code: string;
  status: BookingStatus;
  startTime: Date;
  timeSlot: string;
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plate: string | null;
  };
  plan: string;
  hasReport: boolean;
}

interface Props {
  inspections: Inspection[];
}

const filterTabs = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'completed', label: 'Completadas' },
  { value: 'cancelled', label: 'Canceladas' },
];

const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
  PENDING_PAYMENT: {
    label: 'Pendiente de pago',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  PAID: {
    label: 'Pagado',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  CONFIRMED: {
    label: 'Confirmada',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  COMPLETED: {
    label: 'Completada',
    className: 'bg-green-50 text-green-700 border-green-200',
    dot: 'bg-green-500',
  },
  CANCELLED: {
    label: 'Cancelada',
    className: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  NO_SHOW: {
    label: 'No asistió',
    className: 'bg-gray-50 text-gray-700 border-gray-200',
    dot: 'bg-gray-500',
  },
  EXPIRED: {
    label: 'Expirada',
    className: 'bg-gray-50 text-gray-700 border-gray-200',
    dot: 'bg-gray-500',
  },
};

export function InspectionsListClient({ inspections }: Props) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Filtrar inspecciones
  const filteredInspections = inspections.filter((inspection) => {
    // Filtro por estado
    if (filter !== 'all') {
      if (filter === 'pending') {
        if (!['PENDING_PAYMENT', 'PAID', 'CONFIRMED'].includes(inspection.status)) {
          return false;
        }
      } else if (filter === 'completed') {
        if (inspection.status !== 'COMPLETED') return false;
      } else if (filter === 'cancelled') {
        if (!['CANCELLED', 'NO_SHOW', 'EXPIRED'].includes(inspection.status)) {
          return false;
        }
      }
    }

    // Filtro por búsqueda
    if (search) {
      const query = search.toLowerCase();
      const vehicleText = `${inspection.vehicle.brand} ${inspection.vehicle.model} ${inspection.vehicle.plate || ''}`.toLowerCase();
      const codeText = inspection.code.toLowerCase();
      return vehicleText.includes(query) || codeText.includes(query);
    }

    return true;
  });

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Tabs de estado */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                transition-all duration-200
                ${filter === tab.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Búsqueda */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar por vehículo o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2
              bg-white border border-gray-200 rounded-lg
              text-sm placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-[#F5D849]/50 focus:border-[#F5D849]
            "
          />
        </div>
      </div>

      {/* Lista de inspecciones */}
      <div className="space-y-3">
        {filteredInspections.length === 0 ? (
          <EmptyState filter={filter} search={search} />
        ) : (
          filteredInspections.map((inspection) => (
            <InspectionCard key={inspection.id} inspection={inspection} />
          ))
        )}
      </div>
    </div>
  );
}

function InspectionCard({ inspection }: { inspection: Inspection }) {
  const status = statusConfig[inspection.status] || statusConfig.PENDING_PAYMENT;
  const isPending = ['PENDING_PAYMENT', 'PAID', 'CONFIRMED'].includes(inspection.status);
  const isCompleted = inspection.status === 'COMPLETED';

  return (
    <Link
      href={`/inspecciones/${inspection.id}`}
      className="
        block bg-white rounded-xl border border-gray-100 p-4
        hover:border-[#F5D849] hover:shadow-md
        transition-all duration-200
      "
    >
      {/* Header: código y estado */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-mono text-gray-400">{inspection.code}</span>
        <span className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
          ${status.className}
        `}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      {/* Vehículo */}
      <h3 className="font-semibold text-gray-900">
        {inspection.vehicle.brand} {inspection.vehicle.model} {inspection.vehicle.year}
      </h3>
      {inspection.vehicle.plate && (
        <p className="text-sm text-gray-500">Placa: {inspection.vehicle.plate}</p>
      )}

      {/* Fecha y hora */}
      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
        <span className="flex items-center gap-1.5">
          <Calendar size={14} />
          {formatearFechaHoraCorta(inspection.startTime)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={14} />
          {inspection.timeSlot}
        </span>
      </div>

      {/* Footer: plan y acciones */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">{inspection.plan}</span>

        <div className="flex items-center gap-2">
          {isCompleted && inspection.hasReport && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <FileText size={14} />
              Informe disponible
            </span>
          )}
          {isPending && (
            <span className="text-xs text-gray-400">Ver detalles</span>
          )}
          <ChevronRight size={16} className="text-gray-400" />
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ filter, search }: { filter: string; search: string }) {
  if (search) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
        <Search size={40} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No se encontraron resultados</p>
        <p className="text-sm text-gray-400 mt-1">
          Intenta con otro término de búsqueda
        </p>
      </div>
    );
  }

  const messages: Record<string, { title: string; subtitle: string }> = {
    all: {
      title: 'Sin inspecciones',
      subtitle: 'Agenda tu primera inspección vehicular',
    },
    pending: {
      title: 'Sin inspecciones pendientes',
      subtitle: 'No tienes inspecciones programadas',
    },
    completed: {
      title: 'Sin inspecciones completadas',
      subtitle: 'Aún no has completado ninguna inspección',
    },
    cancelled: {
      title: 'Sin cancelaciones',
      subtitle: 'No tienes inspecciones canceladas',
    },
  };

  const { title, subtitle } = messages[filter] || messages.all;

  return (
    <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
      <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">{title}</p>
      <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
      {filter === 'all' && (
        <Link
          href="/agendar"
          className="
            inline-flex items-center gap-2 mt-4
            bg-[#F5D849] hover:bg-[#e5c83a]
            text-gray-900 font-semibold text-sm
            px-4 py-2 rounded-lg
            transition-colors
          "
        >
          Agendar inspección
        </Link>
      )}
    </div>
  );
}
