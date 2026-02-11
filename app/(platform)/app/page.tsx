/**
 * Home del Dashboard Cliente (/app).
 *
 * Primera pantalla tras login. Muestra:
 * - Saludo personalizado
 * - Estadísticas rápidas (pendientes, en proceso, completadas)
 * - CTA prominente para agendar
 * - Próxima inspección programada
 * - Actividad reciente
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Plus, Calendar, Clock, ChevronRight } from 'lucide-react';
import { getClientInspections } from '@/services/inspections/inspections.server';
import { formatearFechaHoraCorta } from '@/app/domain/datetime';
import { AgendarCTA } from '@/app/components/Platform';

export default async function ClientHomePage() {
  const session = await getServerSession(authOptions);
  const inspections = await getClientInspections();

  const firstName = session?.user?.name?.split(' ')[0] || 'Usuario';

  // Calcular estadísticas
  const stats = {
    pending: inspections.filter((i) =>
      ['PENDING_PAYMENT', 'PAID', 'CONFIRMED'].includes(i.status)
    ).length,
    inProgress: inspections.filter((i) => i.status === 'CONFIRMED').length,
    completed: inspections.filter((i) => i.status === 'COMPLETED').length,
  };

  // Próxima inspección (la más cercana que no esté completada/cancelada)
  const upcomingInspection = inspections
    .filter((i) => ['PENDING_PAYMENT', 'PAID', 'CONFIRMED'].includes(i.status))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

  // Actividad reciente (últimas 3 completadas)
  const recentActivity = inspections
    .filter((i) => i.status === 'COMPLETED')
    .slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Saludo */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Hola, {firstName}
        </h1>
        <p className="text-gray-500 mt-1">
          Aquí está el resumen de tus inspecciones
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
        <StatCard
          value={stats.pending}
          label="Pendientes"
          color="amber"
        />
        <StatCard
          value={stats.inProgress}
          label="En proceso"
          color="blue"
        />
        <StatCard
          value={stats.completed}
          label="Completadas"
          color="green"
        />
      </div>

      {/* CTA Agendar - Premium Design */}
      <AgendarCTA />

      {/* Próxima inspección */}
      {upcomingInspection && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Próxima inspección
          </h2>
          <Link
            href={`/inspecciones/${upcomingInspection.id}`}
            className="
              block bg-white rounded-xl border border-gray-100 p-4
              hover:border-[#F5D849] hover:shadow-md
              transition-all duration-200
            "
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">
                  {upcomingInspection.vehicle.model.brand.name}{' '}
                  {upcomingInspection.vehicle.model.name}{' '}
                  {upcomingInspection.vehicle.year}
                </p>
                {upcomingInspection.vehicle.plate && (
                  <p className="text-sm text-gray-500">
                    Placa: {upcomingInspection.vehicle.plate}
                  </p>
                )}
              </div>
              <StatusBadge status={upcomingInspection.status} />
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {formatearFechaHoraCorta(upcomingInspection.startTime)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                {upcomingInspection.timeSlot}
              </span>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              {upcomingInspection.inspectionPlan.title}
            </p>
          </Link>
        </section>
      )}

      {/* Actividad reciente */}
      {recentActivity.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Actividad reciente
            </h2>
            <Link
              href="/inspecciones"
              className="text-sm text-[#c4a82f] hover:text-[#a08825] font-medium"
            >
              Ver todas
            </Link>
          </div>

          <div className="space-y-2">
            {recentActivity.map((inspection) => (
              <Link
                key={inspection.id}
                href={`/inspecciones/${inspection.id}`}
                className="
                  flex items-center justify-between
                  bg-white rounded-lg border border-gray-100 px-4 py-3
                  hover:border-gray-200 transition-colors
                "
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {inspection.vehicle.model.brand.name} {inspection.vehicle.model.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Completada
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Estado vacío si no hay inspecciones */}
      {inspections.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sin inspecciones aún
          </h3>
          <p className="text-gray-500 mb-6">
            Agenda tu primera inspección vehicular
          </p>
          <Link
            href="/agendar"
            className="
              inline-flex items-center gap-2
              bg-[#F5D849] hover:bg-[#e5c83a]
              text-gray-900 font-semibold
              px-6 py-3 rounded-lg
              transition-colors
            "
          >
            <Plus size={20} />
            Agendar inspección
          </Link>
        </div>
      )}
    </div>
  );
}

// Componente de estadística
function StatCard({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: 'amber' | 'blue' | 'green';
}) {
  const colors = {
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
  };

  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-2xl sm:text-3xl font-bold">{value}</p>
      <p className="text-xs sm:text-sm font-medium opacity-80">{label}</p>
    </div>
  );
}

// Badge de estado simple
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    PENDING_PAYMENT: {
      label: 'Pendiente',
      className: 'bg-amber-100 text-amber-700',
    },
    PAID: {
      label: 'Pagado',
      className: 'bg-blue-100 text-blue-700',
    },
    CONFIRMED: {
      label: 'Confirmada',
      className: 'bg-indigo-100 text-indigo-700',
    },
    COMPLETED: {
      label: 'Completada',
      className: 'bg-green-100 text-green-700',
    },
    CANCELLED: {
      label: 'Cancelada',
      className: 'bg-red-100 text-red-700',
    },
  };

  const { label, className } = config[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
