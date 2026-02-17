import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInspectionById } from "@/services/inspections/inspections.server";
import { InspeccionDetalleClient } from "./InspeccionDetalleClient";

interface PageProps {
  params: { id: string };
}

export default async function InspeccionDetallePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const bookingId = parseInt(params.id);

  if (isNaN(bookingId)) {
    redirect("/mis-inspecciones");
  }

  try {
    const booking = await getInspectionById(bookingId);

    if (!booking) {
      redirect("/mis-inspecciones");
    }

    // Formatear datos para el cliente
    const inspectionData = {
      id: booking.id,
      code: booking.code,
      status: booking.status,
      date: booking.date.toISOString(),
      timeSlot: booking.timeSlot,
      expiresAt: booking.expiresAt?.toISOString() || null,
      createdAt: booking.createdAt.toISOString(),
      clientNotes: booking.clientNotes,
      inspectorNotes: booking.inspectorNotes,
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
        price: booking.inspectionPlan.price,
      },
      inspector: booking.inspector
        ? {
            id: booking.inspector.id,
            name: booking.inspector.name,
          }
        : null,
      payment: booking.payment
        ? {
            id: booking.payment.id,
            status: booking.payment.status,
            amount: booking.payment.amount,
            paidAt: booking.payment.paidAt?.toISOString() || null,
            receiptNumber: booking.payment.receiptNumber,
          }
        : null,
      report: booking.report
        ? {
            id: booking.report.id,
            legalStatus: booking.report.legalStatus,
            legalScore: booking.report.legalScore,
            mechanicalStatus: booking.report.mechanicalStatus,
            mechanicalScore: booking.report.mechanicalScore,
            bodyStatus: booking.report.bodyStatus,
            bodyScore: booking.report.bodyScore,
            overallScore: booking.report.overallScore,
            overallStatus: booking.report.overallStatus,
            executiveSummary: booking.report.executiveSummary,
            recommendations: booking.report.recommendations,
            completedAt: booking.report.completedAt?.toISOString() || null,
            // Usar la API de Next.js para servir el PDF (no Cloudinary)
            pdfUrl: null,
          }
        : null,
    };

    return <InspeccionDetalleClient inspection={inspectionData} />;
  } catch (error) {
    console.error("Error obteniendo inspección:", error);
    redirect("/mis-inspecciones");
  }
}
