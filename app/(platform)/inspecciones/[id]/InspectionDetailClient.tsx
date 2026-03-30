/**
 * InspectionDetailClient: Vista detallada de una inspección.
 *
 * Muestra toda la información con acciones contextuales según estado:
 * - PENDIENTE/CONFIRMADA: Cancelar (con regla 24h), Reprogramar
 * - COMPLETADA: Descargar informe, ver resultados
 * - CANCELADA: Solo información histórica
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Car,
  User,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Phone,
  Loader2,
  Circle,
  Wrench,
  Scale,
  Building2,
  Navigation,
  HelpCircle,
  Info,
} from 'lucide-react';
import { BookingStatus } from '@prisma/client';
import { getVerdict, getScoreCategoryInfo, type ScoreCategory } from '@/lib/inspection-verdict';
import { differenceInHours, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Inspection {
  id: number;
  code: string;
  status: BookingStatus;
  date: Date;
  startTime: Date;
  timeSlot: string;
  createdAt: Date;
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plate: string | null;
    mileage: number | null;
  };
  plan: {
    title: string;
    type: string;
    price: number;
  };
  inspector: {
    name: string;
    image: string | null;
  } | null;
  clientNotes: string | null;
  clientLocation: {
    address: string | null;
    district: string | null;
  };
  report: {
    overallScore: number | null;
    overallStatus: string;
    legalScore: number | null;
    legalStatus: string;
    mechanicalScore: number | null;
    mechanicalStatus: string;
    bodyScore: number | null;
    bodyStatus: string;
    executiveSummary: string | null;
    recommendations: string | null;
    pdfUrl: string | null;
    completedAt: Date | null;
    legalReport: {
      status: string;
      completedAt: Date | null;
    } | null;
  } | null;
  vehicleInspection: {
    id: number;
    plate: string | null;
    legalStatus: "BLOQUEADO" | "PENDIENTE" | "EN_PROCESO" | "COMPLETADO";
    mechanicalStatus: "PENDIENTE" | "EN_PROCESO" | "COMPLETADO";
    assignedMechanic: { id: string; name: string } | null;
    assignedAdmin: { id: string; name: string } | null;
    createdAt: Date;
    plateAddedAt: Date | null;
    legalUnlockedAt: Date | null;
    legalStartedAt: Date | null;
    legalCompletedAt: Date | null;
    mechanicAssignedAt: Date | null;
    mechanicStartedAt: Date | null;
    mechanicCompletedAt: Date | null;
  } | null;
}

interface Props {
  inspection: Inspection;
}

// Configuración de estados
const statusConfig: Record<string, {
  label: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
}> = {
  PENDING_PAYMENT: {
    label: 'Pendiente de pago',
    description: 'Completa el pago para confirmar tu inspección',
    icon: Clock,
    gradient: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  PENDING_VERIFICATION: {
    label: 'Verificando pago',
    description: 'Tu pago está siendo verificado por nuestro equipo',
    icon: Clock,
    gradient: 'from-orange-500 to-amber-500',
    iconBg: 'bg-orange-100 text-orange-600',
  },
  PAID: {
    label: 'Pagado',
    description: 'Estamos asignando un inspector a tu cita',
    icon: CheckCircle2,
    gradient: 'from-blue-500 to-indigo-500',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  CONFIRMED: {
    label: 'Confirmada',
    description: 'Tu inspección está programada y lista',
    icon: Calendar,
    gradient: 'from-indigo-500 to-purple-500',
    iconBg: 'bg-indigo-100 text-indigo-600',
  },
  COMPLETED: {
    label: 'Completada',
    description: 'Inspección finalizada exitosamente',
    icon: CheckCircle2,
    gradient: 'from-green-500 to-emerald-500',
    iconBg: 'bg-green-100 text-green-600',
  },
  CANCELLED: {
    label: 'Cancelada',
    description: 'Esta inspección fue cancelada',
    icon: XCircle,
    gradient: 'from-red-500 to-rose-500',
    iconBg: 'bg-red-100 text-red-600',
  },
  NO_SHOW: {
    label: 'No asistió',
    description: 'No te presentaste a la cita',
    icon: AlertCircle,
    gradient: 'from-gray-500 to-gray-600',
    iconBg: 'bg-gray-100 text-gray-600',
  },
  EXPIRED: {
    label: 'Expirada',
    description: 'El tiempo de pago expiró',
    icon: Clock,
    gradient: 'from-gray-500 to-gray-600',
    iconBg: 'bg-gray-100 text-gray-600',
  },
};

export function InspectionDetailClient({ inspection }: Props) {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const status = statusConfig[inspection.status] || statusConfig.PENDING_PAYMENT;
  const StatusIcon = status.icon;

  // Calcular si puede cancelar (más de 24h antes)
  const hoursUntil = differenceInHours(new Date(inspection.startTime), new Date());
  const canCancelWithRefund = hoursUntil >= 24;
  const canCancel = hoursUntil > 0;
  const isPending = ['PENDING_PAYMENT', 'PENDING_VERIFICATION', 'PAID', 'CONFIRMED'].includes(inspection.status);
  const isCompleted = inspection.status === 'COMPLETED';
  // Estado de cancelación (disponible para uso futuro)
  const _isCancelled = ['CANCELLED', 'NO_SHOW', 'EXPIRED'].includes(inspection.status);


  // Formatear fecha
  const formattedDate = format(new Date(inspection.startTime), "EEEE, d 'de' MMMM yyyy", { locale: es });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bookings/${inspection.id}/cancel`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        router.refresh();
        setShowCancelModal(false);
      } else {
        alert(data.error || 'Error al cancelar la inspección');
      }
    } catch (error) {
      console.error('Error cancelando:', error);
      alert('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Header con estado */}
      <div className={`bg-gradient-to-r ${status.gradient} text-white`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {/* Back button */}
          <Link
            href="/inspecciones"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Volver</span>
          </Link>

          {/* Status badge grande */}
          <div className="flex items-start gap-4">
            <div className={`
              w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm
              flex items-center justify-center
              animate-in zoom-in duration-300
            `}>
              <StatusIcon size={28} />
            </div>

            <div className="flex-1">
              <p className="text-white/70 text-sm font-medium mb-1">{inspection.code}</p>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">{status.label}</h1>
              <p className="text-white/80 text-sm">{status.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-4">
        {/* Card principal de fecha/hora */}
        {isPending && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#F5D849]/20 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {format(new Date(inspection.startTime), 'd')}
                </span>
                <span className="text-xs font-medium text-gray-500 uppercase">
                  {format(new Date(inspection.startTime), 'MMM', { locale: es })}
                </span>
              </div>

              <div className="flex-1">
                <p className="font-semibold text-gray-900">{capitalizedDate}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {inspection.timeSlot}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    Centro de inspección
                  </span>
                </div>
              </div>
            </div>

            {/* Countdown si está próxima */}
            {hoursUntil > 0 && hoursUntil < 48 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  {hoursUntil < 24 ? (
                    <span className="text-amber-600 font-medium">
                      ⏰ Faltan menos de 24 horas
                    </span>
                  ) : (
                    <span>Faltan aproximadamente {Math.floor(hoursUntil)} horas</span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Timeline de progreso */}
        <InspectionTimeline
          createdAt={inspection.createdAt}
          mechanicalCompletedAt={inspection.report?.completedAt || null}
          legalCompletedAt={inspection.report?.legalReport?.completedAt || null}
          vehicleInspection={inspection.vehicleInspection}
          bookingId={inspection.id}
        />

        {/* Ubicación: Origen y Destino */}
        <LocationSection
          clientAddress={inspection.clientLocation.address}
          clientDistrict={inspection.clientLocation.district}
        />

        {/* Resultados si está completada */}
        {isCompleted && inspection.report && (() => {
          const verdict = getVerdict(inspection.report.overallScore, inspection.report.overallStatus);
          const bgGradient = verdict.type === 'SAFE'
            ? 'from-green-50 to-emerald-50 border-green-100'
            : verdict.type === 'NEGOTIATE'
              ? 'from-amber-50 to-yellow-50 border-amber-100'
              : verdict.type === 'DONT_BUY'
                ? 'from-red-50 to-rose-50 border-red-100'
                : 'from-gray-50 to-slate-50 border-gray-100';
          const scoreColor = verdict.type === 'SAFE'
            ? 'text-green-700'
            : verdict.type === 'NEGOTIATE'
              ? 'text-amber-700'
              : verdict.type === 'DONT_BUY'
                ? 'text-red-700'
                : 'text-gray-700';

          return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6 animate-in slide-in-from-bottom duration-500">
            {/* Score principal */}
            <div className={`p-6 bg-gradient-to-r ${bgGradient} border-b`}>
              <div className="flex flex-col gap-4">
                {/* Puntaje */}
                <div>
                  <p className={`text-sm font-medium ${scoreColor} mb-1`}>Puntaje General</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-bold ${scoreColor}`}>
                      {inspection.report.overallScore || '--'}
                    </span>
                    <span className={`text-lg ${scoreColor} opacity-80`}>/100</span>
                  </div>
                </div>

                {/* Badge de veredicto mejorado */}
                <div className={`
                  p-4 rounded-xl border-2
                  ${verdict.bgColor} ${verdict.borderColor}
                `}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{verdict.icon}</span>
                    <div>
                      <p className={`font-bold text-lg ${verdict.color}`}>
                        {verdict.label}
                      </p>
                      <p className={`text-sm mt-0.5 ${verdict.color} opacity-80`}>
                        {verdict.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info de cómo se calcula */}
                <ScoreCalculationInfo
                  legalScore={inspection.report.legalScore}
                  mechanicalScore={inspection.report.mechanicalScore}
                  bodyScore={inspection.report.bodyScore}
                />
              </div>
            </div>

            {/* Desglose de puntajes */}
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              <ScoreCard
                label="Legal"
                score={inspection.report.legalScore}
                status={inspection.report.legalStatus}
                category="legal"
              />
              <ScoreCard
                label="Mecánica"
                score={inspection.report.mechanicalScore}
                status={inspection.report.mechanicalStatus}
                category="mechanical"
              />
              <ScoreCard
                label="Carrocería"
                score={inspection.report.bodyScore}
                status={inspection.report.bodyStatus}
                category="body"
              />
            </div>

            {/* Botón de descarga */}
            {inspection.report.completedAt && (
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <a
                  href={`/api/inspections/${inspection.id}/report/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex items-center justify-center gap-3 w-full
                    bg-gradient-to-r from-[#F5D849] to-[#f0d24a]
                    hover:from-[#e5c83a] hover:to-[#e0c23a]
                    text-gray-900 font-semibold
                    py-3 px-6 rounded-xl
                    shadow-lg shadow-yellow-200/50
                    transition-all duration-300
                    hover:shadow-xl hover:scale-[1.02]
                    active:scale-[0.98]
                  "
                >
                  <Download size={20} />
                  Descargar Informe PDF
                </a>
              </div>
            )}
          </div>
          );
        })()}

        {/* Información del vehículo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-in slide-in-from-bottom duration-500 delay-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Car size={16} />
            Vehículo
          </h2>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
              <Car size={24} className="text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">
                {inspection.vehicle.brand} {inspection.vehicle.model}
              </p>
              <p className="text-sm text-gray-500">
                {inspection.vehicle.year}
                {inspection.vehicle.plate && ` • ${inspection.vehicle.plate}`}
                {inspection.vehicle.mileage && ` • ${inspection.vehicle.mileage.toLocaleString()} km`}
              </p>
            </div>
          </div>
        </div>

        {/* Información del servicio */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-in slide-in-from-bottom duration-500 delay-150">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <FileText size={16} />
            Servicio
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{inspection.plan.title}</p>
              <p className="text-sm text-gray-500 capitalize">Tipo: {inspection.plan.type}</p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              S/ {inspection.plan.price}
            </p>
          </div>
        </div>

        {/* Inspector asignado */}
        {inspection.inspector && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-in slide-in-from-bottom duration-500 delay-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <User size={16} />
              Inspector asignado
            </h2>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {inspection.inspector.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{inspection.inspector.name}</p>
                <p className="text-sm text-gray-500">Inspector certificado</p>
              </div>
            </div>
          </div>
        )}

        {/* Notas del cliente */}
        {inspection.clientNotes && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-in slide-in-from-bottom duration-500 delay-250">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Tus notas
            </h2>
            <p className="text-gray-700 text-sm">{inspection.clientNotes}</p>
          </div>
        )}

        {/* Resumen y recomendaciones (si completada) */}
        {isCompleted && inspection.report?.executiveSummary && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-in slide-in-from-bottom duration-500 delay-300">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Resumen del inspector
            </h2>
            <p className="text-gray-700 text-sm">{inspection.report.executiveSummary}</p>

            {inspection.report.recommendations && (
              <>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-2">
                  Recomendaciones
                </h3>
                <p className="text-gray-700 text-sm">{inspection.report.recommendations}</p>
              </>
            )}
          </div>
        )}

        {/* Acciones para inspecciones pendientes */}
        {isPending && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-in slide-in-from-bottom duration-500 delay-300">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Acciones
            </h2>

            <div className="space-y-3">
              {/* Reprogramar */}
              <Link
                href={`/agendar?reschedule=${inspection.id}`}
                className="
                  flex items-center justify-center gap-2 w-full
                  py-3 px-4 rounded-xl
                  bg-gray-100 hover:bg-gray-200
                  text-gray-700 font-medium
                  transition-colors
                "
              >
                <RefreshCw size={18} />
                Reprogramar inspección
              </Link>

              {/* Cancelar */}
              {canCancel ? (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="
                    flex items-center justify-center gap-2 w-full
                    py-3 px-4 rounded-xl
                    border-2 border-red-200 hover:border-red-300 hover:bg-red-50
                    text-red-600 font-medium
                    transition-colors
                  "
                >
                  <XCircle size={18} />
                  Cancelar inspección
                </button>
              ) : (
                <p className="text-sm text-gray-400 text-center py-2">
                  Ya no es posible cancelar esta inspección
                </p>
              )}

              {/* Aviso de 24h */}
              {canCancel && !canCancelWithRefund && (
                <p className="text-xs text-amber-600 text-center bg-amber-50 rounded-lg py-2 px-3">
                  ⚠️ Faltan menos de 24 horas. La cancelación no incluye reembolso.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Contacto de soporte */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">¿Necesitas ayuda?</p>
          <a
            href="https://wa.me/51999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#c4a82f] hover:text-[#a08825] font-medium text-sm"
          >
            <Phone size={16} />
            Contactar soporte
          </a>
        </div>
      </div>

      {/* Modal de cancelación */}
      {showCancelModal && (
        <CancelModal
          canRefund={canCancelWithRefund}
          isLoading={isLoading}
          onCancel={handleCancel}
          onClose={() => setShowCancelModal(false)}
        />
      )}
    </div>
  );
}

// Componente que explica cómo se calcula el puntaje general
function ScoreCalculationInfo({ legalScore, mechanicalScore, bodyScore }: {
  legalScore: number | null;
  mechanicalScore: number | null;
  bodyScore: number | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calcular contribuciones
  const legalContrib = legalScore ? (legalScore * 0.3).toFixed(1) : '--';
  const mechContrib = mechanicalScore ? (mechanicalScore * 0.4).toFixed(1) : '--';
  const bodyContrib = bodyScore ? (bodyScore * 0.3).toFixed(1) : '--';

  return (
    <div className="mt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700
          transition-colors w-full justify-center
        "
      >
        <Info size={14} />
        <span>{isExpanded ? 'Ocultar' : '¿Cómo se calcula?'}</span>
      </button>

      {isExpanded && (
        <div className="
          mt-3 p-4 bg-white/80 rounded-lg border border-gray-200
          animate-in slide-in-from-top-2 duration-200
        ">
          <p className="text-xs text-gray-600 mb-3">
            Cada área se evalúa de 0 a 100. El puntaje general es la suma ponderada:
          </p>

          {/* Tabla de cálculo */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-600">Legal</span>
              <span className="font-mono text-gray-700">
                {legalScore ?? '--'} × 30% = <strong>{legalContrib}</strong>
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-600">Mecánica</span>
              <span className="font-mono text-gray-700">
                {mechanicalScore ?? '--'} × 40% = <strong>{mechContrib}</strong>
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-600">Carrocería</span>
              <span className="font-mono text-gray-700">
                {bodyScore ?? '--'} × 30% = <strong>{bodyContrib}</strong>
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-gray-900 font-medium">Total</span>
              <span className="font-mono text-gray-900 font-bold">
                {legalContrib} + {mechContrib} + {bodyContrib} = {
                  legalScore && mechanicalScore && bodyScore
                    ? Math.round(legalScore * 0.3 + mechanicalScore * 0.4 + bodyScore * 0.3)
                    : '--'
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de score individual
function ScoreCard({ label, score, status, category }: {
  label: string;
  score: number | null;
  status: string;
  category?: ScoreCategory;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusColor = (s: string) => {
    if (s === 'OK') return 'text-green-600';
    if (s === 'WARNING') return 'text-amber-600';
    if (s === 'CRITICAL') return 'text-red-600';
    return 'text-gray-400';
  };

  const categoryInfo = category ? getScoreCategoryInfo(category) : null;

  return (
    <div className="p-4 text-center relative">
      <div className="flex items-center justify-center gap-1 mb-1">
        <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
        {categoryInfo && (
          <button
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={`Información sobre ${label}`}
          >
            <HelpCircle size={14} />
          </button>
        )}
      </div>
      <p className={`text-2xl font-bold ${getStatusColor(status)}`}>
        {score ?? '--'}
      </p>

      {/* Tooltip */}
      {showTooltip && categoryInfo && (
        <div className="
          absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2
          w-64 p-3 rounded-xl shadow-lg border border-gray-200
          bg-white text-left
          animate-in fade-in zoom-in-95 duration-200
        ">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-200 rotate-45" />
          <p className="font-semibold text-gray-900 text-sm mb-1">{categoryInfo.title}</p>
          <p className="text-xs text-gray-600 mb-2">{categoryInfo.description}</p>
          <ul className="space-y-1">
            {categoryInfo.items.map((item, idx) => (
              <li key={idx} className="text-xs text-gray-500 flex items-start gap-1.5">
                <span className="text-[#F5D849] mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Timeline de progreso de la inspección (soporta flujo paralelo y secuencial)
type LegalStatusType = "BLOQUEADO" | "PENDIENTE" | "EN_PROCESO" | "COMPLETADO";
type MechanicalStatusType = "PENDIENTE" | "EN_PROCESO" | "COMPLETADO";

interface VehicleInspectionData {
  id: number;
  plate: string | null;
  legalStatus: LegalStatusType;
  mechanicalStatus: MechanicalStatusType;
  assignedMechanic: { id: string; name: string } | null;
  assignedAdmin: { id: string; name: string } | null;
  createdAt: Date;
  plateAddedAt: Date | null;
  legalUnlockedAt: Date | null;
  legalStartedAt: Date | null;
  legalCompletedAt: Date | null;
  mechanicAssignedAt: Date | null;
  mechanicStartedAt: Date | null;
  mechanicCompletedAt: Date | null;
}

function InspectionTimeline({
  createdAt,
  mechanicalCompletedAt,
  legalCompletedAt,
  vehicleInspection,
  bookingId,
}: {
  createdAt: Date;
  mechanicalCompletedAt: Date | null;
  legalCompletedAt: Date | null;
  vehicleInspection?: VehicleInspectionData | null;
  bookingId: number;
}) {
  // Si hay vehicleInspection, usar el nuevo flujo dual
  if (vehicleInspection) {
    const { legalStatus, mechanicalStatus, assignedMechanic, assignedAdmin } = vehicleInspection;

    // Determinar si es flujo paralelo (con placa desde inicio) o secuencial (sin placa)
    // Si tiene placa Y legalUnlockedAt es null, fue paralelo desde el inicio
    const isParallelFlow = vehicleInspection.plate !== null && vehicleInspection.legalUnlockedAt === null;

    const getStatusInfo = (status: LegalStatusType | MechanicalStatusType, type: 'legal' | 'mechanical') => {
      if (type === 'legal') {
        switch (status) {
          case 'BLOQUEADO': return { label: 'Bloqueado', color: 'bg-gray-100 text-gray-400', description: 'Esperando placa' };
          case 'PENDIENTE': return { label: 'Pendiente', color: 'bg-amber-100 text-amber-600', description: 'Listo para revisión' };
          case 'EN_PROCESO': return { label: 'En proceso', color: 'bg-blue-100 text-blue-600', description: 'Revisión en curso' };
          case 'COMPLETADO': return { label: 'Completado', color: 'bg-green-100 text-green-600', description: 'Revisión finalizada' };
        }
      } else {
        switch (status) {
          case 'PENDIENTE': return { label: 'Pendiente', color: 'bg-amber-100 text-amber-600', description: 'Esperando inicio' };
          case 'EN_PROCESO': return { label: 'En proceso', color: 'bg-blue-100 text-blue-600', description: 'Inspección en curso' };
          case 'COMPLETADO': return { label: 'Completado', color: 'bg-green-100 text-green-600', description: 'Inspección finalizada' };
        }
      }
      return { label: 'Pendiente', color: 'bg-gray-100 text-gray-400', description: '' };
    };

    const mechanicalInfo = getStatusInfo(mechanicalStatus, 'mechanical');
    const legalInfo = getStatusInfo(legalStatus, 'legal');
    const allCompleted = mechanicalStatus === 'COMPLETADO' && legalStatus === 'COMPLETADO';

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-in slide-in-from-bottom duration-500">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6 flex items-center gap-2">
          <Clock size={16} />
          Progreso de la inspección
          {isParallelFlow && (
            <span className="ml-2 text-xs font-normal bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
              Flujo paralelo
            </span>
          )}
        </h2>

        {/* Paso 1: Inspección creada */}
        <div className="flex gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Inspección creada</p>
            <p className="text-sm text-gray-500">Tu solicitud fue registrada</p>
            <p className="text-xs text-green-600 mt-1 font-medium">
              {format(new Date(createdAt), "d MMM yyyy, HH:mm", { locale: es })}
            </p>
          </div>
        </div>

        {isParallelFlow ? (
          // ─── FLUJO PARALELO ───────────────────────────────────────────
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Inspección Mecánica */}
              <div className={`p-4 rounded-xl border-2 ${mechanicalStatus === 'COMPLETADO' ? 'border-green-200 bg-green-50' : mechanicalStatus === 'EN_PROCESO' ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${mechanicalInfo.color} flex items-center justify-center`}>
                    <Wrench size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Inspección mecánica</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${mechanicalInfo.color}`}>
                      {mechanicalInfo.label}
                    </span>
                  </div>
                </div>
                {assignedMechanic && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                    <User size={12} /> {assignedMechanic.name}
                  </p>
                )}
                {vehicleInspection.mechanicCompletedAt && (
                  <p className="text-xs text-green-600 mt-1">
                    {format(new Date(vehicleInspection.mechanicCompletedAt), "d MMM, HH:mm", { locale: es })}
                  </p>
                )}
                {mechanicalStatus === 'COMPLETADO' && (
                  <a
                    href={`/api/inspections/${bookingId}/report/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Download size={14} />
                    Descargar informe mecánico
                  </a>
                )}
              </div>

              {/* Revisión Legal */}
              <div className={`p-4 rounded-xl border-2 ${legalStatus === 'COMPLETADO' ? 'border-green-200 bg-green-50' : legalStatus === 'EN_PROCESO' ? 'border-blue-200 bg-blue-50' : legalStatus === 'BLOQUEADO' ? 'border-gray-200 bg-gray-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${legalInfo.color} flex items-center justify-center`}>
                    <Scale size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Revisión legal</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${legalInfo.color}`}>
                      {legalInfo.label}
                    </span>
                  </div>
                </div>
                {assignedAdmin && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                    <User size={12} /> {assignedAdmin.name}
                  </p>
                )}
                {vehicleInspection.legalCompletedAt && (
                  <p className="text-xs text-green-600 mt-1">
                    {format(new Date(vehicleInspection.legalCompletedAt), "d MMM, HH:mm", { locale: es })}
                  </p>
                )}
                {legalStatus === 'COMPLETADO' && (
                  <a
                    href={`/api/admin/vehicle-inspections/${vehicleInspection.id}/legal/download-pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Download size={14} />
                    Descargar informe legal
                  </a>
                )}
              </div>
            </div>

            {allCompleted && (
              <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 flex items-center justify-center gap-2">
                <CheckCircle2 size={18} className="text-green-600" />
                <span className="font-medium text-green-700">Inspección completada</span>
              </div>
            )}
          </div>
        ) : (
          // ─── FLUJO SECUENCIAL ─────────────────────────────────────────
          <div className="relative">
            {/* Línea conectora */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* Inspección Mecánica */}
            <div className="flex gap-4 relative">
              <div className={`w-10 h-10 rounded-full ${mechanicalInfo.color} flex items-center justify-center z-10`}>
                {mechanicalStatus === 'COMPLETADO' ? <CheckCircle2 size={20} /> : <Wrench size={20} />}
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-center gap-2">
                  <p className={`font-medium ${mechanicalStatus === 'COMPLETADO' ? 'text-gray-900' : 'text-gray-600'}`}>
                    Inspección mecánica
                  </p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${mechanicalInfo.color}`}>
                    {mechanicalInfo.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{mechanicalInfo.description}</p>
                {assignedMechanic && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <User size={12} /> {assignedMechanic.name}
                  </p>
                )}
                {mechanicalStatus === 'COMPLETADO' && (
                  <a
                    href={`/api/inspections/${bookingId}/report/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download size={14} />
                    Descargar informe mecánico
                  </a>
                )}
              </div>
            </div>

            {/* Revisión Legal */}
            <div className="flex gap-4 relative">
              <div className={`w-10 h-10 rounded-full ${legalInfo.color} flex items-center justify-center z-10`}>
                {legalStatus === 'COMPLETADO' ? <CheckCircle2 size={20} /> : legalStatus === 'BLOQUEADO' ? <AlertCircle size={20} /> : <Scale size={20} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`font-medium ${legalStatus === 'COMPLETADO' ? 'text-gray-900' : legalStatus === 'BLOQUEADO' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Revisión legal
                  </p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${legalInfo.color}`}>
                    {legalInfo.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {legalStatus === 'BLOQUEADO'
                    ? 'Esperando que se registre la placa del vehículo'
                    : legalInfo.description}
                </p>
                {assignedAdmin && legalStatus !== 'BLOQUEADO' && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <User size={12} /> {assignedAdmin.name}
                  </p>
                )}
                {legalStatus === 'COMPLETADO' && (
                  <a
                    href={`/api/admin/vehicle-inspections/${vehicleInspection.id}/legal/download-pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download size={14} />
                    Descargar informe legal
                  </a>
                )}
              </div>
            </div>

            {allCompleted && (
              <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 flex items-center justify-center gap-2">
                <CheckCircle2 size={18} className="text-green-600" />
                <span className="font-medium text-green-700">Inspección completada</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Fallback: flujo simple (sin vehicleInspection)
  const steps = [
    {
      id: 1,
      label: 'Inspección creada',
      description: 'Tu solicitud fue registrada',
      icon: Circle,
      completedAt: createdAt,
      isCompleted: true,
    },
    {
      id: 2,
      label: 'Inspección mecánica',
      description: 'Revisión técnica del vehículo',
      icon: Wrench,
      completedAt: mechanicalCompletedAt,
      isCompleted: !!mechanicalCompletedAt,
    },
    {
      id: 3,
      label: 'Revisión legal',
      description: 'Verificación documental completa',
      icon: Scale,
      completedAt: legalCompletedAt,
      isCompleted: !!legalCompletedAt,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-in slide-in-from-bottom duration-500">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6 flex items-center gap-2">
        <Clock size={16} />
        Progreso de la inspección
      </h2>

      <div className="relative">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex gap-4">
              {/* Línea y círculo */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${step.isCompleted
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                    }
                  `}
                >
                  {step.isCompleted ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <StepIcon size={20} />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`
                      w-0.5 h-12 my-1
                      ${step.isCompleted && steps[index + 1]?.isCompleted
                        ? 'bg-green-300'
                        : step.isCompleted
                          ? 'bg-gradient-to-b from-green-300 to-gray-200'
                          : 'bg-gray-200'
                      }
                    `}
                  />
                )}
              </div>

              {/* Contenido */}
              <div className={`flex-1 ${!isLast ? 'pb-6' : ''}`}>
                <p
                  className={`
                    font-medium
                    ${step.isCompleted ? 'text-gray-900' : 'text-gray-400'}
                  `}
                >
                  {step.label}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {step.description}
                </p>
                {step.completedAt && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    {format(new Date(step.completedAt), "d MMM yyyy, HH:mm", { locale: es })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Sección de origen y destino
function LocationSection({
  clientAddress,
  clientDistrict,
}: {
  clientAddress: string | null;
  clientDistrict: string | null;
}) {
  const companyAddress = "Av. Javier Prado Este 4200, Santiago de Surco"; // Dirección de la empresa
  const hasClientLocation = clientAddress || clientDistrict;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-in slide-in-from-bottom duration-500">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Navigation size={16} />
        Ubicación
      </h2>

      <div className="space-y-4">
        {/* Origen - Empresa */}
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Building2 size={18} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Origen</p>
            <p className="font-medium text-gray-900">VerifiCARLO - Centro de inspección</p>
            <p className="text-sm text-gray-500">{companyAddress}</p>
          </div>
        </div>

        {/* Línea conectora */}
        <div className="ml-5 border-l-2 border-dashed border-gray-200 h-4" />

        {/* Destino - Cliente */}
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <MapPin size={18} className="text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Destino</p>
            {hasClientLocation ? (
              <>
                <p className="font-medium text-gray-900">
                  {clientDistrict || 'Ubicación del cliente'}
                </p>
                {clientAddress && (
                  <p className="text-sm text-gray-500">{clientAddress}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400 italic">
                Dirección no especificada
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal de cancelación
function CancelModal({
  canRefund,
  isLoading,
  onCancel,
  onClose,
}: {
  canRefund: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="
        relative w-full sm:max-w-md
        bg-white rounded-t-3xl sm:rounded-2xl
        p-6 pb-8 sm:p-6
        animate-in slide-in-from-bottom sm:zoom-in-95 duration-300
      ">
        {/* Icono de advertencia */}
        <div className={`
          w-16 h-16 rounded-full mx-auto mb-4
          flex items-center justify-center
          ${canRefund ? 'bg-amber-100' : 'bg-red-100'}
        `}>
          <AlertTriangle size={32} className={canRefund ? 'text-amber-600' : 'text-red-600'} />
        </div>

        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
          ¿Cancelar inspección?
        </h3>

        <p className="text-gray-600 text-center mb-6">
          {canRefund ? (
            <>Recibirás un <span className="font-semibold text-green-600">reembolso completo</span> en 3-5 días hábiles.</>
          ) : (
            <>
              <span className="font-semibold text-red-600">No aplica reembolso</span> porque faltan menos de 24 horas para la cita.
            </>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="
              flex-1 py-3 px-4 rounded-xl
              bg-gray-100 hover:bg-gray-200
              text-gray-700 font-medium
              transition-colors
              disabled:opacity-50
            "
          >
            Mantener cita
          </button>

          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`
              flex-1 py-3 px-4 rounded-xl
              font-medium transition-colors
              disabled:opacity-50
              flex items-center justify-center gap-2
              ${canRefund
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
              }
            `}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              'Confirmar cancelación'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
