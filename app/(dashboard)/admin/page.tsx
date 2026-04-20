import { CalendarCheck, Clock, XCircle, DollarSign } from 'lucide-react';
import { getDashboardStats } from '@/services/admin/admin.server';
import { MetricCard } from './components/MetricCard/MetricCard';
import { StatusBadge } from '@/app/components/ui/StatusBadge/StatusBadge';
import { BookingStatus } from '@prisma/client';

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Resumen del día</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
        <MetricCard
          title="Reservas hoy"
          value={stats.bookingsToday}
          icon={CalendarCheck}
          color="blue"
        />
        <MetricCard
          title="Pendientes"
          value={stats.pendingPayment}
          icon={Clock}
          color="yellow"
        />
        <MetricCard
          title="Cancelaciones"
          value={stats.cancelledToday}
          icon={XCircle}
          color="red"
        />
        <MetricCard
          title="Ingresos"
          value={`S/ ${stats.revenueToday.toFixed(2)}`}
          icon={DollarSign}
          color="green"
        />
      </div>

      {/* Recent Bookings - Mobile Cards */}
      <div className="block md:hidden">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="px-3 py-2.5 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Reservas recientes</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentBookings.length === 0 ? (
              <div className="px-3 py-6 text-center text-gray-500 text-xs">
                No hay reservas recientes
              </div>
            ) : (
              stats.recentBookings.map((booking) => (
                <div key={booking.id} className="px-3 py-2.5 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-xs truncate">{booking.clientName}</p>
                      <p className="text-[10px] text-gray-500 truncate">{booking.clientEmail}</p>
                    </div>
                    <StatusBadge status={booking.status as BookingStatus} size="sm" />
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="text-gray-400">Auto:</span>
                      <span className="truncate max-w-[100px]">{booking.vehicleInfo}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-gray-400">Hora:</span>
                      {booking.timeSlot}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {booking.inspectionType}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Bookings Table - Desktop/Tablet */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
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
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3 hidden lg:table-cell">
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
                    <td className="px-6 py-4 text-sm text-gray-700 hidden lg:table-cell">
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
