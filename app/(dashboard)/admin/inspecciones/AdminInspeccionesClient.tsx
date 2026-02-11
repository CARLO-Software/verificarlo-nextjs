'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/app/components/ui/StatusBadge/StatusBadge';
import { formatearFechaHoraCorta } from '@/app/domain/datetime';
import { BookingStatus } from '@prisma/client';
import { saveInspectionChangesAction } from './actions';

interface Inspection {
  id: number;
  code: string;
  status: BookingStatus;
  date: Date;
  startTime: Date;
  timeSlot: string;
  createdAt: Date;
  client: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plate: string | null;
  };
  inspectionType: string;
  inspector: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  clientNotes: string | null;
  inspectorNotes: string | null;
  adminNotes: string | null;
}

interface Inspector {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface Stats {
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  total: number;
}

interface AdminInspeccionesClientProps {
  inspections: Inspection[];
  stats: Stats;
  inspectors: Inspector[];
}

const statsConfig = [
  { key: 'pending', label: 'Pendientes', color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'inProgress', label: 'En proceso', color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'completed', label: 'Completadas', color: 'text-green-600', bg: 'bg-green-50' },
  { key: 'cancelled', label: 'Canceladas', color: 'text-red-600', bg: 'bg-red-50' },
];

const filterPills = [
  { value: 'all', label: 'Todos' },
  { value: 'PENDING_PAYMENT', label: 'Pendientes' },
  { value: 'CONFIRMED', label: 'En proceso' },
  { value: 'COMPLETED', label: 'Completadas' },
];

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    'bg-blue-100 text-blue-600',
    'bg-green-100 text-green-600',
    'bg-purple-100 text-purple-600',
    'bg-amber-100 text-amber-600',
    'bg-pink-100 text-pink-600',
  ];

  const colorIndex = name.length % colors.length;
  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';

  return (
    <div
      className={`
        ${sizeClasses} ${colors[colorIndex]}
        rounded-full flex items-center justify-center font-semibold
      `}
    >
      {initials}
    </div>
  );
}

function InspectionDetailPanel({
  inspection,
  inspectors,
  onClose,
  onSaveSuccess,
}: {
  inspection: Inspection;
  inspectors: Inspector[];
  onClose: () => void;
  onSaveSuccess: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'evidence' | 'history'>('details');
  const [isPending, startTransition] = useTransition();

  // Estado local para ediciones
  const [editedStatus, setEditedStatus] = useState<BookingStatus>(inspection.status);
  const [editedInspectorId, setEditedInspectorId] = useState<string | null>(
    inspection.inspector?.id ?? null
  );
  const [editedNotes, setEditedNotes] = useState<string>(inspection.adminNotes || '');

  // Estado para feedback
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Detectar si hay cambios
  const hasChanges =
    editedStatus !== inspection.status ||
    editedInspectorId !== (inspection.inspector?.id ?? null) ||
    editedNotes !== (inspection.adminNotes || '');

  const handleSave = () => {
    setSaveMessage(null);

    startTransition(async () => {
      const changes: {
        status?: BookingStatus;
        inspectorId?: string;
        adminNotes?: string;
      } = {};

      if (editedStatus !== inspection.status) {
        changes.status = editedStatus;
      }

      if (editedInspectorId && editedInspectorId !== (inspection.inspector?.id ?? null)) {
        changes.inspectorId = editedInspectorId;
      }

      if (editedNotes !== (inspection.adminNotes || '')) {
        changes.adminNotes = editedNotes;
      }

      if (Object.keys(changes).length === 0) {
        setSaveMessage({ type: 'error', text: 'No hay cambios para guardar' });
        return;
      }

      const result = await saveInspectionChangesAction(inspection.id, changes);

      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Cambios guardados correctamente' });
        setTimeout(() => {
          onSaveSuccess();
        }, 1000);
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'Error al guardar' });
      }
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="
          fixed right-0 top-0 h-full w-full max-w-lg
          bg-white shadow-xl z-50
          animate-slideInRight
          flex flex-col
        "
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#2D2D2D]">
                Inspección {inspection.code}
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={editedStatus} />
                {hasChanges && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Sin guardar
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6">
            {[
              { id: 'details', label: 'Detalles' },
              { id: 'checklist', label: 'Checklist' },
              { id: 'evidence', label: 'Evidencias' },
              { id: 'history', label: 'Historial' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg
                  transition-colors duration-200
                  ${activeTab === tab.id
                    ? 'bg-[#FFE14C]/20 text-[#2D2D2D]'
                    : 'text-gray-500 hover:text-[#2D2D2D] hover:bg-gray-100'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Client info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Cliente</h3>
                <div className="flex items-center gap-3">
                  <Avatar name={inspection.client.name} />
                  <div>
                    <p className="font-medium text-[#2D2D2D]">{inspection.client.name}</p>
                    <p className="text-sm text-gray-500">{inspection.client.email}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Vehículo</h3>
                <p className="font-medium text-[#2D2D2D]">
                  {inspection.vehicle.brand} {inspection.vehicle.model} {inspection.vehicle.year}
                </p>
                <p className="text-sm text-gray-500">Placa: {inspection.vehicle.plate || 'Sin placa'}</p>
              </div>

              {/* Inspection info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Inspección</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fecha</span>
                    <span className="font-medium">{formatearFechaHoraCorta(inspection.startTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipo</span>
                    <span className="font-medium">{inspection.inspectionType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Estado</span>
                    <select
                      value={editedStatus}
                      onChange={(e) => setEditedStatus(e.target.value as BookingStatus)}
                      disabled={isPending}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]"
                    >
                      <option value="PENDING_PAYMENT">Pendiente de pago</option>
                      <option value="PAID">Pagado</option>
                      <option value="CONFIRMED">Confirmado</option>
                      <option value="COMPLETED">Completado</option>
                      <option value="CANCELLED">Cancelado</option>
                      <option value="NO_SHOW">No se presentó</option>
                      <option value="EXPIRED">Expirado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Inspector assignment */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Inspector asignado</h3>
                <select
                  value={editedInspectorId || ''}
                  onChange={(e) => setEditedInspectorId(e.target.value || null)}
                  disabled={isPending}
                  className={`
                    w-full p-3 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50
                    ${editedInspectorId
                      ? 'border border-gray-200 focus:border-[#FFE14C]'
                      : 'border-2 border-dashed border-gray-200 text-gray-500 hover:border-[#FFE14C]'
                    }
                  `}
                >
                  <option value="">+ Seleccionar inspector</option>
                  {inspectors.map((inspector) => (
                    <option key={inspector.id} value={inspector.id}>
                      {inspector.name}
                    </option>
                  ))}
                </select>
                {editedInspectorId && (
                  <div className="flex items-center gap-3 mt-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar
                      name={inspectors.find((i) => i.id === editedInspectorId)?.name || '?'}
                      size="sm"
                    />
                    <span className="font-medium text-sm">
                      {inspectors.find((i) => i.id === editedInspectorId)?.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Notas del administrador
                </h3>
                <textarea
                  placeholder="Agregar notas del administrador..."
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  disabled={isPending}
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]"
                />
              </div>

              {/* Notas del cliente e inspector (solo lectura) */}
              {inspection.clientNotes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                    Notas del cliente
                  </h3>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    {inspection.clientNotes}
                  </p>
                </div>
              )}

              {inspection.inspectorNotes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                    Notas del inspector
                  </h3>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    {inspection.inspectorNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="text-center py-12 text-gray-500">
              <p>Checklist no disponible aún</p>
              <p className="text-sm mt-2">Esta funcionalidad estará disponible próximamente</p>
            </div>
          )}

          {activeTab === 'evidence' && (
            <div>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 mb-2">Arrastra imágenes aquí</p>
                <button className="text-sm text-[#FFE14C] hover:underline">
                  o selecciona archivos
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 bg-[#FFE14C] rounded-full" />
                  <div className="w-px h-full bg-gray-200" />
                </div>
                <div className="pb-4">
                  <p className="text-sm text-[#2D2D2D]">Inspección creada</p>
                  <p className="text-xs text-gray-500">{formatearFechaHoraCorta(inspection.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          {/* Mensaje de feedback */}
          {saveMessage && (
            <div
              className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${
                saveMessage.type === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {saveMessage.text}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isPending || !hasChanges}
              className={`
                flex-1 px-4 py-2.5 font-semibold rounded-lg transition-all
                ${hasChanges
                  ? 'bg-[#FFE14C] text-[#2D2D2D] hover:bg-[#FFD700]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
                disabled:opacity-50
              `}
            >
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button className="flex-1 px-4 py-2.5 bg-[#2D2D2D] text-white font-semibold rounded-lg hover:bg-[#1a1a1a] transition-colors">
              Publicar informe
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function AdminInspeccionesClient({
  inspections,
  stats,
  inspectors,
}: AdminInspeccionesClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  const filteredInspections = inspections.filter((inspection) => {
    if (filter !== 'all') {
      if (filter === 'CONFIRMED' && !['PAID', 'CONFIRMED'].includes(inspection.status)) {
        return false;
      } else if (filter !== 'CONFIRMED' && inspection.status !== filter) {
        return false;
      }
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        inspection.client.name.toLowerCase().includes(query) ||
        (inspection.vehicle.plate?.toLowerCase().includes(query) ?? false) ||
        inspection.code.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleSaveSuccess = () => {
    setSelectedInspection(null);
    router.refresh();
  };

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#2D2D2D]">
            Gestión de Inspecciones
          </h1>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {statsConfig.map((stat) => (
              <div
                key={stat.key}
                className={`${stat.bg} rounded-lg p-4`}
              >
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stats[stat.key as keyof Stats]}
                </p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por cliente, vehículo o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FFE14C]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {filterPills.map((pill) => (
              <button
                key={pill.value}
                onClick={() => setFilter(pill.value)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${filter === pill.value
                    ? 'bg-[#FFE14C] text-[#2D2D2D]'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-[#FFE14C]'
                  }
                `}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">
                    Cliente
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">
                    Vehículo
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">
                    Fecha
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">
                    Inspector
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">
                    Estado
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-6 py-4">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInspections.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron inspecciones
                    </td>
                  </tr>
                ) : (
                  filteredInspections.map((inspection, index) => (
                    <tr
                      key={inspection.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => setSelectedInspection(inspection)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={inspection.client.name} size="sm" />
                          <div>
                            <p className="font-medium text-[#2D2D2D]">{inspection.client.name}</p>
                            <p className="text-xs text-gray-500">{inspection.client.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#2D2D2D]">
                          {inspection.vehicle.brand} {inspection.vehicle.model}
                        </p>
                        <p className="text-xs text-gray-500">
                          {inspection.vehicle.year}{inspection.vehicle.plate ? ` · ${inspection.vehicle.plate}` : ''}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[#2D2D2D]">{formatearFechaHoraCorta(inspection.startTime)}</p>
                      </td>
                      <td className="px-6 py-4">
                        {inspection.inspector ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={inspection.inspector.name} size="sm" />
                            <span className="text-sm">{inspection.inspector.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={inspection.status} size="sm" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInspection(inspection);
                            }}
                            className="p-2 text-gray-400 hover:text-[#FFE14C] hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {filteredInspections.length} de {stats.total} inspecciones
            </p>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedInspection && (
        <InspectionDetailPanel
          inspection={selectedInspection}
          inspectors={inspectors}
          onClose={() => setSelectedInspection(null)}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
}
