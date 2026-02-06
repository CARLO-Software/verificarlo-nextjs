import { db } from '@/lib/db';

export interface DashboardStats {
  bookingsToday: number;
  pendingPayment: number;
  cancelledToday: number;
  revenueToday: number;
  recentBookings: RecentBooking[];
}

export interface RecentBooking {
  id: number;
  status: string;
  date: Date;
  timeSlot: string;
  clientName: string;
  clientEmail: string;
  vehicleInfo: string;
  inspectionType: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [bookingsToday, pendingPayment, cancelledToday, revenueResult, recentBookings] =
    await Promise.all([
      // Reservas de hoy
      db.booking.count({
        where: {
          date: { gte: todayStart, lte: todayEnd },
        },
      }),

      // Pendientes de pago
      db.booking.count({
        where: { status: 'PENDING_PAYMENT' },
      }),

      // Cancelaciones de hoy
      db.booking.count({
        where: {
          status: 'CANCELLED',
          cancelledAt: { gte: todayStart, lte: todayEnd },
        },
      }),

      // Ingresos del día
      db.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          paidAt: { gte: todayStart, lte: todayEnd },
        },
      }),

      // Últimas 10 reservas
      db.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true, email: true } },
          vehicle: {
            include: {
              model: {
                include: { brand: true },
              },
            },
          },
          inspectionPlan: { select: { title: true } },
        },
      }),
    ]);

  return {
    bookingsToday,
    pendingPayment,
    cancelledToday,
    revenueToday: (revenueResult._sum.amount ?? 0) / 100, // céntimos a soles
    recentBookings: recentBookings.map((b) => ({
      id: b.id,
      status: b.status,
      date: b.date,
      timeSlot: b.timeSlot,
      clientName: b.client.name,
      clientEmail: b.client.email,
      vehicleInfo: `${b.vehicle.model.brand.name} ${b.vehicle.model.name} ${b.vehicle.year}`,
      inspectionType: b.inspectionPlan.title,
    })),
  };
}
