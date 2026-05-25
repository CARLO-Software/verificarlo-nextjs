import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminReportClient } from "./AdminReportClient";

function generateInspectionCode(id: number, createdAt: Date): string {
  const year = createdAt.getFullYear();
  const paddedId = String(id).padStart(4, "0");
  return `#INS-${year}-${paddedId}`;
}

interface PageProps {
  params: { id: string };
}

export default async function AdminInspectionDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const bookingId = parseInt(params.id);

  if (isNaN(bookingId)) {
    redirect("/admin/inspecciones");
  }

  // Obtener la inspección con todos los detalles
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      inspector: {
        select: {
          id: true,
          name: true,
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
          price: true,
        },
      },
      report: {
        include: {
          photos: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!booking) {
    redirect("/admin/inspecciones");
  }

  // Buscar VehicleInspection asociada
  const vehicleInspection = await db.vehicleInspection.findFirst({
    where: {
      vehicleId: booking.vehicleId,
      clientId: booking.clientId,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      plate: true,
      legalStatus: true,
      mechanicalStatus: true,
      mechanicCompletedAt: true,
      legalCompletedAt: true,
    },
  });

  // Formatear datos para el cliente
  const inspectionData = {
    id: booking.id,
    code: generateInspectionCode(booking.id, booking.createdAt),
    status: booking.status,
    date: booking.date.toISOString(),
    timeSlot: booking.timeSlot,
    createdAt: booking.createdAt.toISOString(),
    client: {
      id: booking.client.id,
      name: booking.client.name,
      phone: booking.client.phone,
      email: booking.client.email,
    },
    inspector: booking.inspector
      ? {
          id: booking.inspector.id,
          name: booking.inspector.name,
          email: booking.inspector.email,
        }
      : null,
    vehicle: {
      brand: booking.vehicle.model.brand.name,
      model: booking.vehicle.model.name,
      year: booking.vehicle.year,
      plate: booking.vehicle.plate,
      mileage: booking.vehicle.mileage,
    },
    inspectionPlan: {
      id: booking.inspectionPlan.id,
      type: booking.inspectionPlan.type,
      title: booking.inspectionPlan.title,
      price: Number(booking.inspectionPlan.price),
    },
    adminNotes: booking.adminNotes,
    inspectorNotes: booking.inspectorNotes,
    report: booking.report
      ? {
          id: booking.report.id,
          checklistResults: booking.report.checklistResults as Record<string, { status: string; comment?: string }> | null,
          mileageAtInspection: booking.report.mileageAtInspection,
          overallScore: booking.report.overallScore,
          overallStatus: booking.report.overallStatus,
          mechanicalVerdict: booking.report.mechanicalVerdict,
          hasSiniestro: booking.report.hasSiniestro,
          hasKilometrajeAdulterado: booking.report.hasKilometrajeAdulterado,
          executiveSummary: booking.report.executiveSummary,
          estimatedRepairCost: booking.report.estimatedRepairCost
            ? Number(booking.report.estimatedRepairCost)
            : null,
          completedAt: booking.report.completedAt?.toISOString() || null,
          photos: booking.report.photos.map((photo) => ({
            id: photo.id,
            url: photo.url,
            thumbnailUrl: photo.thumbnailUrl,
            category: photo.category,
            label: photo.label,
            checklistItemId: photo.checklistItemId,
          })),
        }
      : null,
    vehicleInspection: vehicleInspection
      ? {
          id: vehicleInspection.id,
          plate: vehicleInspection.plate,
          legalStatus: vehicleInspection.legalStatus,
          mechanicalStatus: vehicleInspection.mechanicalStatus,
          mechanicCompletedAt: vehicleInspection.mechanicCompletedAt?.toISOString() || null,
          legalCompletedAt: vehicleInspection.legalCompletedAt?.toISOString() || null,
        }
      : null,
  };

  return <AdminReportClient inspection={inspectionData} />;
}
