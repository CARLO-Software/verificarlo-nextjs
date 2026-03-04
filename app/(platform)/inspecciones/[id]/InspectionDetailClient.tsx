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
} from 'lucide-react';
import { BookingStatus } from '@prisma/client';
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
  const isPending = ['PENDING_PAYMENT', 'PAID', 'CONFIRMED'].includes(inspection.status);
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
        method: 'PUT',
      });

      if (res.ok) {
        router.refresh();
        setShowCancelModal(false);
      }
    } catch (error) {
      console.error('Error cancelando:', error);
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

        {/* Resultados si está completada */}
        {isCompleted && inspection.report && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6 animate-in slide-in-from-bottom duration-500">
            {/* Score principal */}
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Puntaje General</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-green-700">
                      {inspection.report.overallScore || '--'}
                    </span>
                    <span className="text-lg text-green-600">/100</span>
                  </div>
                </div>

                <div className={`
                  px-4 py-2 rounded-full font-semibold text-sm
                  ${inspection.report.overallStatus === 'OK'
                    ? 'bg-green-100 text-green-700'
                    : inspection.report.overallStatus === 'WARNING'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }
                `}>
                  {inspection.report.overallStatus === 'OK' ? '✓ Aprobado' :
                   inspection.report.overallStatus === 'WARNING' ? '⚠ Con observaciones' :
                   '✗ Requiere atención'}
                </div>
              </div>
            </div>

            {/* Desglose de puntajes */}
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              <ScoreCard
                label="Legal"
                score={inspection.report.legalScore}
                status={inspection.report.legalStatus}
              />
              <ScoreCard
                label="Mecánica"
                score={inspection.report.mechanicalScore}
                status={inspection.report.mechanicalStatus}
              />
              <ScoreCard
                label="Carrocería"
                score={inspection.report.bodyScore}
                status={inspection.report.bodyStatus}
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
        )}

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

// Componente de score individual
function ScoreCard({ label, score, status }: { label: string; score: number | null; status: string }) {
  const getStatusColor = (s: string) => {
    if (s === 'OK') return 'text-green-600';
    if (s === 'WARNING') return 'text-amber-600';
    if (s === 'CRITICAL') return 'text-red-600';
    return 'text-gray-400';
  };

  return (
    <div className="p-4 text-center">
      <p className="text-xs font-medium text-gray-500 uppercase mb-1">{label}</p>
      <p className={`text-2xl font-bold ${getStatusColor(status)}`}>
        {score ?? '--'}
      </p>
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
