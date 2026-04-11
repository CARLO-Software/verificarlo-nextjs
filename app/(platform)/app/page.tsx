/**
 * Dashboard Principal: Vista contextual basada en el estado del usuario.
 *
 * Prioridad de decisiones:
 * 1. Pago pendiente → PaymentCard
 * 2. Inspección confirmada próxima → UpcomingCard
 * 3. Sin pendientes → EmptyState
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getClientInspections } from '@/services/inspections/inspections.server';
import { format, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Plus, ChevronRight } from 'lucide-react';
import {
  PaymentCard,
  UpcomingCard,
  EmptyState,
} from '@/app/components/Dashboard';

// Saludo dinámico según la hora
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Buenos días';
  if (hour >= 12 && hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const inspections = await getClientInspections();

  const firstName = session?.user?.name?.split(' ')[0] || 'Usuario';
  const greeting = getGreeting();

  // Clasificar inspecciones por estado
  const pendingPayment = inspections.find(i =>
    i.status === 'PENDING_PAYMENT' || i.status === 'PENDING_VERIFICATION'
  );

  const upcoming = inspections.find(i => i.status === 'PAID');

  const totalInspections = inspections.length;

  // Determinar qué mostrar (prioridad)
  const primaryCard = pendingPayment
    ? 'payment'
    : upcoming
      ? 'upcoming'
      : 'empty';

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      {/* Elemento decorativo de fondo */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/3 pointer-events-none select-none">
        <span className="text-[14rem] font-black text-gray-200 tracking-tighter leading-none">
          V
        </span>
      </div>

      <div className="relative space-y-8 py-2">
        {/* Saludo dinámico */}
        <div>
          <p className="text-base text-gray-500">{greeting},</p>
          <h1 className="text-3xl font-semibold text-gray-900">{firstName}</h1>
        </div>

        {/* Card principal según estado */}
        {primaryCard === 'payment' && pendingPayment && (
          <PaymentCard
            inspection={{
              id: pendingPayment.id,
              vehicle: `${pendingPayment.vehicle.model.brand.name} ${pendingPayment.vehicle.model.name} ${pendingPayment.vehicle.year}`,
              plan: pendingPayment.inspectionPlan.title,
              price: pendingPayment.inspectionPlan.price,
              expiresAt: pendingPayment.expiresAt || new Date(pendingPayment.createdAt.getTime() + 30 * 60 * 1000),
            }}
          />
        )}

        {primaryCard === 'upcoming' && upcoming && (
          <UpcomingCard
            inspection={{
              id: upcoming.id,
              vehicle: `${upcoming.vehicle.model.brand.name} ${upcoming.vehicle.model.name} ${upcoming.vehicle.year}`,
              date: format(new Date(upcoming.startTime), "EEEE d 'de' MMMM", { locale: es }),
              time: upcoming.timeSlot,
              location: null,
              plan: upcoming.inspectionPlan.title,
              canReschedule: differenceInHours(new Date(upcoming.startTime), new Date()) >= 24,
            }}
          />
        )}

        {primaryCard === 'empty' && <EmptyState />}

        {/* Acciones secundarias */}
        <div className="space-y-3 pt-4">
          {/* Agendar otra (si hay algo activo) */}
          {primaryCard !== 'empty' && (
            <Link
              href="/agendar"
              className="flex items-center gap-3 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Plus size={18} />
              Agendar otra inspección
            </Link>
          )}

          {/* Link a mis inspecciones */}
          {totalInspections > 0 && (
            <Link
              href="/inspecciones"
              className="flex items-center justify-between py-4 px-5 -mx-1 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">Mis inspecciones</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {totalInspections} {totalInspections === 1 ? 'inspección' : 'inspecciones'} en total
                </p>
              </div>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
