/**
 * Inspecciones: Lista de todas las inspecciones del usuario.
 * Estilo Stripe/Linear - minimalista y funcional.
 */
import { getClientInspections } from '@/services/inspections/inspections.server';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default async function InspectionsPage() {
  const inspections = await getClientInspections();

  const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    PENDING_PAYMENT: { label: 'Pendiente de pago', icon: Clock, color: 'text-amber-500' },
    PENDING_VERIFICATION: { label: 'Verificando pago', icon: Clock, color: 'text-amber-500' },
    PAID: { label: 'Confirmada', icon: CheckCircle, color: 'text-emerald-500' },
    COMPLETED: { label: 'Completada', icon: CheckCircle, color: 'text-emerald-500' },
    CANCELLED: { label: 'Cancelada', icon: XCircle, color: 'text-gray-400' },
    NO_SHOW: { label: 'No asistió', icon: AlertCircle, color: 'text-red-500' },
    EXPIRED: { label: 'Expirada', icon: XCircle, color: 'text-gray-400' },
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/app"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft size={16} />
        Inicio
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Inspecciones</h1>
        <p className="text-sm text-gray-500 mt-1">
          {inspections.length} en total
        </p>
      </div>

      {/* List */}
      {inspections.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500">Sin inspecciones</p>
          <Link
            href="/agendar"
            className="inline-block mt-4 text-sm font-medium text-gray-900 hover:underline"
          >
            Agendar primera inspección
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {inspections.map((inspection) => {
            const config = statusConfig[inspection.status] || statusConfig.PENDING_PAYMENT;
            const Icon = config.icon;

            return (
              <Link
                key={inspection.id}
                href={`/inspecciones/${inspection.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <Icon size={18} className={config.color} />

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {inspection.vehicle.model.brand.name} {inspection.vehicle.model.name} {inspection.vehicle.year}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(inspection.startTime), "d 'de' MMMM, yyyy", { locale: es })}
                    {' · '}
                    {inspection.inspectionPlan.title}
                  </p>
                </div>

                <div className="text-right">
                  <span className={`text-sm ${config.color}`}>{config.label}</span>
                </div>

                <ChevronRight size={16} className="text-gray-300" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
