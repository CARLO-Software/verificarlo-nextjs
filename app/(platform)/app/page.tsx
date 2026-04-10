/**
 * Dashboard del Cliente (/app)
 *
 * Pantalla principal tras login. Diseño premium con:
 * - Jerarquía visual clara
 * - Flujo lógico de información
 * - Micro-animaciones sutiles
 * - Responsive (móvil + desktop)
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import {
  Plus,
  Calendar,
  Clock,
  ChevronRight,
  Car,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  FileCheck,
  MapPin,
} from 'lucide-react';
import { getClientInspections } from '@/services/inspections/inspections.server';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default async function ClientHomePage() {
  const session = await getServerSession(authOptions);
  const inspections = await getClientInspections();

  const firstName = session?.user?.name?.split(' ')[0] || 'Usuario';
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Buenos días' : currentHour < 19 ? 'Buenas tardes' : 'Buenas noches';

  // Inspecciones activas (pendientes o pagadas)
  const activeInspections = inspections.filter((i) =>
    ['PENDING_PAYMENT', 'PENDING_VERIFICATION', 'PAID'].includes(i.status)
  );

  // Próxima inspección
  const upcomingInspection = activeInspections
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

  // Inspecciones completadas
  const completedInspections = inspections.filter((i) => i.status === 'COMPLETED');

  // Stats
  const stats = {
    active: activeInspections.length,
    completed: completedInspections.length,
    total: inspections.length,
  };

  const hasInspections = inspections.length > 0;
  const hasUpcoming = !!upcomingInspection;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50/50 to-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* ═══════════════════════════════════════════════════════════════
            HEADER - Saludo personalizado
        ═══════════════════════════════════════════════════════════════ */}
        <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <p className="text-sm font-medium text-gray-400 mb-1">{greeting},</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            {firstName}
          </h1>
        </header>

        {/* ═══════════════════════════════════════════════════════════════
            CONTENIDO PRINCIPAL
        ═══════════════════════════════════════════════════════════════ */}

        {!hasInspections ? (
          /* ─── ESTADO VACÍO ─────────────────────────────────────────── */
          <EmptyState />
        ) : (
          <div className="space-y-8">
            {/* ─── PRÓXIMA INSPECCIÓN (Hero Card) ───────────────────────── */}
            {hasUpcoming && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <UpcomingInspectionCard inspection={upcomingInspection} />
              </section>
            )}

            {/* ─── CTA AGENDAR ──────────────────────────────────────────── */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
              <AgendarCard hasUpcoming={hasUpcoming} />
            </section>

            {/* ─── RESUMEN ──────────────────────────────────────────────── */}
            {stats.total > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                <StatsSection stats={stats} />
              </section>
            )}

            {/* ─── HISTORIAL ────────────────────────────────────────────── */}
            {completedInspections.length > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[400ms]">
                <HistorySection inspections={completedInspections.slice(0, 3)} />
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTES
═══════════════════════════════════════════════════════════════════════════ */
/**
 * Card de próxima inspección - Elemento hero del dashboard
 */
function UpcomingInspectionCard({ inspection }: { inspection: any }) {
  const isPaid = inspection.status === 'PAID';
  const isPendingPayment = inspection.status === 'PENDING_PAYMENT';
  const formattedDate = format(new Date(inspection.startTime), "EEEE d 'de' MMMM", { locale: es });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
        Tu próxima inspección
      </h2>

      <Link
        href={`/inspecciones/${inspection.id}`}
        className="
          group block
          bg-white rounded-2xl
          border border-gray-100
          shadow-sm shadow-gray-100/50
          overflow-hidden
          transition-all duration-300
          hover:shadow-xl hover:shadow-gray-200/50
          hover:border-gray-200
          hover:-translate-y-0.5
        "
      >
        {/* Barra de estado superior */}
        <div
          className={`
            h-1.5 w-full
            ${isPaid ? 'bg-gradient-to-r from-green-400 to-emerald-500' : ''}
            ${isPendingPayment ? 'bg-gradient-to-r from-amber-400 to-orange-500' : ''}
          `}
        />

        <div className="p-5 sm:p-6">
          {/* Header: Vehículo + Estado */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`
                  w-12 h-12 rounded-xl flex items-center justify-center
                  ${isPaid ? 'bg-green-50' : 'bg-amber-50'}
                  transition-transform duration-300 group-hover:scale-105
                `}
              >
                <Car
                  size={24}
                  className={isPaid ? 'text-green-600' : 'text-amber-600'}
                  strokeWidth={1.5}
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                  {inspection.vehicle.model.brand.name} {inspection.vehicle.model.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {inspection.vehicle.year}
                  {inspection.vehicle.plate && ` · ${inspection.vehicle.plate}`}
                </p>
              </div>
            </div>

            <StatusPill status={inspection.status} />
          </div>

          {/* Detalles de la cita */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              {capitalizedDate}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              {inspection.timeSlot} hrs
            </span>
          </div>

          {/* Footer: Plan + Acción */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <FileCheck size={14} className="text-gray-400" />
              <span className="text-sm text-gray-500">{inspection.inspectionPlan.title}</span>
            </div>
            <div
              className="
                flex items-center gap-1 text-sm font-medium text-gray-900
                opacity-0 translate-x-2
                group-hover:opacity-100 group-hover:translate-x-0
                transition-all duration-300
              "
            >
              Ver detalles
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

/**
 * Card para agendar nueva inspección
 */
function AgendarCard({ hasUpcoming }: { hasUpcoming: boolean }) {
  return (
    <Link
      href="/agendar"
      className={`
        group relative block
        rounded-2xl overflow-hidden
        transition-all duration-300
        ${
          hasUpcoming
            ? 'bg-gray-50 border border-gray-100 hover:bg-gray-100/80 hover:border-gray-200'
            : 'bg-gradient-to-br from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700'
        }
      `}
    >
      {/* Decoración de fondo */}
      {!hasUpcoming && (
        <>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5D849]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
        </>
      )}

      <div className="relative p-5 sm:p-6 flex items-center gap-4">
        {/* Icono */}
        <div
          className={`
            flex-shrink-0 w-14 h-14 rounded-xl
            flex items-center justify-center
            transition-all duration-300
            ${
              hasUpcoming
                ? 'bg-white shadow-sm group-hover:shadow-md group-hover:scale-105'
                : 'bg-[#F5D849] shadow-lg shadow-amber-500/20 group-hover:scale-105 group-hover:rotate-2'
            }
          `}
        >
          {hasUpcoming ? (
            <Plus size={24} className="text-gray-700" strokeWidth={1.5} />
          ) : (
            <Car size={26} className="text-gray-900" strokeWidth={1.5} />
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {!hasUpcoming && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
              <Sparkles size={10} />
              Agenda ahora
            </span>
          )}
          <h3
            className={`
              font-semibold text-base sm:text-lg
              ${hasUpcoming ? 'text-gray-900' : 'text-white'}
            `}
          >
            {hasUpcoming ? 'Agendar otra inspección' : '¿Comprando un auto usado?'}
          </h3>
          <p
            className={`
              text-sm mt-0.5
              ${hasUpcoming ? 'text-gray-500' : 'text-gray-400'}
            `}
          >
            {hasUpcoming
              ? 'Revisa otro vehículo con nuestros expertos'
              : 'Inspección profesional antes de comprar'}
          </p>
        </div>

        {/* Flecha */}
        <div
          className={`
            flex-shrink-0 w-10 h-10 rounded-full
            flex items-center justify-center
            transition-all duration-300
            ${
              hasUpcoming
                ? 'bg-gray-200/50 group-hover:bg-[#F5D849]'
                : 'bg-white/10 group-hover:bg-[#F5D849]'
            }
          `}
        >
          <ArrowRight
            size={18}
            className={`
              transition-all duration-300
              group-hover:translate-x-0.5
              ${hasUpcoming ? 'text-gray-600 group-hover:text-gray-900' : 'text-white group-hover:text-gray-900'}
            `}
          />
        </div>
      </div>
    </Link>
  );
}

/**
 * Sección de estadísticas
 */
function StatsSection({ stats }: { stats: { active: number; completed: number; total: number } }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
        Resumen
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm shadow-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-xs text-gray-500">En proceso</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm shadow-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-xs text-gray-500">Completadas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Sección de historial
 */
function HistorySection({ inspections }: { inspections: any[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Historial
        </h2>
        <Link
          href="/inspecciones"
          className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Ver todo
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm shadow-gray-50 overflow-hidden divide-y divide-gray-50">
        {inspections.map((inspection) => (
          <Link
            key={inspection.id}
            href={`/inspecciones/${inspection.id}`}
            className="
              flex items-center gap-4 p-4
              hover:bg-gray-50/50
              transition-colors duration-200
            "
          >
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} className="text-green-600" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">
                {inspection.vehicle.model.brand.name} {inspection.vehicle.model.name}{' '}
                {inspection.vehicle.year}
              </p>
              <p className="text-xs text-gray-400">
                {format(new Date(inspection.startTime), "d MMM yyyy", { locale: es })}
              </p>
            </div>

            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Estado vacío - Primera vez del usuario
 */
function EmptyState() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center py-8">
        {/* Ilustración */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* Círculos decorativos */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#F5D849]/20 to-amber-100/30 rounded-full animate-pulse" />
          <div className="absolute inset-4 bg-gradient-to-br from-[#F5D849]/30 to-amber-200/40 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Car size={48} className="text-amber-600" strokeWidth={1} />
          </div>
        </div>

        {/* Texto */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Bienvenido a VerifiCARLO
        </h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          Agenda tu primera inspección vehicular y compra tu próximo auto con total tranquilidad.
        </p>

        {/* CTA Principal */}
        <Link
          href="/agendar"
          className="
            inline-flex items-center gap-2
            bg-gray-900 hover:bg-gray-800
            text-white font-semibold
            px-8 py-4 rounded-xl
            shadow-lg shadow-gray-900/20
            transition-all duration-300
            hover:shadow-xl hover:shadow-gray-900/30
            hover:-translate-y-0.5
          "
        >
          <Plus size={20} strokeWidth={2} />
          Agendar inspección
        </Link>

        {/* Beneficios */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {[
            { icon: CheckCircle2, title: 'Profesional', desc: 'Inspectores certificados' },
            { icon: Clock, title: 'Rápido', desc: 'Resultados en 24h' },
            { icon: FileCheck, title: 'Completo', desc: 'Más de 150 puntos' },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/50"
            >
              <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                <item.icon size={16} className="text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Pill de estado
 */
function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    PENDING_PAYMENT: {
      label: 'Pendiente de pago',
      className: 'bg-amber-50 text-amber-700 ring-amber-200/50',
    },
    PENDING_VERIFICATION: {
      label: 'Verificando pago',
      className: 'bg-orange-50 text-orange-700 ring-orange-200/50',
    },
    PAID: {
      label: 'Confirmada',
      className: 'bg-green-50 text-green-700 ring-green-200/50',
    },
    COMPLETED: {
      label: 'Completada',
      className: 'bg-green-50 text-green-700 ring-green-200/50',
    },
    CANCELLED: {
      label: 'Cancelada',
      className: 'bg-gray-100 text-gray-600 ring-gray-200/50',
    },
  };

  const { label, className } = config[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-600 ring-gray-200/50',
  };

  return (
    <span
      className={`
        inline-flex items-center
        px-2.5 py-1 rounded-full
        text-xs font-medium
        ring-1 ring-inset
        ${className}
      `}
    >
      {label}
    </span>
  );
}
