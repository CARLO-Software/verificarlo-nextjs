'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/app/components/ui/StatusBadge/StatusBadge';
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
  inspector: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  clientNotes: string | null;
  inspectorNotes: string | null;
  adminNotes: string | null;
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

  // Estado para fecha y hora
  const originalDate = new Date(inspection.startTime).toISOString().split('T')[0];
  const originalTimeSlot = inspection.timeSlot;
  const [editedDate, setEditedDate] = useState<string>(originalDate);
  const [editedTimeSlot, setEditedTimeSlot] = useState<string>(originalTimeSlot);

  // Horarios disponibles
  const timeSlots = ['09:00', '10:30', '12:00', '14:00', '15:30'];

  // Estado para feedback
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Detectar si hay cambios
  const hasDateTimeChanges = editedDate !== originalDate || editedTimeSlot !== originalTimeSlot;
  const hasChanges =
    editedStatus !== inspection.status ||
    editedInspectorId !== (inspection.inspector?.id ?? null) ||
    editedNotes !== (inspection.adminNotes || '') ||
    hasDateTimeChanges;

  const handleSave = () => {
    setSaveMessage(null);

    startTransition(async () => {
      const changes: {
        status?: BookingStatus;
        inspectorId?: string;
        adminNotes?: string;
        date?: string;
        timeSlot?: string;
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
          fixed right-0 top-0 h-full w-full sm:max-w-lg
          bg-white shadow-xl z-50
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
                { id: 'checklist', label: 'Checklist' },
                { id: 'evidence', label: 'Evidencias' },
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
            <div className="space-y-4 sm:space-y-6">
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
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Fecha</span>
                    <input
                      type="date"
                      value={editedDate}
                      onChange={(e) => setEditedDate(e.target.value)}
                      disabled={isPending}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Hora</span>
                    <select
                      value={editedTimeSlot}
                      onChange={(e) => setEditedTimeSlot(e.target.value)}
                      disabled={isPending}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]"
                    >
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
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
                      <option value="PENDING_VERIFICATION">Pendiente verificación</option>
                      <option value="PAID">Pagado</option>
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
            <button
              onClick={handleSave}
              disabled={isPending || !hasChanges}
              className={`
                w-full px-4 py-2.5 text-sm sm:text-base font-semibold rounded-lg transition-all
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
    </>
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
    isPaid: false,
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

  // Buscar clientes con debounce
  useEffect(() => {
    if (!clientSearchQuery || clientSearchQuery.length < 2) {
      setSearchedClients([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearchingClients(true);
      const res = await searchClientsAction(clientSearchQuery);
      if (res.success && res.clients) {
        setSearchedClients(res.clients);
      }
      setSearchingClients(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [clientSearchQuery]);

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
      const result = await createManualInspectionAction({
        clientName: formData.clientName.trim(),
        clientEmail: formData.clientEmail.trim(),
        clientPhone: formData.clientPhone.trim() || undefined,
        brandId: Number(formData.brandId),
        modelId: Number(formData.modelId),
        year: formData.year,
        plate: formData.plate.trim() || undefined,
        inspectionPlanId: Number(formData.inspectionPlanId),
        date: formData.date,
        timeSlot: formData.timeSlot,
        inspectorId: formData.inspectorId || undefined,
        adminNotes: formData.adminNotes.trim() || undefined,
        isPaid: formData.isPaid,
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

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-lg bg-white shadow-xl z-50 animate-slideInRight flex flex-col">
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
            <div className="bg-gray-50 rounded-lg p-4">
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
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]"
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

                  {clientSearchQuery.length >= 2 && !searchingClients && searchedClients.length === 0 && (
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]"
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]"
                  />
                  <input
                    type="password"
                    placeholder="Contraseña para el cliente *"
                    value={formData.passClient}
                    onChange={(e) => setFormData({ ...formData, passClient: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]"
                  />
                  <input
                    type="tel"
                    placeholder="Teléfono (opcional)"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]"
                  />
                </div>
              )}
            </div>

            {/* Datos del vehículo */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Datos del vehículo
              </h3>
              <div className="space-y-3">
                <select
                  value={formData.brandId}
                  onChange={(e) => setFormData({ ...formData, brandId: e.target.value, modelId: '' })}
                  disabled={loadingBrands}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]"
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C] disabled:bg-gray-100"
                >
                  <option value="">
                    {loadingModels ? 'Cargando modelos...' : 'Seleccionar modelo *'}
                  </option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]"
                  >
                    {yearRange.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Placa (opcional)"
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                    maxLength={7}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]"
                  />
                </div>
              </div>
            </div>

            {/* Plan de inspección */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Plan de inspección
              </h3>
              <select
                value={formData.inspectionPlanId}
                onChange={(e) => setFormData({ ...formData, inspectionPlanId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]"
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
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Fecha y hora
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value, timeSlot: '', inspectorId: '' })}
                  min={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]"
                />
                <div className="relative">
                  <select
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value, inspectorId: '' })}
                    disabled={!formData.date || loadingSlots}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C] disabled:bg-gray-100 disabled:cursor-not-allowed w-full"
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

            {/* Inspector */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Inspector (opcional)
              </h3>
              <div className="relative">
                <select
                  value={formData.inspectorId}
                  onChange={(e) => setFormData({ ...formData, inspectorId: e.target.value })}
                  disabled={loadingInspectors}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C] disabled:bg-gray-100"
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
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <input
                type="checkbox"
                id="isPaid"
                checked={formData.isPaid}
                onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <label htmlFor="isPaid" className="text-sm font-medium text-green-800">
                Marcar como pagado (pago recibido por transferencia/efectivo)
              </label>
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
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  // Verificar pago alternativo y asignar inspector automáticamente
  const handleVerifyPayment = async (inspectionId: number) => {
    if (!confirm('¿Confirmar el pago y asignar inspector automáticamente?')) return;

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

  const handleCreateSuccess = () => {
    setShowCreatePanel(false);
    router.refresh();
  };

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#2D2D2D]">
              Inspecciones
            </h1>
            <button
              onClick={() => setShowCreatePanel(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#FFE14C] text-[#2D2D2D] font-semibold rounded-lg hover:bg-[#FFD700] transition-colors text-sm sm:text-base whitespace-nowrap"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden xs:inline">Nueva</span>
              <span className="xs:hidden">+</span>
              <span className="hidden sm:inline">inspección</span>
            </button>
          </div>

          {/* Stats - Horizontal scroll en móvil */}
          <div className="mt-4 sm:mt-6 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-5 sm:overflow-visible">
              {statsConfig.map((stat) => (
                <div
                  key={stat.key}
                  className={`${stat.bg} rounded-lg p-3 sm:p-4 flex-shrink-0 w-32 sm:w-auto`}
                >
                  <p className={`text-xl sm:text-2xl font-bold ${stat.color}`}>
                    {stats[stat.key as keyof Stats]}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-full">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FFE14C] text-sm sm:text-base"
            />
          </div>
          {/* Filter pills con scroll horizontal en móvil */}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap sm:overflow-visible">
              {filterPills.map((pill) => (
                <button
                  key={pill.value}
                  onClick={() => setFilter(pill.value)}
                  className={`
                    px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all flex-shrink-0
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
        </div>

        {/* Mobile Cards View */}
        <div className="sm:hidden space-y-3">
          {filteredInspections.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500">
              No se encontraron inspecciones
            </div>
          ) : (
            filteredInspections.map((inspection) => (
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
                {/* Mobile action buttons */}
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                  {inspection.status === 'PENDING_VERIFICATION' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVerifyPayment(inspection.id);
                      }}
                      disabled={verifyingId === inspection.id}
                      className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Verificar pago"
                    >
                      {verifyingId === inspection.id ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                  )}
                  {inspection.vehicleInspection &&
                    inspection.vehicleInspection.legalStatus !== 'BLOQUEADO' &&
                    inspection.vehicleInspection.legalStatus !== 'COMPLETADO' && (
                      <a
                        href={`/admin/vehicle-inspections/${inspection.vehicleInspection.id}/legal`}
                        onClick={(e) => e.stopPropagation()}
                        className={`p-2 rounded-lg transition-colors ${
                          inspection.vehicleInspection.legalStatus === 'EN_PROCESO'
                            ? 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                            : 'text-purple-500 hover:text-purple-700 hover:bg-purple-50'
                        }`}
                        title="Revisión legal"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                      </a>
                    )}
                  {inspection.status === 'COMPLETED' && inspection.reportId && (
                    <a
                      href={`/admin/inspecciones/${inspection.reportId}/legal`}
                      onClick={(e) => e.stopPropagation()}
                      className={`p-2 rounded-lg transition-colors ${
                        inspection.legalReportStatus === 'COMPLETED'
                          ? 'text-green-500 hover:text-green-700 hover:bg-green-50'
                          : 'text-purple-500 hover:text-purple-700 hover:bg-purple-50'
                      }`}
                      title="Informe legal"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </a>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInspection(inspection);
                    }}
                    className="p-2 text-gray-400 hover:text-[#FFE14C] hover:bg-gray-100 rounded-lg transition-colors"
                    title="Ver detalles"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
          {/* Mobile pagination */}
          <div className="text-center py-3">
            <p className="text-sm text-gray-500">
              {filteredInspections.length} de {stats.total} inspecciones
            </p>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3 lg:py-4">
                    Cliente
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3 lg:py-4">
                    Vehículo
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3 lg:py-4 hidden md:table-cell">
                    Fecha
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3 lg:py-4 hidden lg:table-cell">
                    Inspector
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3 lg:py-4">
                    Estado
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3 lg:py-4">
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
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <div className="flex items-center gap-2 lg:gap-3">
                          <Avatar name={inspection.client.name} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-[#2D2D2D] text-sm lg:text-base truncate">{inspection.client.name}</p>
                            <p className="text-xs text-gray-500 truncate hidden lg:block">{inspection.client.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <p className="font-medium text-[#2D2D2D] text-sm lg:text-base">
                          {inspection.vehicle.brand} {inspection.vehicle.model}
                        </p>
                        <p className="text-xs text-gray-500">
                          {inspection.vehicle.year}{inspection.vehicle.plate ? ` · ${inspection.vehicle.plate}` : ''}
                        </p>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 hidden md:table-cell">
                        <p className="text-[#2D2D2D] text-sm">{formatearFechaHoraCorta(inspection.startTime)}</p>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 hidden lg:table-cell">
                        {inspection.inspector ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={inspection.inspector.name} size="sm" />
                            <span className="text-sm">{inspection.inspector.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <StatusBadge status={inspection.status} size="sm" />
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <div className="flex justify-end gap-1 lg:gap-2">
                          {/* Botón verificar pago - solo para PENDING_VERIFICATION */}
                          {inspection.status === 'PENDING_VERIFICATION' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerifyPayment(inspection.id);
                              }}
                              disabled={verifyingId === inspection.id}
                              className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Verificar pago y asignar inspector"
                            >
                              {verifyingId === inspection.id ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                          )}
                          {/* Botón editar estado legal - cuando tiene placa y no está bloqueado ni completado */}
                          {inspection.vehicleInspection &&
                            inspection.vehicleInspection.legalStatus !== 'BLOQUEADO' &&
                            inspection.vehicleInspection.legalStatus !== 'COMPLETADO' && (
                              <a
                                href={`/admin/vehicle-inspections/${inspection.vehicleInspection.id}/legal`}
                                onClick={(e) => e.stopPropagation()}
                                className={`p-2 rounded-lg transition-colors ${
                                  inspection.vehicleInspection.legalStatus === 'EN_PROCESO'
                                    ? 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                                    : 'text-purple-500 hover:text-purple-700 hover:bg-purple-50'
                                }`}
                                title={
                                  inspection.vehicleInspection.legalStatus === 'EN_PROCESO'
                                    ? 'Continuar revisión legal'
                                    : 'Iniciar revisión legal'
                                }
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                </svg>
                              </a>
                            )}
                          {/* Botón revisar legal - solo para COMPLETED con reportId */}
                          {inspection.status === 'COMPLETED' && inspection.reportId && (
                            <a
                              href={`/admin/inspecciones/${inspection.reportId}/legal`}
                              onClick={(e) => e.stopPropagation()}
                              className={`p-2 rounded-lg transition-colors ${
                                inspection.legalReportStatus === 'COMPLETED'
                                  ? 'text-green-500 hover:text-green-700 hover:bg-green-50'
                                  : 'text-purple-500 hover:text-purple-700 hover:bg-purple-50'
                              }`}
                              title={inspection.legalReportStatus === 'COMPLETED' ? 'Ver informe legal' : 'Revisar informe legal'}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </a>
                          )}
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

      {/* Create Panel */}
      {showCreatePanel && (
        <CreateInspectionPanel
          inspectors={inspectors}
          onClose={() => setShowCreatePanel(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
