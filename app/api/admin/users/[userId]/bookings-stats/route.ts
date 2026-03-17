import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Verificar que es admin
  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const { userId } = await params;

  try {
    // Obtener conteo de reservas por estado como cliente
    const clientBookings = await db.booking.groupBy({
      by: ["status"],
      where: { clientId: userId },
      _count: { status: true },
    });

    // Obtener conteo de reservas como inspector
    const inspectorBookings = await db.booking.groupBy({
      by: ["status"],
      where: { inspectorId: userId },
      _count: { status: true },
    });

    // Transformar a objeto más legible
    const clientStats = clientBookings.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        acc.total += item._count.status;
        return acc;
      },
      {
        total: 0,
        PENDING_PAYMENT: 0,
        PENDING_VERIFICATION: 0,
        PAID: 0,
        CONFIRMED: 0,
        COMPLETED: 0,
        CANCELLED: 0,
        NO_SHOW: 0,
        EXPIRED: 0,
      } as Record<string, number>
    );

    const inspectorStats = inspectorBookings.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        acc.total += item._count.status;
        return acc;
      },
      {
        total: 0,
        PENDING_PAYMENT: 0,
        PENDING_VERIFICATION: 0,
        PAID: 0,
        CONFIRMED: 0,
        COMPLETED: 0,
        CANCELLED: 0,
        NO_SHOW: 0,
        EXPIRED: 0,
      } as Record<string, number>
    );

    return NextResponse.json({
      asClient: clientStats,
      asInspector: inspectorStats,
    });
  } catch (error) {
    console.error("Error obteniendo stats de reservas:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
