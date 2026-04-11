/**
 * InspectionDetailClient: Vista premium de una inspección.
 * Diseño +$10k: Glassmorphism, animaciones fluidas, jerarquía clara
 */
'use client';

import { useState, useEffect } from 'react';
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
  Sparkles,
  Shield,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { BookingStatus } from '@prisma/client';
import { getVerdict, getScoreCategoryInfo, type ScoreCategory } from '@/lib/inspection-verdict';
import { differenceInHours, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RescheduleModal } from '@/app/components/Dashboard';

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

// Configuración de estados - estilo minimalista
const statusConfig: Record<string, {
  label: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
}> = {
  PENDING_PAYMENT: {
    label: 'Pendiente de pago',
    description: 'Completa el pago para confirmar tu inspección',
    icon: Clock,
    iconColor: 'text-amber-600',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
  },
  PENDING_VERIFICATION: {
    label: 'Verificando pago',
    description: 'Tu pago está siendo verificado',
    icon: Clock,
    iconColor: 'text-orange-600',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-700',
  },
  PAID: {
    label: 'Confirmada',
    description: 'Tu inspección está programada',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
  },
  COMPLETED: {
    label: 'Completada',
    description: 'Tu informe está listo',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
  },
  CANCELLED: {
    label: 'Cancelada',
    description: 'Esta inspección fue cancelada',
    icon: XCircle,
    iconColor: 'text-gray-500',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-600',
  },
  NO_SHOW: {
    label: 'No asistió',
    description: 'No te presentaste a la cita',
    icon: AlertCircle,
    iconColor: 'text-gray-500',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-600',
  },
  EXPIRED: {
    label: 'Expirada',
    description: 'El tiempo de pago expiró',
    icon: Clock,
    iconColor: 'text-gray-500',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-600',
  },
};

export function InspectionDetailClient({ inspection }: Props) {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const status = statusConfig[inspection.status] || statusConfig.PENDING_PAYMENT;
  const StatusIcon = status.icon;

  // Calcular si puede cancelar/reprogramar (más de 24h antes)
  const hoursUntil = differenceInHours(new Date(inspection.startTime), new Date());
  const canCancelWithRefund = hoursUntil >= 24;
  const canCancel = hoursUntil > 0;
  const canReschedule = hoursUntil >= 24; // Solo se puede reprogramar con 24h+ de anticipación
  const isPending = ['PENDING_PAYMENT', 'PENDING_VERIFICATION', 'PAID'].includes(inspection.status);
  const isCompleted = inspection.status === 'COMPLETED';

  // Formatear fecha
  const formattedDate = format(new Date(inspection.startTime), "EEEE d 'de' MMMM", { locale: es });
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
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-12">
      {/* Header minimalista */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {/* Back button */}
          <Link
            href="/inspecciones"
            className="inline-flex items-center gap-2 px-3 py-2 -ml-3 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors mb-4"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Mis inspecciones</span>
          </Link>

          {/* Status principal */}
          <div className="flex items-start gap-4">
            {/* Ícono */}
            <div className={`
              w-12 h-12 rounded-xl ${status.badgeBg}
              flex items-center justify-center
            `}>
              <StatusIcon size={24} className={status.iconColor} />
            </div>

            <div className="flex-1 min-w-0">
              {/* Código */}
              <span className="text-xs font-mono text-gray-500">{inspection.code}</span>

              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1">
                {status.label}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {status.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CONTENIDO PRINCIPAL
      ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">

        {/* ─── CARD FECHA/HORA (Solo si pending) ─────────────────────── */}
        {isPending && (
          <div className={`
            bg-white rounded-3xl shadow-xl shadow-gray-200/50
            border border-gray-100/50
            p-6 mb-6 overflow-hidden
            ${mounted ? 'animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200' : 'opacity-0'}
          `}>
            <div className="flex items-center gap-5">
              {/* Calendario visual */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#F5D849] to-[#f0c424] flex flex-col items-center justify-center shadow-lg shadow-yellow-200/50">
                  <span className="text-3xl font-bold text-gray-900">
                    {format(new Date(inspection.startTime), 'd')}
                  </span>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {format(new Date(inspection.startTime), 'MMM', { locale: es })}
                  </span>
                </div>
                {/* Indicador de estado */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-white" />
                </div>
              </div>

              <div className="flex-1">
                <p className="text-lg font-semibold text-gray-900">{capitalizedDate}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <Clock size={14} className="text-gray-400" />
                    <span className="font-medium">{inspection.timeSlot}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Countdown premium */}
            {hoursUntil > 0 && hoursUntil < 72 && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  ${hoursUntil < 24
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
                    : 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200'
                  }
                `}>
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${hoursUntil < 24 ? 'bg-amber-100' : 'bg-emerald-100'}
                  `}>
                    <Clock size={18} className={hoursUntil < 24 ? 'text-amber-600' : 'text-emerald-600'} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${hoursUntil < 24 ? 'text-amber-800' : 'text-emerald-800'}`}>
                      {hoursUntil < 24 ? 'Tu cita es pronto' : 'Faltan'}
                    </p>
                    <p className={`text-xs ${hoursUntil < 24 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {hoursUntil < 24
                        ? `Menos de ${Math.ceil(hoursUntil)} horas`
                        : `Aproximadamente ${Math.floor(hoursUntil)} horas`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TIMELINE PREMIUM ──────────────────────────────────────── */}
        <InspectionTimeline
          createdAt={inspection.createdAt}
          mechanicalCompletedAt={inspection.report?.completedAt || null}
          legalCompletedAt={inspection.report?.legalReport?.completedAt || null}
          vehicleInspection={inspection.vehicleInspection}
          bookingId={inspection.id}
          mounted={mounted}
        />

        {/* ─── RESULTADOS (Si completada) ────────────────────────────── */}
        {isCompleted && inspection.report && (
          <ResultsCard
            report={inspection.report}
            inspectionId={inspection.id}
            mounted={mounted}
          />
        )}

        {/* ─── GRID DE INFO ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Vehículo */}
          <InfoCard
            icon={Car}
            title="Vehículo"
            delay={400}
            mounted={mounted}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center border border-gray-200">
                <Car size={24} className="text-gray-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">
                  {inspection.vehicle.brand} {inspection.vehicle.model}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">{inspection.vehicle.year}</span>
                  {inspection.vehicle.plate && (
                    <span className="px-2 py-0.5 bg-[#F5D849]/20 text-gray-700 text-xs font-semibold rounded-md">
                      {inspection.vehicle.plate}
                    </span>
                  )}
                  {inspection.vehicle.mileage && (
                    <span className="text-sm text-gray-400">
                      {inspection.vehicle.mileage.toLocaleString()} km
                    </span>
                  )}
                </div>
              </div>
            </div>
          </InfoCard>

          {/* Servicio */}
          <InfoCard
            icon={FileText}
            title="Servicio"
            delay={450}
            mounted={mounted}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{inspection.plan.title}</p>
                <p className="text-sm text-gray-500 capitalize mt-0.5">
                  Inspección {inspection.plan.type.toLowerCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  S/ {inspection.plan.price}
                </p>
                <p className="text-xs text-emerald-600 font-medium">Pagado</p>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* ─── INSPECTOR ─────────────────────────────────────────────── */}
        {inspection.inspector && (
          <InfoCard
            icon={User}
            title="Inspector asignado"
            delay={550}
            mounted={mounted}
            className="mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-lg">
                <span className="text-base font-bold text-white">
                  {inspection.inspector.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{inspection.inspector.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Shield size={12} className="text-emerald-500" />
                  <span className="text-sm text-emerald-600 font-medium">Inspector certificado</span>
                </div>
              </div>
            </div>
          </InfoCard>
        )}

        {/* ─── NOTAS DEL CLIENTE ─────────────────────────────────────── */}
        {inspection.clientNotes && (
          <InfoCard
            icon={FileText}
            title="Tus notas"
            delay={600}
            mounted={mounted}
            className="mb-6"
          >
            <p className="text-gray-700 text-sm leading-relaxed">
              {inspection.clientNotes}
            </p>
          </InfoCard>
        )}

        {/* ─── RESUMEN DEL INSPECTOR ─────────────────────────────────── */}
        {isCompleted && inspection.report?.executiveSummary && (
          <InfoCard
            icon={Sparkles}
            title="Resumen del inspector"
            delay={650}
            mounted={mounted}
            className="mb-6"
            highlight
          >
            <p className="text-gray-700 text-sm leading-relaxed">
              {inspection.report.executiveSummary}
            </p>
          </InfoCard>
        )}

        {/* ─── ACCIONES (Si pending) ─────────────────────────────────── */}
        {isPending && (
          <div className={`
            bg-white rounded-3xl shadow-xl shadow-gray-200/50
            border border-gray-100/50
            p-6 mb-6
            ${mounted ? 'animate-in fade-in slide-in-from-bottom-6 duration-700 delay-700' : 'opacity-0'}
          `}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Acciones
            </h3>

            <div className="space-y-3">
              {/* Reprogramar (solo si faltan +24h) */}
              {canReschedule ? (
                <button
                  onClick={() => setShowRescheduleModal(true)}
                  className="
                    group flex items-center justify-between w-full
                    py-4 px-5 rounded-2xl
                    bg-gray-50 hover:bg-gray-100
                    border border-gray-200 hover:border-gray-300
                    transition-all duration-300
                  "
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      <RefreshCw size={18} className="text-gray-600" />
                    </div>
                    <span className="font-medium text-gray-700">Reprogramar inspección</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <div className="py-3 px-5 rounded-2xl bg-gray-50 border border-gray-200">
                  <p className="text-sm text-gray-400 text-center">
                    Ya no es posible reprogramar (menos de 24h)
                  </p>
                </div>
              )}

              {/* Cancelar */}
              {canCancel ? (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="
                    group flex items-center justify-between w-full
                    py-4 px-5 rounded-2xl
                    bg-red-50 hover:bg-red-100
                    border-2 border-red-200 hover:border-red-300
                    transition-all duration-300
                  "
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      <XCircle size={18} className="text-red-500" />
                    </div>
                    <span className="font-medium text-red-600">Cancelar inspección</span>
                  </div>
                  <ChevronRight size={18} className="text-red-400 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <div className="py-3 px-5 rounded-2xl bg-gray-50 border border-gray-200">
                  <p className="text-sm text-gray-400 text-center">
                    Ya no es posible cancelar esta inspección
                  </p>
                </div>
              )}

              {/* Aviso de 24h */}
              {canCancel && !canCancelWithRefund && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    Faltan menos de 24 horas. La cancelación no incluye reembolso.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── SOPORTE ───────────────────────────────────────────────── */}
        <div className={`
          text-center py-6
          ${mounted ? 'animate-in fade-in duration-700 delay-[800ms]' : 'opacity-0'}
        `}>
          <p className="text-sm text-gray-400 mb-3">¿Necesitas ayuda?</p>
          <a
            href="https://wa.me/51999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center gap-2
              px-5 py-2.5 rounded-full
              bg-gradient-to-r from-emerald-500 to-teal-500
              text-white font-medium text-sm
              shadow-lg shadow-emerald-200/50
              hover:shadow-xl hover:scale-105
              transition-all duration-300
            "
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

      {/* Modal de reprogramación */}
      {showRescheduleModal && (
        <RescheduleModal
          bookingId={inspection.id}
          currentDate={capitalizedDate}
          currentTime={inspection.timeSlot}
          onClose={() => setShowRescheduleModal(false)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════

// Card de información genérico
function InfoCard({
  icon: Icon,
  title,
  children,
  delay = 0,
  mounted = true,
  className = '',
  highlight = false,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  delay?: number;
  mounted?: boolean;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`
        bg-white rounded-3xl shadow-xl shadow-gray-200/50
        border border-gray-100/50 p-6
        ${highlight ? 'ring-2 ring-[#F5D849]/30' : ''}
        ${mounted ? `animate-in fade-in slide-in-from-bottom-6 duration-700` : 'opacity-0'}
        ${className}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon size={14} className="text-gray-400" />
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

// Tarjeta de resultados premium
function ResultsCard({
  report,
  inspectionId,
  mounted,
}: {
  report: NonNullable<Inspection['report']>;
  inspectionId: number;
  mounted: boolean;
}) {
  const verdict = getVerdict(report.overallScore, report.overallStatus);

  const gradientMap = {
    SAFE: 'from-emerald-500 via-green-500 to-teal-500',
    NEGOTIATE: 'from-amber-500 via-orange-500 to-yellow-500',
    DONT_BUY: 'from-red-500 via-rose-500 to-pink-500',
    PENDING: 'from-gray-400 via-gray-500 to-gray-600',
  };

  const bgMap = {
    SAFE: 'from-emerald-50 to-teal-50 border-emerald-200',
    NEGOTIATE: 'from-amber-50 to-orange-50 border-amber-200',
    DONT_BUY: 'from-red-50 to-rose-50 border-red-200',
    PENDING: 'from-gray-50 to-slate-50 border-gray-200',
  };

  return (
    <div className={`
      bg-white rounded-3xl shadow-xl shadow-gray-200/50
      border border-gray-100/50 overflow-hidden mb-6
      ${mounted ? 'animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300' : 'opacity-0'}
    `}>
      {/* Header con veredicto */}
      <div className={`
        relative p-6 bg-gradient-to-r ${bgMap[verdict.type]} border-b
        overflow-hidden
      `}>
        {/* Fondo decorativo */}
        <div className="absolute inset-0">
          <div className={`absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br ${gradientMap[verdict.type]} opacity-10 rounded-full blur-3xl`} />
        </div>

        <div className="relative">
          {/* Score principal */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className={`text-sm font-medium ${verdict.color} mb-1`}>Puntaje General</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${verdict.color}`}>
                  {report.overallScore ?? '--'}
                </span>
                <span className={`text-xl ${verdict.color} opacity-60`}>/100</span>
              </div>
            </div>

            {/* Badge de veredicto */}
            <div className={`
              p-4 rounded-2xl border-2
              ${verdict.bgColor} ${verdict.borderColor}
              shadow-lg
            `}>
              <div className="text-center">
                <span className="text-4xl block mb-1">{verdict.icon}</span>
                <p className={`font-bold text-sm ${verdict.color}`}>{verdict.label}</p>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <p className={`text-sm ${verdict.color} opacity-80`}>
            {verdict.subtitle}
          </p>
        </div>
      </div>

      {/* Grid de scores */}
      <div className="grid grid-cols-3 divide-x divide-gray-100">
        <ScoreCard
          label="Legal"
          score={report.legalScore}
          status={report.legalStatus}
          category="legal"
        />
        <ScoreCard
          label="Mecánica"
          score={report.mechanicalScore}
          status={report.mechanicalStatus}
          category="mechanical"
        />
        <ScoreCard
          label="Carrocería"
          score={report.bodyScore}
          status={report.bodyStatus}
          category="body"
        />
      </div>

      {/* Botón de descarga premium */}
      {report.completedAt && (
        <div className="p-5 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
          <a
            href={`/api/inspections/${inspectionId}/report/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="
              group flex items-center justify-center gap-3 w-full
              bg-gradient-to-r from-[#F5D849] via-[#f0d24a] to-[#F5D849]
              hover:from-[#e5c83a] hover:via-[#e0c23a] hover:to-[#e5c83a]
              text-gray-900 font-bold
              py-4 px-6 rounded-2xl
              shadow-xl shadow-yellow-300/40
              transition-all duration-300
              hover:shadow-2xl hover:scale-[1.02]
              active:scale-[0.98]
            "
          >
            <Download size={20} className="group-hover:animate-bounce" />
            Descargar Informe Completo
            <ExternalLink size={16} className="opacity-60" />
          </a>
        </div>
      )}
    </div>
  );
}

// Score card individual
function ScoreCard({ label, score, status, category }: {
  label: string;
  score: number | null;
  status: string;
  category?: ScoreCategory;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusColor = (s: string) => {
    if (s === 'OK') return 'text-emerald-600';
    if (s === 'WARNING') return 'text-amber-600';
    if (s === 'CRITICAL') return 'text-red-600';
    return 'text-gray-400';
  };

  const getStatusBg = (s: string) => {
    if (s === 'OK') return 'bg-emerald-100';
    if (s === 'WARNING') return 'bg-amber-100';
    if (s === 'CRITICAL') return 'bg-red-100';
    return 'bg-gray-100';
  };

  const categoryInfo = category ? getScoreCategoryInfo(category) : null;

  return (
    <div className="p-5 text-center relative group hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        {categoryInfo && (
          <button
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="text-gray-300 hover:text-gray-500 transition-colors"
          >
            <HelpCircle size={12} />
          </button>
        )}
      </div>

      <div className={`
        inline-flex items-center justify-center
        w-14 h-14 rounded-2xl mb-2
        ${getStatusBg(status)}
      `}>
        <span className={`text-2xl font-bold ${getStatusColor(status)}`}>
          {score ?? '--'}
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && categoryInfo && (
        <div className="
          absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2
          w-64 p-4 rounded-2xl shadow-xl border border-gray-200
          bg-white text-left
          animate-in fade-in zoom-in-95 duration-200
        ">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-200 rotate-45" />
          <p className="font-bold text-gray-900 text-sm mb-1">{categoryInfo.title}</p>
          <p className="text-xs text-gray-600 mb-3">{categoryInfo.description}</p>
          <ul className="space-y-1.5">
            {categoryInfo.items.map((item, idx) => (
              <li key={idx} className="text-xs text-gray-500 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5D849] mt-1.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Timeline de progreso premium
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
  mounted,
}: {
  createdAt: Date;
  mechanicalCompletedAt: Date | null;
  legalCompletedAt: Date | null;
  vehicleInspection?: VehicleInspectionData | null;
  bookingId: number;
  mounted: boolean;
}) {
  if (vehicleInspection) {
    const { legalStatus, mechanicalStatus, assignedMechanic, assignedAdmin } = vehicleInspection;
    const isParallelFlow = vehicleInspection.plate !== null && vehicleInspection.legalUnlockedAt === null;
    const allCompleted = mechanicalStatus === 'COMPLETADO' && legalStatus === 'COMPLETADO';

    return (
      <div className={`
        bg-white rounded-3xl shadow-xl shadow-gray-200/50
        border border-gray-100/50 p-6 mb-6 overflow-hidden
        ${mounted ? 'animate-in fade-in slide-in-from-bottom-6 duration-700 delay-250' : 'opacity-0'}
      `}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400" />
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Progreso
            </h3>
          </div>
          {isParallelFlow && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wider">
              Paralelo
            </span>
          )}
        </div>

        {/* Paso inicial */}
        <div className="flex gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <CheckCircle2 size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Inspección creada</p>
            <p className="text-sm text-gray-500">Tu solicitud fue registrada</p>
            <p className="text-xs text-emerald-600 mt-1 font-medium">
              {format(new Date(createdAt), "d MMM yyyy, HH:mm", { locale: es })}
            </p>
          </div>
        </div>

        {/* Grid de inspecciones (paralelo o secuencial) */}
        <div className={`grid ${isParallelFlow ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
          {/* Inspección Mecánica */}
          <FlowCard
            title="Inspección mecánica"
            status={mechanicalStatus}
            icon={Wrench}
            assignedTo={assignedMechanic?.name}
            completedAt={vehicleInspection.mechanicCompletedAt}
            downloadUrl={mechanicalStatus === 'COMPLETADO' ? `/api/inspections/${bookingId}/report/pdf` : undefined}
            downloadLabel="Descargar informe mecánico"
          />

          {/* Revisión Legal */}
          <FlowCard
            title="Revisión legal"
            status={legalStatus}
            icon={Scale}
            assignedTo={legalStatus !== 'BLOQUEADO' ? assignedAdmin?.name : undefined}
            completedAt={vehicleInspection.legalCompletedAt}
            downloadUrl={legalStatus === 'COMPLETADO' ? `/api/admin/vehicle-inspections/${vehicleInspection.id}/legal/download-pdf` : undefined}
            downloadLabel="Descargar informe legal"
            isBlocked={legalStatus === 'BLOQUEADO'}
          />
        </div>

        {/* Completado */}
        {allCompleted && (
          <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-emerald-700">Inspección completada</span>
          </div>
        )}
      </div>
    );
  }

  // Fallback simple
  return (
    <div className={`
      bg-white rounded-3xl shadow-xl shadow-gray-200/50
      border border-gray-100/50 p-6 mb-6
      ${mounted ? 'animate-in fade-in slide-in-from-bottom-6 duration-700 delay-250' : 'opacity-0'}
    `}>
      <div className="flex items-center gap-2 mb-6">
        <Clock size={14} className="text-gray-400" />
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Progreso
        </h3>
      </div>

      <div className="space-y-4">
        <TimelineStep
          label="Inspección creada"
          description="Tu solicitud fue registrada"
          completedAt={createdAt}
          isCompleted
          icon={Circle}
        />
        <TimelineStep
          label="Inspección mecánica"
          description="Revisión técnica del vehículo"
          completedAt={mechanicalCompletedAt}
          isCompleted={!!mechanicalCompletedAt}
          icon={Wrench}
        />
        <TimelineStep
          label="Revisión legal"
          description="Verificación documental"
          completedAt={legalCompletedAt}
          isCompleted={!!legalCompletedAt}
          icon={Scale}
          isLast
        />
      </div>
    </div>
  );
}

function FlowCard({
  title,
  status,
  icon: Icon,
  assignedTo,
  completedAt,
  downloadUrl,
  downloadLabel,
  isBlocked,
}: {
  title: string;
  status: LegalStatusType | MechanicalStatusType;
  icon: React.ElementType;
  assignedTo?: string;
  completedAt?: Date | null;
  downloadUrl?: string;
  downloadLabel?: string;
  isBlocked?: boolean;
}) {
  const statusStyles = {
    COMPLETADO: {
      border: 'border-emerald-200',
      bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
      iconBg: 'bg-emerald-500',
      badge: 'bg-emerald-100 text-emerald-700',
    },
    EN_PROCESO: {
      border: 'border-blue-200',
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      iconBg: 'bg-blue-500',
      badge: 'bg-blue-100 text-blue-700',
    },
    PENDIENTE: {
      border: 'border-amber-200',
      bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
      iconBg: 'bg-amber-500',
      badge: 'bg-amber-100 text-amber-700',
    },
    BLOQUEADO: {
      border: 'border-gray-200',
      bg: 'bg-gradient-to-br from-gray-50 to-slate-50',
      iconBg: 'bg-gray-400',
      badge: 'bg-gray-100 text-gray-500',
    },
  };

  const style = statusStyles[status] || statusStyles.PENDIENTE;
  const statusLabels = {
    COMPLETADO: 'Completado',
    EN_PROCESO: 'En proceso',
    PENDIENTE: 'Pendiente',
    BLOQUEADO: 'Bloqueado',
  };

  return (
    <div className={`p-5 rounded-2xl border-2 ${style.border} ${style.bg}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center shadow-lg`}>
          {status === 'COMPLETADO' ? (
            <CheckCircle2 size={18} className="text-white" />
          ) : isBlocked ? (
            <AlertCircle size={18} className="text-white" />
          ) : (
            <Icon size={18} className="text-white" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{title}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge} uppercase`}>
            {statusLabels[status]}
          </span>
        </div>
      </div>

      {assignedTo && (
        <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-2">
          <User size={12} /> {assignedTo}
        </p>
      )}

      {isBlocked && (
        <p className="text-xs text-gray-400 italic">
          Esperando que se registre la placa
        </p>
      )}

      {completedAt && (
        <p className="text-xs text-emerald-600 font-medium">
          {format(new Date(completedAt), "d MMM, HH:mm", { locale: es })}
        </p>
      )}

      {downloadUrl && (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-4 py-2.5 rounded-xl transition-colors"
        >
          <Download size={14} />
          {downloadLabel}
        </a>
      )}
    </div>
  );
}

function TimelineStep({
  label,
  description,
  completedAt,
  isCompleted,
  icon: Icon,
  isLast,
}: {
  label: string;
  description: string;
  completedAt?: Date | null;
  isCompleted: boolean;
  icon: React.ElementType;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center
          ${isCompleted
            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-200'
            : 'bg-gray-100'
          }
        `}>
          {isCompleted ? (
            <CheckCircle2 size={18} className="text-white" />
          ) : (
            <Icon size={18} className="text-gray-400" />
          )}
        </div>
        {!isLast && (
          <div className={`w-0.5 h-8 my-1 ${isCompleted ? 'bg-emerald-300' : 'bg-gray-200'}`} />
        )}
      </div>
      <div className="flex-1 pb-4">
        <p className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
        {completedAt && (
          <p className="text-xs text-emerald-600 mt-1 font-medium">
            {format(new Date(completedAt), "d MMM yyyy, HH:mm", { locale: es })}
          </p>
        )}
      </div>
    </div>
  );
}

// Sección de ubicación
function LocationSection({
  clientAddress,
  clientDistrict,
  mounted,
}: {
  clientAddress: string | null;
  clientDistrict: string | null;
  mounted: boolean;
}) {
  const companyAddress = "Av. Javier Prado Este 4200, Santiago de Surco";
  const hasClientLocation = clientAddress || clientDistrict;

  return (
    <div className={`
      bg-white rounded-3xl shadow-xl shadow-gray-200/50
      border border-gray-100/50 p-6 mb-6
      ${mounted ? 'animate-in fade-in slide-in-from-bottom-6 duration-700 delay-350' : 'opacity-0'}
    `}>
      <div className="flex items-center gap-2 mb-5">
        <Navigation size={14} className="text-gray-400" />
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Ubicación
        </h3>
      </div>

      <div className="space-y-4">
        {/* Origen */}
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Origen</p>
            <p className="font-semibold text-gray-900">VerifiCARLO</p>
            <p className="text-sm text-gray-500">{companyAddress}</p>
          </div>
        </div>

        {/* Línea conectora */}
        <div className="ml-6 border-l-2 border-dashed border-gray-200 h-6" />

        {/* Destino */}
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <MapPin size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Destino</p>
            {hasClientLocation ? (
              <>
                <p className="font-semibold text-gray-900">
                  {clientDistrict || 'Tu ubicación'}
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

// Modal de cancelación premium
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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="
        relative w-full sm:max-w-md
        bg-white rounded-t-[2rem] sm:rounded-3xl
        p-6 pb-10 sm:p-8
        animate-in slide-in-from-bottom sm:zoom-in-95 duration-300
        shadow-2xl
      ">
        {/* Icono */}
        <div className={`
          w-20 h-20 rounded-3xl mx-auto mb-6
          flex items-center justify-center
          ${canRefund
            ? 'bg-gradient-to-br from-amber-100 to-orange-100'
            : 'bg-gradient-to-br from-red-100 to-rose-100'
          }
        `}>
          <AlertTriangle
            size={40}
            className={canRefund ? 'text-amber-600' : 'text-red-600'}
          />
        </div>

        <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
          ¿Cancelar inspección?
        </h3>

        <p className="text-gray-600 text-center mb-8">
          {canRefund ? (
            <>
              Recibirás un{' '}
              <span className="font-bold text-emerald-600">reembolso completo</span>
              {' '}en 3-5 días hábiles.
            </>
          ) : (
            <>
              <span className="font-bold text-red-600">No aplica reembolso</span>
              {' '}porque faltan menos de 24 horas para tu cita.
            </>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="
              flex-1 py-4 px-6 rounded-2xl
              bg-gray-100 hover:bg-gray-200
              text-gray-700 font-semibold
              transition-all duration-300
              disabled:opacity-50
            "
          >
            Mantener cita
          </button>

          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`
              flex-1 py-4 px-6 rounded-2xl
              font-semibold transition-all duration-300
              disabled:opacity-50
              flex items-center justify-center gap-2
              shadow-lg
              ${canRefund
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-200'
                : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-red-200'
              }
            `}
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              'Confirmar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
