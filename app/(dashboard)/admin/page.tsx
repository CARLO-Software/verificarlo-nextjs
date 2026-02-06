import { CalendarCheck, Clock, XCircle, DollarSign } from 'lucide-react';
import { getDashboardStats } from '@/services/admin/admin.server';
import { MetricCard } from './components/MetricCard/MetricCard';
import { StatusBadge } from '@/app/components/ui/StatusBadge/StatusBadge';
import { BookingStatus } from '@prisma/client';

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen del día</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Reservas hoy"
          value={stats.bookingsToday}
          icon={CalendarCheck}
          color="blue"
        />
        <MetricCard
          title="Pendientes de pago"
          value={stats.pendingPayment}
          icon={Clock}
          color="yellow"
        />
        <MetricCard
          title="Cancelaciones hoy"
          value={stats.cancelledToday}
          icon={XCircle}
          color="red"
        />
        <MetricCard
          title="Ingresos del día"
          value={`S/ ${stats.revenueToday.toFixed(2)}`}
          icon={DollarSign}
          color="green"
        />
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Reservas recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">
                  Cliente
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">
                  Vehículo
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">
                  Tipo
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">
                  Horario
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No hay reservas recientes
                  </td>
                </tr>
              ) : (
                stats.recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{booking.clientName}</p>
                      <p className="text-xs text-gray-500">{booking.clientEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {booking.vehicleInfo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {booking.inspectionType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {booking.timeSlot}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={booking.status as BookingStatus} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
