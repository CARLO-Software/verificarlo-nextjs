import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { InspectorDashboardClient } from "./InspectorDashboardClient";

// Función para generar código de inspección
function generateInspectionCode(id: number, createdAt: Date): string {
  const year = createdAt.getFullYear();
  const paddedId = String(id).padStart(4, "0");
  return `#INS-${year}-${paddedId}`;
}

export default async function InspectorPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Solo inspectores y admins pueden acceder
  if (session.user.role !== "INSPECTOR" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  const userId = session.user.id;

  // Obtener inspecciones asignadas al inspector
  const bookings = await db.booking.findMany({
    where: {
      inspectorId: userId,
      status: {
        in: ["CONFIRMED", "COMPLETED"],
      },
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      vehicle: {
        include: {
          model: {
            include: { brand: true },
          },
        },
      },
      inspectionPlan: {
        select: {
          id: true,
          type: true,
          title: true,
        },
      },
      report: {
        select: {
          id: true,
          overallStatus: true,
          completedAt: true,
        },
      },
    },
    orderBy: [
      { status: "asc" }, // CONFIRMED primero
      { startTime: "asc" },
    ],
  });

  // Formatear datos para el cliente
  const inspections = bookings.map((booking) => ({
    id: booking.id,
    code: generateInspectionCode(booking.id, booking.createdAt),
    status: booking.status,
    date: booking.date.toISOString(),
    timeSlot: booking.timeSlot,
    startTime: booking.startTime.toISOString(),
    client: {
      id: booking.client.id,
      name: booking.client.name,
      phone: booking.client.phone,
      email: booking.client.email,
    },
    vehicle: {
      brand: booking.vehicle.model.brand.name,
      model: booking.vehicle.model.name,
      year: booking.vehicle.year,
      plate: booking.vehicle.plate,
    },
    inspectionPlan: {
      id: booking.inspectionPlan.id,
      type: booking.inspectionPlan.type,
      title: booking.inspectionPlan.title,
    },
    report: booking.report
      ? {
          id: booking.report.id,
          status: booking.report.overallStatus,
          completedAt: booking.report.completedAt?.toISOString() || null,
        }
      : null,
  }));

  // Separar pendientes y completadas
  const pendingInspections = inspections.filter((i) => i.status === "CONFIRMED");
  const completedInspections = inspections.filter((i) => i.status === "COMPLETED");

  return (
    <InspectorDashboardClient
      pendingInspections={pendingInspections}
      completedInspections={completedInspections}
      inspectorName={session.user.name || "Inspector"}
      inspectorImage={session.user.image}
    />
  );
}
