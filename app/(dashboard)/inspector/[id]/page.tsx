import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { InspectionFormClient } from "./InspectionFormClient";

// Función para generar código de inspección
function generateInspectionCode(id: number, createdAt: Date): string {
  const year = createdAt.getFullYear();
  const paddedId = String(id).padStart(4, "0");
  return `#INS-${year}-${paddedId}`;
}

interface PageProps {
  params: { id: string };
}

export default async function InspectionDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Solo inspectores y admins pueden acceder
  if (session.user.role !== "INSPECTOR" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  const bookingId = parseInt(params.id);

  if (isNaN(bookingId)) {
    redirect("/inspector");
  }

  const userId = session.user.id;

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
      vehicle: {
        include: {
          model: {
            include: { brand: true },
          },
        },
      },
      inspectionPlan: {
        include: {
          items: true,
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
    redirect("/inspector");
  }

  // Buscar VehicleInspection asociada (para el flujo dual legal/mecánico)
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
    },
  });

  // Verificar que el inspector esté asignado a esta inspección
  const isAssignedInspector = booking.inspectorId === userId;
  const isAdmin = session.user.role === "ADMIN";

  if (!isAssignedInspector && !isAdmin) {
    redirect("/inspector");
  }

  // Verificar que la inspección esté en estado correcto
  if (!["PAID", "COMPLETED"].includes(booking.status)) {
    redirect("/inspector");
  }

  // Formatear datos para el cliente
  const inspectionData = {
    id: booking.id,
    code: generateInspectionCode(booking.id, booking.createdAt),
    status: booking.status,
    date: booking.date.toISOString(),
    timeSlot: booking.timeSlot,
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
      mileage: booking.vehicle.mileage,
    },
    inspectionPlan: {
      id: booking.inspectionPlan.id,
      type: booking.inspectionPlan.type,
      title: booking.inspectionPlan.title,
      items: booking.inspectionPlan.items.map((item) => item.label),
      price: Number(booking.inspectionPlan.price),
    },
    report: booking.report
      ? {
          id: booking.report.id,
          legalStatus: booking.report.legalStatus,
          legalScore: booking.report.legalScore,
          legalObservations: booking.report.legalObservations,
          mechanicalStatus: booking.report.mechanicalStatus,
          mechanicalScore: booking.report.mechanicalScore,
          mechanicalObservations: booking.report.mechanicalObservations,
          bodyStatus: booking.report.bodyStatus,
          bodyScore: booking.report.bodyScore,
          bodyObservations: booking.report.bodyObservations,
          mileageAtInspection: booking.report.mileageAtInspection,
          ownershipCardVerified: booking.report.ownershipCardVerified,
          soatValid: booking.report.soatValid,
          soatExpiryDate: booking.report.soatExpiryDate?.toISOString() || null,
          technicalReviewValid: booking.report.technicalReviewValid,
          technicalReviewExpiryDate: booking.report.technicalReviewExpiryDate?.toISOString() || null,
          executiveSummary: booking.report.executiveSummary,
          estimatedRepairCost: booking.report.estimatedRepairCost ? Number(booking.report.estimatedRepairCost) : null,
          overallScore: booking.report.overallScore,
          overallStatus: booking.report.overallStatus,
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
    // Datos del flujo dual (VehicleInspection)
    vehicleInspection: vehicleInspection
      ? {
          id: vehicleInspection.id,
          plate: vehicleInspection.plate,
          legalStatus: vehicleInspection.legalStatus,
          mechanicalStatus: vehicleInspection.mechanicalStatus,
        }
      : null,
  };

  return <InspectionFormClient inspection={inspectionData} />;
}
