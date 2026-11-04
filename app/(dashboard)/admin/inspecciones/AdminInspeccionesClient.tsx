'use client';

import { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/app/components/ui/StatusBadge/StatusBadge';
import { PhoneInput } from '@/app/components/ui/PhoneInput/PhoneInput';
import { formatearFechaHoraCorta } from '@/app/domain/datetime';
import { BookingStatus, InspectionType } from '@prisma/client';
import {
  saveInspectionChangesAction,
  createManualInspectionAction,
  getBrandsAction,
  getModelsAction,
  getInspectionPlansAction,
  searchClientsAction,
  getAvailabilityForDateAction,
  getAvailableInspectorsForSlotAction,
  deleteCancelledInspectionAction,
  getBookingLogsAction,
} from './actions';

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
  inspectionPlanType: string;
  inspectionPlanPrice: number;
  inspector: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  clientNotes: string | null;
  inspectorNotes: string | null;
  adminNotes: string | null;
  address: string | null;
  district: string | null;
  locationUrl: string | null;
  reservationPaidAt: Date | null;
  inspectionPaidAt: Date | null;
  payment: {
    status: string;
    method: string | null;
    amount: number;
    paidAt: Date | null;
    voucherUrl: string | null;
  } | null;
  reportId: number | null;
  legalReportStatus: string | null;
  vehicleInspection: {
    id: number;
    plate: string | null;
    legalStatus: 'BLOQUEADO' | 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO';
    mechanicalStatus: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO';
  } | null;
}

interface Inspector {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface Brand {
  id: number;
  name: string;
  logo: string;
}

interface Model {
  id: number;
  name: string;
  yearFrom: number;
  yearTo: number;
}

interface InspectionPlan {
  id: number;
  type: InspectionType;
  title: string;
  description: string;
  price: number;
}

interface Stats {
  pendingAdmin: number;
  pendingMechanic: number;
  completedByMechanic: number;
  completedByAdmin: number;
  fullyCompleted: number;
  completed: number; // Para compatibilidad (alias de fullyCompleted)
  total: number;
}

interface AdminInspeccionesClientProps {
  inspections: Inspection[];
  stats: Stats;
  inspectors: Inspector[];
}

const statsConfig = [
  { key: 'pendingAdmin', label: 'Pendientes admin', color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'pendingMechanic', label: 'Pendientes mecanico', color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'completedByMechanic', label: 'Listo mecanico', color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { key: 'completedByAdmin', label: 'Listo admin', color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'fullyCompleted', label: 'Completadas', color: 'text-green-600', bg: 'bg-green-50' },
];

const filterPills = [
  { value: 'all', label: 'Todos' },
  { value: 'PENDING_ADMIN', label: 'Pendientes admin' },
  { value: 'PENDING_MECHANIC', label: 'Pendientes mecanico' },
  { value: 'COMPLETED_MECHANIC', label: 'Listo mecanico' },
  { value: 'COMPLETED_ADMIN', label: 'Listo admin' },
  { value: 'FULLY_COMPLETED', label: 'Completadas' },
];

const statusPills = [
  { value: 'all', label: 'Todos' },
  { value: 'PENDING_PAYMENT', label: 'Pendiente de pago' },
  { value: 'PENDING_VERIFICATION', label: 'Verificar pago' },
  { value: 'PAID', label: 'Pagado' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'NO_SHOW', label: 'No se presentó' },
  { value: 'EXPIRED', label: 'Expirado' },
];

const paymentMethodBadge: Record<string, { label: string; bg: string; text: string }> = {
  TRANSFER: { label: 'Transferencia', bg: 'bg-blue-50', text: 'text-blue-600' },
  YAPE_PLIN: { label: 'Yape/Plin', bg: 'bg-purple-50', text: 'text-purple-600' },
  WHATSAPP: { label: 'WhatsApp', bg: 'bg-green-50', text: 'text-green-600' },
  CULQI: { label: 'Culqi', bg: 'bg-amber-50', text: 'text-amber-600' },
};

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

function HistoryTab({ inspectionId, createdAt }: { inspectionId: number; createdAt: Date }) {
  const [logs, setLogs] = useState<{ id: number; action: string; detail: string; userName: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookingLogsAction(inspectionId).then((res) => {
      if (res.success && res.logs) setLogs(res.logs);
      setLoading(false);
    });
  }, [inspectionId]);

  if (loading) {
    return <p className="text-sm text-gray-400 text-center py-8">Cargando historial...</p>;
  }

  const actionIcons: Record<string, string> = {
    status_change: 'bg-amber-100 text-amber-600',
    inspector_assigned: 'bg-blue-100 text-blue-600',
    inspector_auto_assigned: 'bg-cyan-100 text-cyan-600',
    date_changed: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="space-y-0">
      {logs.map((log, i) => (
        <div key={log.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${actionIcons[log.action] || 'bg-gray-200 text-gray-500'}`} />
            {i < logs.length ? <div className="w-px flex-1 bg-gray-200" /> : null}
          </div>
          <div className="pb-4 min-w-0">
            <p className="text-sm text-[#2D2D2D]">{log.detail}</p>
            <p className="text-xs text-gray-400">{log.userName} · {formatearFechaHoraCorta(new Date(log.createdAt))}</p>
          </div>
        </div>
      ))}
      {/* Evento fijo: creación */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className="w-2.5 h-2.5 rounded-full mt-1.5 bg-green-100" />
        </div>
        <div className="pb-2">
          <p className="text-sm text-[#2D2D2D]">Inspección creada</p>
          <p className="text-xs text-gray-400">{formatearFechaHoraCorta(createdAt)}</p>
        </div>
      </div>
      {logs.length === 0 && (
        <p className="text-xs text-gray-400 mt-2">No hay cambios registrados aún</p>
      )}
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
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [isPending, startTransition] = useTransition();

  // Estado local para ediciones
  const [editedStatus, setEditedStatus] = useState<BookingStatus>(inspection.status);
  const [editedInspectorId, setEditedInspectorId] = useState<string | null>(
    inspection.inspector?.id ?? null
  );
  const [editedNotes, setEditedNotes] = useState<string>(inspection.adminNotes || '');

  // Estado para fecha y hora
  const originalDate = new Date(inspection.startTime).toISOString().split('T')[0];
  const originalTimeSlot = inspection.timeSlot;
  const [editedDate, setEditedDate] = useState<string>(originalDate);
  const [editedTimeSlot, setEditedTimeSlot] = useState<string>(originalTimeSlot);

  // Estado para ubicación
  const [editedAddress, setEditedAddress] = useState<string>(inspection.address || '');
  const [editedDistrict, setEditedDistrict] = useState<string>(inspection.district || '');

  const WEEKDAY_SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
  const SATURDAY_SLOTS = ['09:00', '10:00', '11:00', '12:00'];
  const selectedDay = editedDate ? new Date(editedDate + 'T12:00:00').getDay() : -1;
  const isSunday = selectedDay === 0;
  const isSaturday = selectedDay === 6;
  const timeSlots = isSunday ? [] : isSaturday ? SATURDAY_SLOTS : WEEKDAY_SLOTS;

  // Estado para feedback
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Detectar si hay cambios
  const hasDateTimeChanges = editedDate !== originalDate || editedTimeSlot !== originalTimeSlot;
  const hasLocationChanges = editedAddress !== (inspection.address || '') || editedDistrict !== (inspection.district || '');
  const hasChanges =
    editedStatus !== inspection.status ||
    editedInspectorId !== (inspection.inspector?.id ?? null) ||
    editedNotes !== (inspection.adminNotes || '') ||
    hasDateTimeChanges ||
    hasLocationChanges;

  const handleSave = () => {
    setSaveMessage(null);

    startTransition(async () => {
      const changes: {
        status?: BookingStatus;
        inspectorId?: string;
        adminNotes?: string;
        date?: string;
        timeSlot?: string;
        address?: string;
        district?: string;
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

      if (hasDateTimeChanges) {
        changes.date = editedDate;
        changes.timeSlot = editedTimeSlot;
      }

      if (hasLocationChanges) {
        changes.address = editedAddress;
        changes.district = editedDistrict;
      }

      if (Object.keys(changes).length === 0) {
        setSaveMessage({ type: 'error', text: 'No hay cambios para guardar' });
        return;
      }

      const result = await saveInspectionChangesAction(inspection.id, changes);

      if (result.success) {
        // Mostrar mensaje con info del inspector auto-asignado si aplica
        const autoAssignedMsg = result.results?.autoAssigned
          ? ` Inspector ${result.results.autoAssigned.inspectorName} asignado automáticamente.`
          : '';
        setSaveMessage({ type: 'success', text: `Cambios guardados correctamente.${autoAssignedMsg}` });
        setTimeout(() => {
          onSaveSuccess();
        }, 1500);
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'Error al guardar' });
      }
    });
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-[60]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="
          fixed right-0 top-0 h-full w-full sm:max-w-lg
          bg-white shadow-xl z-[70]
          animate-slideInRight
          flex flex-col
        "
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[#2D2D2D]">
                Inspección {inspection.code}
              </h2>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
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
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs - scrollable on mobile */}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 mt-4 sm:mt-6">
            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 sm:overflow-visible">
              {[
                { id: 'details', label: 'Detalles' },
                { id: 'history', label: 'Historial' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`
                    px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg flex-shrink-0
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'details' && (
            <div className="space-y-5">
              {/* Resumen superior: cliente + vehículo */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#2D2D2D] text-sm">{inspection.client.name}</p>
                    <p className="text-xs text-gray-400">{inspection.client.email}</p>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-mono">{inspection.inspectionType}</span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#2D2D2D] text-sm">
                      {inspection.vehicle.brand} {inspection.vehicle.model} {inspection.vehicle.year}
                    </p>
                    <p className="text-xs text-gray-400">{inspection.vehicle.plate || 'Sin placa'}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#2D2D2D]">S/ {inspection.inspectionPlanPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Fecha y hora */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Fecha y hora</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={editedDate}
                    onChange={(e) => setEditedDate(e.target.value)}
                    disabled={isPending}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C] bg-white"
                  />
                  <select
                    value={editedTimeSlot}
                    onChange={(e) => setEditedTimeSlot(e.target.value)}
                    disabled={isPending || isSunday}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C] bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    {isSunday ? (
                      <option value="">No disponible</option>
                    ) : (
                      timeSlots.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))
                    )}
                  </select>
                </div>
                {isSunday && (
                  <p className="text-xs text-red-500 mt-1.5">Los domingos no hay atención</p>
                )}
              </div>

              {/* Ubicación */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ubicación</label>
                  {(editedAddress || inspection.locationUrl) && (
                    <a
                      href={inspection.locationUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(editedAddress + (editedDistrict ? ', ' + editedDistrict + ', Lima' : ''))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      Ver en Maps
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editedDistrict}
                    onChange={(e) => setEditedDistrict(e.target.value)}
                    placeholder="Distrito"
                    disabled={isPending}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C] bg-white"
                  />
                  <input
                    type="text"
                    value={editedAddress}
                    onChange={(e) => setEditedAddress(e.target.value)}
                    placeholder="Dirección"
                    disabled={isPending}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C] bg-white col-span-2"
                  />
                </div>
              </div>

              {/* Estado del pago */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Estado del pago</label>
                <select
                  value={editedStatus}
                  onChange={(e) => setEditedStatus(e.target.value as BookingStatus)}
                  disabled={isPending}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C] bg-white"
                >
                  <option value="PENDING_PAYMENT">Pendiente de pago</option>
                  <option value="PENDING_VERIFICATION">Verificando pago</option>
                  <option value="PAID">Pagado</option>
                  <option value="COMPLETED">Completado</option>
                  <option value="CANCELLED">Cancelado</option>
                  <option value="NO_SHOW">No se presentó</option>
                  <option value="EXPIRED">Expirado</option>
                </select>
                <p className="text-xs text-gray-400 mt-1.5">
                  {{
                    PENDING_PAYMENT: 'El cliente aún no ha realizado el pago',
                    PENDING_VERIFICATION: 'El cliente envió comprobante, revisar y confirmar',
                    PAID: 'Pago confirmado, la inspección puede proceder',
                    COMPLETED: 'Inspección finalizada con reporte generado',
                    CANCELLED: 'Inspección cancelada, no se realizará',
                    NO_SHOW: 'El cliente no se presentó en la fecha acordada',
                    EXPIRED: 'La reserva venció sin recibir pago',
                  }[editedStatus]}
                </p>
              </div>

              {/* Comprobante de pago */}
              {inspection.payment?.voucherUrl && (
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Comprobante de pago</label>
                  <a href={inspection.payment.voucherUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <img
                      src={inspection.payment.voucherUrl}
                      alt="Comprobante"
                      className="max-w-full max-h-48 rounded-lg border border-gray-200 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </a>
                </div>
              )}

              {/* Inspector */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Inspector</label>
                <select
                  value={editedInspectorId || ''}
                  onChange={(e) => setEditedInspectorId(e.target.value || null)}
                  disabled={isPending}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C] bg-white"
                >
                  <option value="">Sin asignar</option>
                  {inspectors.map((inspector) => (
                    <option key={inspector.id} value={inspector.id}>
                      {inspector.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notas admin */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                  Notas del administrador
                </label>
                <textarea
                  placeholder="Agregar notas..."
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  disabled={isPending}
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C] bg-white"
                />
              </div>

              {/* Notas del cliente e inspector (solo lectura) */}
              {(inspection.clientNotes || inspection.inspectorNotes) && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  {inspection.clientNotes && (
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Nota del cliente</label>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{inspection.clientNotes}</p>
                    </div>
                  )}
                  {inspection.inspectorNotes && (
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Nota del inspector</label>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{inspection.inspectorNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <HistoryTab inspectionId={inspection.id} createdAt={inspection.createdAt} />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-200 bg-white">
          {/* Mensaje de feedback */}
          {saveMessage && (
            <div
              className={`mb-3 sm:mb-4 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium ${saveMessage.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
                }`}
            >
              {saveMessage.text}
            </div>
          )}

          <div className="flex gap-3">
            {(['CANCELLED', 'EXPIRED', 'NO_SHOW'] as string[]).includes(inspection.status) && (
              <button
                onClick={() => {
                  if (!confirm('¿Eliminar esta inspección cancelada? Esta acción no se puede deshacer.')) return;
                  startTransition(async () => {
                    const result = await deleteCancelledInspectionAction(inspection.id);
                    if (result.success) {
                      onClose();
                      window.location.reload();
                    } else {
                      setSaveMessage({ type: 'error', text: result.error || 'Error al eliminar' });
                    }
                  });
                }}
                disabled={isPending}
                className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isPending || !hasChanges}
              className={`
                flex-1 px-4 py-2.5 text-sm sm:text-base font-semibold rounded-lg transition-all
                ${hasChanges
                  ? 'bg-[#FFE14C] text-[#2D2D2D] hover:bg-[#FFD700]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
                disabled:opacity-50
              `}
            >
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ============================================
// Panel para crear inspección manual
// ============================================

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface InspectorWithAvailability extends Inspector {
  available?: boolean;
}

function CreateInspectionPanel({ inspectors, onClose, onSuccess, }: { inspectors: Inspector[]; onClose: () => void; onSuccess: () => void; }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Datos de catálogos
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [plans, setPlans] = useState<InspectionPlan[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);

  // Búsqueda de clientes
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [searchedClients, setSearchedClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [searchingClients, setSearchingClients] = useState(false);

  // Disponibilidad de horarios
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Inspectores disponibles con disponibilidad
  const [inspectorsWithAvailability, setInspectorsWithAvailability] = useState<InspectorWithAvailability[]>([]);
  const [loadingInspectors, setLoadingInspectors] = useState(false);

  // Formulario
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    brandId: '',
    modelId: '',
    passClient: '',
    year: new Date().getFullYear(),
    plate: '',
    inspectionPlanId: '',
    date: '',
    timeSlot: '',
    inspectorId: '',
    adminNotes: '',
    district: '',
    address: '',
    locationUrl: '',
    isDomicilio: true,
    isInspectionPaid: false,
  });

  // Cargar marcas y planes al montar
  useEffect(() => {
    async function loadInitialData() {
      const [brandsRes, plansRes] = await Promise.all([
        getBrandsAction(),
        getInspectionPlansAction(),
      ]);

      if (brandsRes.success && brandsRes.brands) {
        setBrands(brandsRes.brands);
      }
      if (plansRes.success && plansRes.plans) {
        setPlans(plansRes.plans);
      }
      setLoadingBrands(false);
    }
    loadInitialData();
  }, []);

  // Cargar modelos cuando cambia la marca
  useEffect(() => {
    if (!formData.brandId) {
      setModels([]);
      return;
    }

    async function loadModels() {
      setLoadingModels(true);
      const res = await getModelsAction(Number(formData.brandId));
      if (res.success && res.models) {
        setModels(res.models);
      }
      setLoadingModels(false);
    }
    loadModels();
  }, [formData.brandId]);

  // Cargar todos los clientes al montar y filtrar localmente
  const [allClients, setAllClients] = useState<Client[]>([]);
  useEffect(() => {
    async function loadClients() {
      setSearchingClients(true);
      const res = await searchClientsAction('');
      if (res.success && res.clients) {
        setAllClients(res.clients);
        setSearchedClients(res.clients);
      }
      setSearchingClients(false);
    }
    loadClients();
  }, []);

  useEffect(() => {
    if (!clientSearchQuery) {
      setSearchedClients(allClients);
      return;
    }
    const q = clientSearchQuery.toLowerCase();
    setSearchedClients(allClients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    ));
  }, [clientSearchQuery, allClients]);

  // Cargar disponibilidad de horarios cuando cambia la fecha
  useEffect(() => {
    if (!formData.date) {
      setAvailableTimeSlots([]);
      return;
    }

    async function loadAvailability() {
      setLoadingSlots(true);
      const res = await getAvailabilityForDateAction(formData.date);
      if (res.success && res.availability) {
        const available = res.availability.slots
          .filter((slot: { available: boolean }) => slot.available)
          .map((slot: { time: string }) => slot.time);
        setAvailableTimeSlots(available);

        // Si el slot seleccionado ya no está disponible, limpiarlo
        if (formData.timeSlot && !available.includes(formData.timeSlot)) {
          setFormData(prev => ({ ...prev, timeSlot: '', inspectorId: '' }));
        }
      }
      setLoadingSlots(false);
    }
    loadAvailability();
  }, [formData.date]);

  // Cargar inspectores disponibles cuando cambia fecha o hora
  useEffect(() => {
    if (!formData.date || !formData.timeSlot) {
      setInspectorsWithAvailability(inspectors.map(i => ({ ...i, available: true })));
      return;
    }

    async function loadInspectorsAvailability() {
      setLoadingInspectors(true);
      const res = await getAvailableInspectorsForSlotAction(formData.date, formData.timeSlot);
      if (res.success && res.inspectors) {
        setInspectorsWithAvailability(res.inspectors);

        // Si el inspector seleccionado ya no está disponible, limpiarlo
        const selectedInspectorAvailable = res.inspectors.find(
          (i: InspectorWithAvailability) => i.id === formData.inspectorId && i.available
        );
        if (formData.inspectorId && !selectedInspectorAvailable) {
          setFormData(prev => ({ ...prev, inspectorId: '' }));
        }
      }
      setLoadingInspectors(false);
    }
    loadInspectorsAvailability();
  }, [formData.date, formData.timeSlot, inspectors]);

  // Obtener rango de años del modelo seleccionado
  const selectedModel = models.find(m => m.id === Number(formData.modelId));
  const yearRange = selectedModel
    ? Array.from(
      { length: selectedModel.yearTo - selectedModel.yearFrom + 1 },
      (_, i) => selectedModel.yearTo - i
    )
    : Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

  // Handlers para selección de cliente
  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      ...formData,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone || '',
    });
    setShowNewClientForm(false);
    setClientSearchQuery('');
    setSearchedClients([]);
  };

  const handleCreateNewClient = () => {
    setShowNewClientForm(true);
    setSelectedClient(null);
    setClientSearchQuery('');
    setSearchedClients([]);
    setFormData({
      ...formData,
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      passClient: '',
    });
  };

  const handleSubmit = () => {
    setMessage(null);

    // Validaciones básicas
    if (!selectedClient && !showNewClientForm) {
      setMessage({ type: 'error', text: 'Busca un cliente existente o crea uno nuevo' });
      return;
    }
    if (showNewClientForm) {
      if (!formData.clientName.trim()) {
        setMessage({ type: 'error', text: 'El nombre del cliente es requerido' });
        return;
      }
      if (!formData.clientEmail.trim() || !formData.clientEmail.includes('@')) {
        setMessage({ type: 'error', text: 'Email inválido' });
        return;
      }
      if (!formData.passClient.trim()) {
        setMessage({ type: 'error', text: 'La contraseña del cliente es requerida para nuevos clientes' });
        return;
      }
    }
    if (!formData.modelId) {
      setMessage({ type: 'error', text: 'Selecciona un modelo de vehículo' });
      return;
    }
    if (!formData.inspectionPlanId) {
      setMessage({ type: 'error', text: 'Selecciona un plan de inspección' });
      return;
    }
    if (!formData.date) {
      setMessage({ type: 'error', text: 'Selecciona una fecha' });
      return;
    }
    if (!formData.timeSlot) {
      setMessage({ type: 'error', text: 'Selecciona un horario' });
      return;
    }

    startTransition(async () => {
      const phone = formData.clientPhone || undefined;

      const result = await createManualInspectionAction({
        clientName: formData.clientName.trim(),
        clientEmail: formData.clientEmail.trim(),
        clientPhone: phone,
        brandId: Number(formData.brandId),
        modelId: Number(formData.modelId),
        year: formData.year,
        plate: formData.plate.trim() || undefined,
        inspectionPlanId: Number(formData.inspectionPlanId),
        date: formData.date,
        timeSlot: formData.timeSlot,
        inspectorId: formData.inspectorId || undefined,
        adminNotes: formData.adminNotes.trim() || undefined,
        district: formData.district || undefined,
        address: formData.address.trim() || undefined,
        locationUrl: formData.locationUrl.trim() || undefined,
        isDomicilio: formData.isDomicilio,
        isInspectionPaid: formData.isInspectionPaid,
        passClient: formData.passClient,
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Inspección creada correctamente' });
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al crear la inspección' });
      }
    });
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-[60]" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-lg bg-white shadow-xl z-[70] animate-slideInRight flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[#2D2D2D]">
                Nueva Inspección Manual
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Crear reserva para cliente de WhatsApp
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Buscar o crear cliente */}
            <div className="bg-gray-100 rounded-lg p-4 border-l-4 border-yellow-400">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Cliente
              </h3>

              {!selectedClient && !showNewClientForm && (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar cliente por nombre, email o teléfono..."
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C] focus:border-[#FFE14C] transition-colors"
                    />
                    {searchingClients && (
                      <div className="absolute right-3 top-2.5">
                        <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Resultados de búsqueda */}
                  {searchedClients.length > 0 && (
                    <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                      {searchedClients.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => handleSelectClient(client)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <p className="font-medium text-sm text-[#2D2D2D]">{client.name}</p>
                          <p className="text-xs text-gray-500">{client.email}</p>
                          {client.phone && <p className="text-xs text-gray-400">{client.phone}</p>}
                        </button>
                      ))}
                    </div>
                  )}

                  {!searchingClients && searchedClients.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      No se encontraron clientes
                    </p>
                  )}

                  <button
                    onClick={handleCreateNewClient}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-200 text-gray-600 rounded-lg hover:border-[#FFE14C] hover:text-[#2D2D2D] transition-colors text-sm font-medium"
                  >
                    + Crear nuevo cliente
                  </button>
                </div>
              )}

              {selectedClient && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium text-sm text-[#2D2D2D]">{selectedClient.name}</p>
                      <p className="text-xs text-gray-500">{selectedClient.email}</p>
                      {selectedClient.phone && <p className="text-xs text-gray-400">{selectedClient.phone}</p>}
                    </div>
                    <button
                      onClick={() => setSelectedClient(null)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {showNewClientForm && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500">Creando nuevo cliente</p>
                    <button
                      onClick={() => setShowNewClientForm(false)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Cancelar
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Nombre completo *"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C] focus:border-[#FFE14C] transition-colors"
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C] focus:border-[#FFE14C] transition-colors"
                  />
                  <input
                    type="password"
                    placeholder="Contraseña para el cliente *"
                    value={formData.passClient}
                    onChange={(e) => setFormData({ ...formData, passClient: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C] focus:border-[#FFE14C] transition-colors"
                  />
                  <PhoneInput
                    value={formData.clientPhone}
                    onChange={(fullPhone) => setFormData({ ...formData, clientPhone: fullPhone })}
                  />
                </div>
              )}
            </div>

            {/* Datos del vehículo */}
            <div className="bg-gray-100 rounded-lg p-4 border-l-4 border-yellow-400">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Datos del vehículo
              </h3>
              <div className="space-y-3">
                <select
                  value={formData.brandId}
                  onChange={(e) => setFormData({ ...formData, brandId: e.target.value, modelId: '' })}
                  disabled={loadingBrands}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C] focus:border-[#FFE14C] transition-colors"
                >
                  <option value="">Seleccionar marca *</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>

                <select
                  value={formData.modelId}
                  onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                  disabled={!formData.brandId || loadingModels}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C] focus:border-[#FFE14C] transition-colors disabled:bg-gray-100"
                >
                  <option value="">
                    {loadingModels ? 'Cargando modelos...' : 'Seleccionar modelo *'}
                  </option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex gap-2">
                    <select
                      value={yearRange.includes(formData.year) ? formData.year : 'other'}
                      onChange={(e) => {
                        if (e.target.value === 'other') {
                          setFormData({ ...formData, year: 0 });
                        } else {
                          setFormData({ ...formData, year: Number(e.target.value) });
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C] focus:border-[#FFE14C] transition-colors"
                    >
                      {yearRange.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                      <option value="other">Otro...</option>
                    </select>
                    {!yearRange.includes(formData.year) && (
                      <input
                        type="number"
                        placeholder="Año"
                        value={formData.year || ''}
                        onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                        min={1950}
                        max={new Date().getFullYear() + 1}
                        className="w-20 px-2 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C] focus:border-[#FFE14C] transition-colors"
                      />
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Placa (opcional)"
                    value={formData.plate}
                    onChange={(e) => {
                      let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      if (value.length > 3) {
                        value = value.slice(0, 3) + '-' + value.slice(3, 6);
                      }
                      setFormData({ ...formData, plate: value });
                    }}
                    maxLength={7}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]"
                  />
                </div>
              </div>
            </div>

            {/* Plan de inspección */}
            <div className="bg-gray-100 rounded-lg p-4 border-l-4 border-yellow-400">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Plan de inspección
              </h3>
              <select
                value={formData.inspectionPlanId}
                onChange={(e) => setFormData({ ...formData, inspectionPlanId: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C] focus:border-[#FFE14C] transition-colors"
              >
                <option value="">Seleccionar plan *</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.title} - S/{plan.price}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha y hora */}
            <div className="bg-gray-100 rounded-lg p-4 border-l-4 border-yellow-400">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Fecha y hora
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value, timeSlot: '', inspectorId: '' })}
                  min={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C] focus:border-[#FFE14C] transition-colors"
                />
                <div className="relative">
                  <select
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value, inspectorId: '' })}
                    disabled={!formData.date || loadingSlots}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C] focus:border-[#FFE14C] transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed w-full"
                  >
                    <option value="">
                      {loadingSlots ? 'Cargando...' : formData.date ? 'Selecciona horario *' : 'Primero selecciona fecha'}
                    </option>
                    {availableTimeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                  {loadingSlots && (
                    <div className="absolute right-3 top-2.5">
                      <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              {formData.date && availableTimeSlots.length === 0 && !loadingSlots && (
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ No hay horarios disponibles para esta fecha
                </p>
              )}
            </div>

            {/* Ubicación */}
            <div className="bg-gray-100 rounded-lg p-4 border-l-4 border-yellow-400">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Ubicación
              </h3>
              <div className="space-y-3">
                <select
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C] focus:border-[#FFE14C] transition-colors"
                >
                  <option value="">Seleccionar distrito</option>
                  {[
                    'Ate', 'Barranco', 'Breña', 'Callao', 'Carabayllo', 'Chaclacayo',
                    'Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino', 'Independencia',
                    'Jesús María', 'La Molina', 'La Victoria', 'Lima Cercado', 'Lince',
                    'Los Olivos', 'Lurín', 'Magdalena del Mar', 'Miraflores',
                    'Pachacámac', 'Pueblo Libre', 'Puente Piedra', 'Punta Negra',
                    'Rímac', 'San Bartolo', 'San Borja', 'San Isidro',
                    'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis',
                    'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa Rosa',
                    'Santiago de Surco', 'Surquillo', 'Villa El Salvador',
                    'Villa María del Triunfo',
                  ].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Dirección (ej: Av. Javier Prado 1234)"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C] focus:border-[#FFE14C] transition-colors"
                />
                <input
                  type="url"
                  placeholder="URL de Google Maps (pegar enlace)"
                  value={formData.locationUrl}
                  onChange={(e) => setFormData({ ...formData, locationUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C] focus:border-[#FFE14C] transition-colors"
                />
                {formData.locationUrl && !/(google|maps|goo\.gl)/i.test(formData.locationUrl) && (
                  <p className="text-xs text-amber-600">
                    La URL no parece ser de Google Maps
                  </p>
                )}
              </div>
            </div>

            {/* Inspector */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Inspector
              </h3>
              <div className="relative">
                <select
                  value={formData.inspectorId}
                  onChange={(e) => setFormData({ ...formData, inspectorId: e.target.value })}
                  disabled={loadingInspectors}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C] focus:border-[#FFE14C] transition-colors disabled:bg-gray-100"
                >
                  <option value="">Sin asignar (se asignará automáticamente)</option>
                  {inspectorsWithAvailability.length > 0 ? (
                    inspectorsWithAvailability.map((inspector) => (
                      <option
                        key={inspector.id}
                        value={inspector.id}
                        disabled={!inspector.available}
                      >
                        {inspector.name} {inspector.available === false ? '(Ocupado)' : ''}
                      </option>
                    ))
                  ) : (
                    inspectors.map((inspector) => (
                      <option key={inspector.id} value={inspector.id}>
                        {inspector.name}
                      </option>
                    ))
                  )}
                </select>
                {loadingInspectors && (
                  <div className="absolute right-3 top-2.5">
                    <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
              </div>
              {formData.date && formData.timeSlot && (
                <p className="text-xs text-gray-500 mt-2">
                  💡 Los inspectores ocupados se mostrarán deshabilitados
                </p>
              )}
            </div>

            {/* Notas */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Notas del administrador
              </h3>
              <textarea
                placeholder="Agregar notas (ej: Cliente contactó por WhatsApp...)"
                value={formData.adminNotes}
                onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]"
              />
            </div>

            {/* Pago */}
            <div className="bg-gray-100 rounded-lg p-4 border-l-4 border-yellow-400">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                Pago
              </h3>
              <p className="text-xs text-gray-400 mb-3">(Se recomienda seleccionar después de la inspección)</p>
              <div className="space-y-3">
                {/* Toggle Domicilio / Showroom - solo para básica y completa */}
                {(() => {
                  const selectedPlan = plans.find(p => p.id === Number(formData.inspectionPlanId));
                  const isBasicaOrCompleta = selectedPlan && (selectedPlan.type === 'basica' || selectedPlan.type === 'completa');
                  const reservationAmount = 50;
                  const totalPrice = selectedPlan?.price ?? 0;
                  const remainingPrice = totalPrice - reservationAmount;

                  return (
                    <>
                      {isBasicaOrCompleta && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-medium text-gray-700">Modalidad</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${!formData.isDomicilio ? 'font-semibold text-[#2D2D2D]' : 'text-gray-400'}`}>
                              Showroom
                            </span>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, isDomicilio: !formData.isDomicilio })}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isDomicilio ? 'bg-[#FFE14C]' : 'bg-gray-300'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isDomicilio ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <span className={`text-xs ${formData.isDomicilio ? 'font-semibold text-[#2D2D2D]' : 'text-gray-400'}`}>
                              A domicilio
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Checkbox Pago Inspección */}
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <input
                          type="checkbox"
                          id="isInspectionPaid"
                          checked={formData.isInspectionPaid}
                          onChange={(e) => setFormData({ ...formData, isInspectionPaid: e.target.checked })}
                          className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                        />
                        <label htmlFor="isInspectionPaid" className="text-sm font-medium text-green-800">
                          Pago inspección completado
                          {selectedPlan && (
                            <span className="ml-1 text-green-600">
                              — S/{isBasicaOrCompleta && formData.isDomicilio ? remainingPrice : totalPrice}
                            </span>
                          )}
                        </label>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-200 bg-white">
          {message && (
            <div
              className={`mb-3 sm:mb-4 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium ${message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
                }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={onClose}
              disabled={isPending}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 text-gray-600 text-sm sm:text-base font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#FFE14C] text-[#2D2D2D] text-sm sm:text-base font-semibold rounded-lg hover:bg-[#FFD700] transition-colors disabled:opacity-50"
            >
              {isPending ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

export function AdminInspeccionesClient({
  inspections,
  stats,
  inspectors,
}: AdminInspeccionesClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inspectorFilter, setInspectorFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [verifyConfirmId, setVerifyConfirmId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [brandFilter, setBrandFilter] = useState('all');
  const [tempFilter, setTempFilter] = useState('all');
  const [tempStatusFilter, setTempStatusFilter] = useState('all');
  const [tempInspectorFilter, setTempInspectorFilter] = useState('all');
  const [tempBrandFilter, setTempBrandFilter] = useState('all');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const activeFilterCount = [statusFilter, inspectorFilter, brandFilter].filter(f => f !== 'all').length;

  const openFilters = () => {
    setTempStatusFilter(statusFilter);
    setTempInspectorFilter(inspectorFilter);
    setTempBrandFilter(brandFilter);
    setShowFilters(true);
  };

  const applyFilters = () => {
    setStatusFilter(tempStatusFilter);
    setInspectorFilter(tempInspectorFilter);
    setBrandFilter(tempBrandFilter);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setTempStatusFilter('all');
    setTempInspectorFilter('all');
    setTempBrandFilter('all');
  };

  const handleVerifyPayment = (inspectionId: number) => {
    setVerifyConfirmId(inspectionId);
  };

  const executeVerifyPayment = async () => {
    const inspectionId = verifyConfirmId;
    if (!inspectionId) return;
    setVerifyConfirmId(null);
    setVerifyingId(inspectionId);
    try {
      const res = await fetch(`/api/admin/bookings/${inspectionId}/verify-payment`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Error al verificar el pago');
        return;
      }

      alert(data.message);
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredInspections = inspections.filter((inspection) => {
    if (filter !== 'all') {
      const vi = inspection.vehicleInspection;

      if (filter === 'PENDING_ADMIN') {
        // Tareas pendientes para admin (revisión legal)
        if (!vi || !['PENDIENTE', 'EN_PROCESO'].includes(vi.legalStatus)) {
          return false;
        }
      } else if (filter === 'PENDING_MECHANIC') {
        // Tareas pendientes para mecánico (inspección mecánica)
        if (!vi || !['PENDIENTE', 'EN_PROCESO'].includes(vi.mechanicalStatus)) {
          return false;
        }
      } else if (filter === 'COMPLETED_MECHANIC') {
        // Solo mecánico completó (mecánico listo, admin pendiente)
        if (!vi || vi.mechanicalStatus !== 'COMPLETADO' || vi.legalStatus === 'COMPLETADO') {
          return false;
        }
      } else if (filter === 'COMPLETED_ADMIN') {
        // Solo admin completó (admin listo, mecánico pendiente)
        if (!vi || vi.legalStatus !== 'COMPLETADO' || vi.mechanicalStatus === 'COMPLETADO') {
          return false;
        }
      } else if (filter === 'FULLY_COMPLETED') {
        // Inspecciones completamente terminadas (ambos completados)
        if (!vi || vi.legalStatus !== 'COMPLETADO' || vi.mechanicalStatus !== 'COMPLETADO') {
          return false;
        }
      }
    }
    if (statusFilter !== 'all' && inspection.status !== statusFilter) {
      return false;
    }
    if (inspectorFilter !== 'all') {
      if (inspectorFilter === 'none') {
        if (inspection.inspector) return false;
      } else {
        if (inspection.inspector?.id !== inspectorFilter) return false;
      }
    }
    if (brandFilter !== 'all' && inspection.vehicle.brand !== brandFilter) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        inspection.client.name.toLowerCase().includes(query) ||
        (inspection.vehicle.plate?.toLowerCase().includes(query) ?? false) ||
        inspection.code.toLowerCase().includes(query) ||
        inspection.vehicle.brand.toLowerCase().includes(query) ||
        inspection.vehicle.model.toLowerCase().includes(query) ||
        String(inspection.vehicle.year).includes(query) ||
        (inspection.inspector?.name.toLowerCase().includes(query) ?? false)
      );
    }
    return true;
  });

  // Calcular paginación
  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInspections = filteredInspections.slice(startIndex, endIndex);

  // Resetear página cuando cambia filtro o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  const handleSaveSuccess = () => {
    setSelectedInspection(null);
    router.refresh();
  };

  const handleCreateSuccess = () => {
    setShowCreatePanel(false);
    router.refresh();
  };

  return (
    <div className="bg-white w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#2D2D2D]">
              Inspecciones
            </h1>
            <button
              onClick={() => setShowCreatePanel(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#FFE14C] text-[#2D2D2D] font-semibold rounded-lg hover:bg-[#FFD700] transition-colors text-sm whitespace-nowrap relative z-10"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden xs:inline">Nueva</span>

              <span className="hidden sm:inline">Inspección</span>
            </button>
          </div>

          {/* Stats - Horizontal scroll en móvil */}
          <div className="mt-3 sm:mt-4">
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-5 sm:overflow-visible -webkit-overflow-scrolling-touch">
              {statsConfig.map((stat) => (
                <div
                  key={stat.key}
                  className={`${stat.bg} rounded-lg p-2.5 sm:p-3 flex-shrink-0 w-28 sm:w-auto`}
                >
                  <p className={`text-lg sm:text-xl font-bold ${stat.color}`}>
                    {stats[stat.key as keyof Stats]}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-600 whitespace-nowrap">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Mobile Cards View */}
        <div className="sm:hidden space-y-3">
          {filteredInspections.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500">
              No se encontraron inspecciones
            </div>
          ) : (
            paginatedInspections.map((inspection) => (
              <div
                key={inspection.id}
                className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#FFE14C] transition-colors"
                onClick={() => setSelectedInspection(inspection)}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={inspection.client.name} size="sm" />
                    <div className="min-w-0">
                      <p className="font-medium text-[#2D2D2D] text-sm truncate">{inspection.client.name}</p>
                      <p className="text-xs text-gray-500 truncate">{inspection.client.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={inspection.status} size="sm" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-[#2D2D2D]">
                      {inspection.vehicle.brand} {inspection.vehicle.model}
                    </p>
                    <p className="text-xs text-gray-500">
                      {inspection.vehicle.year}{inspection.vehicle.plate ? ` · ${inspection.vehicle.plate}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{formatearFechaHoraCorta(inspection.startTime)}</p>
                    {inspection.inspector && (
                      <p className="text-xs text-gray-400">{inspection.inspector.name}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-1.5 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                  {inspection.status === 'PENDING_VERIFICATION' && inspection.payment?.method && paymentMethodBadge[inspection.payment.method] && (
                    <span className={`inline-flex items-center px-2 py-1 text-[10px] font-semibold rounded-full ${paymentMethodBadge[inspection.payment.method].bg} ${paymentMethodBadge[inspection.payment.method].text}`}>
                      {paymentMethodBadge[inspection.payment.method].label}
                    </span>
                  )}
                  {inspection.status === 'PENDING_VERIFICATION' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVerifyPayment(inspection.id);
                      }}
                      disabled={verifyingId === inspection.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors disabled:opacity-50"
                    >
                      {verifyingId === inspection.id ? (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      Verificar
                    </button>
                  )}
                  {inspection.vehicleInspection && (
                    inspection.vehicleInspection.legalStatus === 'BLOQUEADO' ? (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-400 cursor-not-allowed opacity-60"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Legal
                      </span>
                    ) : (
                      <a
                        href={`/admin/vehicle-inspections/${inspection.vehicleInspection.id}/legal`}
                        onClick={(e) => e.stopPropagation()}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          inspection.vehicleInspection.legalStatus === 'COMPLETADO'
                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                            : inspection.vehicleInspection.legalStatus === 'EN_PROCESO'
                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {inspection.vehicleInspection.legalStatus === 'COMPLETADO' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          )}
                        </svg>
                        {inspection.vehicleInspection.legalStatus === 'COMPLETADO'
                          ? 'Legal ✓'
                          : inspection.vehicleInspection.legalStatus === 'EN_PROCESO'
                          ? 'Legal...'
                          : 'Legal'}
                      </a>
                    )
                  )}
                  {(inspection.reportId || inspection.vehicleInspection?.mechanicalStatus === 'COMPLETADO') && (
                    <a
                      href={`/admin/inspecciones/${inspection.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Reporte
                    </a>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInspection(inspection);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver
                  </button>
                </div>
              </div>
            ))
          )}
          {/* Mobile pagination */}
          <div className="py-4 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <label className="text-sm text-gray-500">Por página:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600 px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
            <p className="text-center text-sm text-gray-500">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredInspections.length)} de {filteredInspections.length}
            </p>
          </div>
        </div>

        {/* Desktop Table */}
        <div className={`hidden sm:block bg-white border border-gray-200 rounded-xl shadow-sm ${showFilters ? 'overflow-visible' : 'overflow-hidden'}`}>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th colSpan={3} className="p-0">
                  <div className="px-5 py-2 border-b border-gray-200 flex justify-end items-center gap-2">
                    <input
                      type="text"
                      placeholder="Buscar por nombre, placa, vehículo o inspector..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full max-w-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#FFE14C] text-sm"
                    />
                    <div className="relative">
                      <button
                        onClick={openFilters}
                        className={`p-2 rounded-lg border transition-colors ${activeFilterCount > 0 ? 'border-[#FFE14C] bg-[#FFE14C]/10 text-[#2D2D2D]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        {activeFilterCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#FFE14C] text-[#2D2D2D] text-[10px] font-bold rounded-full flex items-center justify-center">
                            {activeFilterCount}
                          </span>
                        )}
                      </button>
                      {showFilters && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                          <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                            <div className="p-4 space-y-4">
                              <div>
                                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5 block">Estado de pago</label>
                                <select
                                  value={tempStatusFilter}
                                  onChange={(e) => setTempStatusFilter(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#FFE14C] bg-white"
                                >
                                  {statusPills.map((pill) => (
                                    <option key={pill.value} value={pill.value}>{pill.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5 block">Marca</label>
                                <select
                                  value={tempBrandFilter}
                                  onChange={(e) => setTempBrandFilter(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#FFE14C] bg-white"
                                >
                                  <option value="all">Todas</option>
                                  {[...new Set(inspections.map((i) => i.vehicle.brand))].sort().map((brand) => (
                                    <option key={brand} value={brand}>{brand}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5 block">Inspector</label>
                                <select
                                  value={tempInspectorFilter}
                                  onChange={(e) => setTempInspectorFilter(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#FFE14C] bg-white"
                                >
                                  <option value="all">Todos</option>
                                  <option value="none">Sin asignar</option>
                                  {inspectors.map((ins) => (
                                    <option key={ins.id} value={ins.id}>{ins.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50">
                              <button
                                onClick={clearFilters}
                                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                Limpiar filtros
                              </button>
                              <button
                                onClick={applyFilters}
                                className="px-4 py-1.5 bg-[#FFE14C] text-[#2D2D2D] text-sm font-semibold rounded-lg hover:bg-[#FFD700] transition-colors"
                              >
                                Aplicar
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-1 px-5 py-3 text-left text-xs font-bold text-[#2D2D2D] uppercase tracking-wider">
                      Vehículo
                    </div>
                    <div className="px-5 py-3 text-left text-xs font-bold text-[#2D2D2D] uppercase tracking-wider whitespace-nowrap" style={{ width: 240, flexShrink: 0 }}>
                      Fecha de Inspección
                    </div>
                    <div className="px-5 py-3 text-left text-xs font-bold text-[#2D2D2D] uppercase tracking-wider" style={{ width: 240, flexShrink: 0 }}>
                      Inspector
                    </div>
                    <div className="px-5 py-3 text-right text-xs font-bold text-[#2D2D2D] uppercase tracking-wider" style={{ width: 240, flexShrink: 0 }}>
                      Estado
                    </div>
                    <div className="pr-4 py-3" style={{ width: 32, flexShrink: 0 }} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron inspecciones
                  </td>
                </tr>
              ) : (
                paginatedInspections.map((inspection) => {
                  const isExpanded = expandedId === inspection.id;
                  return (
                    <tr
                      key={inspection.id}
                      className="group"
                    >
                      <td colSpan={3} className={`p-0 ${isExpanded ? 'border-l-3 border-l-[#FFE14C]' : ''}`}>
                        {/* Main row */}
                        <div
                          className={`flex items-center cursor-pointer transition-colors ${isExpanded ? 'bg-[#FFFDF0]' : 'bg-white hover:bg-gray-50'}`}
                          onClick={() => setExpandedId(isExpanded ? null : inspection.id)}
                        >
                          <div className="flex-1 px-5 py-2.5">
                            <p className="font-medium text-[#2D2D2D] text-sm">
                              {inspection.vehicle.brand} {inspection.vehicle.model}
                            </p>
                            <p className="text-xs text-gray-500">
                              {inspection.vehicle.year}{inspection.vehicle.plate ? ` · ${inspection.vehicle.plate}` : ''} · {inspection.client.name}
                            </p>
                          </div>
                          <div className="px-5 py-2.5 whitespace-nowrap" style={{ width: 240, flexShrink: 0 }}>
                            <p className="text-[#2D2D2D] text-sm">{formatearFechaHoraCorta(inspection.startTime)}</p>
                          </div>
                          <div className="px-5 py-2.5" style={{ width: 240, flexShrink: 0 }}>
                            {inspection.inspector ? (
                              <p className="text-sm text-[#2D2D2D] truncate">{inspection.inspector.name}</p>
                            ) : (
                              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Sin asignar</span>
                            )}
                          </div>
                          <div className="px-5 py-2.5 flex items-center justify-end gap-1.5 flex-wrap" style={{ width: 240, flexShrink: 0 }}>
                            <StatusBadge status={inspection.status} size="sm" />
                            {inspection.status === 'PENDING_VERIFICATION' && inspection.payment?.method && paymentMethodBadge[inspection.payment.method] && (
                              <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full ${paymentMethodBadge[inspection.payment.method].bg} ${paymentMethodBadge[inspection.payment.method].text}`}>
                                {paymentMethodBadge[inspection.payment.method].label}
                              </span>
                            )}
                          </div>
                          <div className="pr-4 py-2.5 flex items-center" style={{ flexShrink: 0 }}>
                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="bg-[#FFFDF0] border-t border-[#FFE14C]/20 px-5 py-3 flex items-center gap-6 flex-wrap">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Tipo</p>
                              <p className="text-sm text-[#2D2D2D]">{inspection.inspectionType}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Monto</p>
                              <p className="text-sm text-[#2D2D2D] font-medium">S/ {inspection.inspectionPlanPrice.toFixed(2)}</p>
                            </div>
                            {inspection.district && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Distrito</p>
                                <p className="text-sm text-[#2D2D2D]">{inspection.district}</p>
                              </div>
                            )}
                            <div className="ml-auto flex items-center gap-2">
                              {inspection.status === 'PENDING_VERIFICATION' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVerifyPayment(inspection.id);
                                  }}
                                  disabled={verifyingId === inspection.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FFE14C] text-[#2D2D2D] hover:bg-[#FFD700] transition-colors disabled:opacity-50"
                                >
                                  {verifyingId === inspection.id ? (
                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  Verificar pago
                                </button>
                              )}
                              {inspection.vehicleInspection && inspection.vehicleInspection.legalStatus !== 'BLOQUEADO' && (
                                <a
                                  href={`/admin/vehicle-inspections/${inspection.vehicleInspection.id}/legal`}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                    inspection.vehicleInspection.legalStatus === 'COMPLETADO'
                                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                      : inspection.vehicleInspection.legalStatus === 'EN_PROCESO'
                                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                      : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                                  }`}
                                >
                                  Legal{inspection.vehicleInspection.legalStatus === 'COMPLETADO' ? ' ✓' : inspection.vehicleInspection.legalStatus === 'EN_PROCESO' ? '...' : ''}
                                </a>
                              )}
                              {(inspection.reportId || inspection.vehicleInspection?.mechanicalStatus === 'COMPLETADO') && (
                                <a
                                  href={`/admin/inspecciones/${inspection.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                >
                                  Reporte
                                </a>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedInspection(inspection);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 transition-colors"
                              >
                                Ver detalle
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Row border */}
                        <div className="border-b border-gray-100" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500">
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredInspections.length)} de {filteredInspections.length}
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="itemsPerPage" className="text-sm text-gray-500">
                  Por página:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-[#2D2D2D] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Primera página"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-[#2D2D2D] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Anterior"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm text-gray-600 px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-[#2D2D2D] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Siguiente"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-[#2D2D2D] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Última página"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
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

      {/* Create Panel */}
      {showCreatePanel && (
        <CreateInspectionPanel
          inspectors={inspectors}
          onClose={() => setShowCreatePanel(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Verify Payment Confirmation Modal */}
      {verifyConfirmId && (() => {
        const inv = inspections.find(i => i.id === verifyConfirmId);
        if (!inv) return null;
        return createPortal(
          <>
            <div className="fixed inset-0 bg-black/40 z-[80]" onClick={() => setVerifyConfirmId(null)} />
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
              <div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                style={{ animation: 'verifyModalIn 0.2s ease-out' }}
              >
                <div className="bg-gradient-to-r from-[#FFE14C] to-[#FFD700] px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#2D2D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#2D2D2D]">Verificar pago</h3>
                      <p className="text-xs text-[#2D2D2D]/70">Inspección {inv.code}</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Cliente</p>
                      <p className="font-medium text-gray-900 truncate">{inv.client.name}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Monto</p>
                      <p className="font-medium text-gray-900">S/ {inv.payment?.amount?.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Método</p>
                      <p className="font-medium text-gray-900">{inv.payment?.method || '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Plan</p>
                      <p className="font-medium text-gray-900">{inv.inspectionType}</p>
                    </div>
                  </div>

                  {inv.payment?.voucherUrl && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Comprobante adjunto</p>
                      <a href={inv.payment.voucherUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={inv.payment.voucherUrl}
                          alt="Comprobante"
                          className="w-full max-h-56 object-contain rounded-lg border border-gray-200 bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      </a>
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800">
                      Al confirmar, el pago se marcará como verificado y se asignará un inspector automáticamente.
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-5 flex gap-3">
                  <button
                    onClick={() => setVerifyConfirmId(null)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={executeVerifyPayment}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-[#2D2D2D] bg-[#FFE14C] hover:bg-[#FFD700] rounded-xl transition-colors"
                  >
                    Confirmar pago
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body
        );
      })()}
    </div>
  );
}
