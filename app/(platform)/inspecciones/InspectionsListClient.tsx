/**
 * InspectionsListClient: Lista interactiva de inspecciones.
 * Componente cliente que maneja filtros, búsqueda y renderizado
 * de las cards de inspección con sus acciones contextuales.
 */
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Calendar, Clock, FileText, ChevronRight, Filter, X } from 'lucide-react';
import { BookingStatus, InspectionResultStatus } from '@prisma/client';
import { formatearFechaHoraCorta } from '@/app/domain/datetime';

interface Inspection {
  id: number;
  code: string;
  status: BookingStatus;
  startTime: Date;
  timeSlot: string;
  vehicle: {
    brand: string;
    brandLogo: string;
    model: string;
    year: number;
    plate: string | null;
  };
  plan: string;
  planType: string;
  hasReport: boolean;
  overallStatus: InspectionResultStatus | null;
  overallScore: number | null;
}

interface Props {
  inspections: Inspection[];
  brands: string[];
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

const resultStatusConfig: Record<string, { label: string; className: string }> = {
  APPROVED: {
    label: 'Aprobado',
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  APPROVED_WITH_OBSERVATIONS: {
    label: 'Aprobado con observaciones',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  REJECTED: {
    label: 'Rechazado',
    className: 'bg-red-100 text-red-800 border-red-300',
  },
  PENDING: {
    label: 'Pendiente',
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },
};

export function InspectionsListClient({ inspections, brands }: Props) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedBrand) count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [selectedBrand, dateFrom, dateTo]);

  // Limpiar todos los filtros avanzados
  const clearAdvancedFilters = () => {
    setSelectedBrand('');
    setDateFrom('');
    setDateTo('');
  };

  // Filtrar inspecciones
  const filteredInspections = useMemo(() => {
    return inspections.filter((inspection) => {
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
        if (!vehicleText.includes(query) && !codeText.includes(query)) {
          return false;
        }
      }

      // Filtro por marca
      if (selectedBrand && inspection.vehicle.brand !== selectedBrand) {
        return false;
      }

      // Filtro por fecha desde
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        const inspectionDate = new Date(inspection.startTime);
        if (inspectionDate < fromDate) {
          return false;
        }
      }

      // Filtro por fecha hasta
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        const inspectionDate = new Date(inspection.startTime);
        if (inspectionDate > toDate) {
          return false;
        }
      }

      return true;
    });
  }, [inspections, filter, search, selectedBrand, dateFrom, dateTo]);

  return (
    <div>
      {/* Filtros principales */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Fila 1: Tabs de estado y búsqueda */}
        <div className="flex flex-col sm:flex-row gap-3">
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

          {/* Búsqueda y botón de filtros */}
          <div className="flex gap-2 flex-1">
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

            {/* Botón de filtros avanzados */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                border transition-all duration-200
                ${showFilters || activeFiltersCount > 0
                  ? 'bg-[#F5D849] border-[#F5D849] text-gray-900'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-xs">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Fila 2: Filtros avanzados (colapsable) */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 text-sm">Filtros avanzados</h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAdvancedFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <X size={14} />
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Filtro por marca */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Marca del vehículo
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="
                    w-full px-3 py-2 bg-white border border-gray-200 rounded-lg
                    text-sm focus:outline-none focus:ring-2 focus:ring-[#F5D849]/50 focus:border-[#F5D849]
                  "
                >
                  <option value="">Todas las marcas</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro fecha desde */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Desde
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="
                    w-full px-3 py-2 bg-white border border-gray-200 rounded-lg
                    text-sm focus:outline-none focus:ring-2 focus:ring-[#F5D849]/50 focus:border-[#F5D849]
                  "
                />
              </div>

              {/* Filtro fecha hasta */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Hasta
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="
                    w-full px-3 py-2 bg-white border border-gray-200 rounded-lg
                    text-sm focus:outline-none focus:ring-2 focus:ring-[#F5D849]/50 focus:border-[#F5D849]
                  "
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de inspecciones */}
      <div className="space-y-4">
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
  const resultStatus = inspection.overallStatus ? resultStatusConfig[inspection.overallStatus] : null;
  const isCompleted = inspection.status === 'COMPLETED';

  // Formatear fecha y hora
  const inspectionDate = new Date(inspection.startTime);
  const formattedDate = inspectionDate.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = inspection.timeSlot;

  // Calcular grado si hay puntaje
  const getGrade = (score: number | null) => {
    if (score === null) return null;
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  };

  const grade = getGrade(inspection.overallScore);

  return (
    <Link
      href={`/inspecciones/${inspection.id}`}
      className="
        block bg-white rounded-2xl border-2 border-gray-100 p-5
        hover:border-gray-300 hover:shadow-lg
        transition-all duration-200
      "
    >
      {/* Header: código, hora y fecha */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono text-gray-400">{inspection.code}</span>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {formattedTime}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex items-start gap-4">
        {/* Logo de la marca y placa (columna vertical) */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center p-2">
            {inspection.vehicle.brandLogo ? (
              <Image
                src={inspection.vehicle.brandLogo}
                alt={inspection.vehicle.brand}
                width={32}
                height={32}
                className="object-contain"
              />
            ) : (
              <span className="text-lg font-bold text-gray-400">
                {inspection.vehicle.brand.charAt(0)}
              </span>
            )}
          </div>
          {inspection.vehicle.plate && (
            <span className="inline-flex items-center px-2 py-1 rounded-md border-2 border-gray-200 text-xs font-medium text-gray-700 bg-gray-50">
              {inspection.vehicle.plate}
            </span>
          )}
        </div>

        {/* Información del vehículo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-gray-900 text-lg">
              {inspection.vehicle.brand} {inspection.vehicle.model} {inspection.vehicle.year}
            </h3>
            {/* Status de la inspección */}
            <span className={`
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0
              ${status.className}
            `}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>

          {/* Badge de resultado (solo para completadas) */}
          {isCompleted && resultStatus && (
            <div className="mt-3">
              <span className={`
                inline-flex items-center px-3 py-1.5 rounded-lg border text-sm font-medium
                ${resultStatus.className}
              `}>
                {resultStatus.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: tipo de inspección y grado */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{inspection.plan}</span>
          {isCompleted && grade && (
            <>
              <span className="text-gray-300">|</span>
              <span className="font-semibold text-gray-700">Grado {grade}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isCompleted && inspection.hasReport && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <FileText size={14} />
              Informe
            </span>
          )}
          <ChevronRight size={18} className="text-gray-400" />
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
      subtitle: 'Aquí verás todos los autos que verifiques',
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
