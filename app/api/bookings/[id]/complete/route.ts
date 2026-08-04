// ============================================
// POST /api/bookings/[id]/complete
// El inspector marca la inspección como completada
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma, InspectionResultStatus, MechanicalVerdict } from "@prisma/client";
import {
  calculateScoreByCategory,
  calculateOverallScore,
  type InspectionResults,
} from "@/app/(dashboard)/inspector/[id]/inspectionData";

const VALID_VERDICTS = ["APROBADO", "OBSERVADO", "NO_APROBADO"] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesión" },
      { status: 401 }
    );
  }

  const bookingId = parseInt(params.id);

  if (isNaN(bookingId)) {
    return NextResponse.json(
      { error: "ID de reserva inválido" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const {
      overallStatus,
      executiveSummary,
      estimatedCost,
      realMileage,
      hasSiniestro,
      hasKmAdulterado,
      checklistResults,
    } = body;

    // Validar campos requeridos
    if (!overallStatus || !VALID_VERDICTS.includes(overallStatus)) {
      return NextResponse.json(
        { error: "overallStatus debe ser APROBADO, OBSERVADO o NO_APROBADO" },
        { status: 400 }
      );
    }

    if (!executiveSummary || typeof executiveSummary !== "string") {
      return NextResponse.json(
        { error: "executiveSummary es requerido" },
        { status: 400 }
      );
    }

    if (!checklistResults) {
      return NextResponse.json(
        { error: "checklistResults es requerido" },
        { status: 400 }
      );
    }

    // Parsear checklist
    const parsedChecklist: InspectionResults =
      typeof checklistResults === "string"
        ? JSON.parse(checklistResults)
        : checklistResults;

    // Buscar booking
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { report: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // Solo el inspector asignado o admin puede completar
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isAssignedInspector = booking.inspectorId === session.user.id;
    const isAdmin = user?.role === "ADMIN";

    if (!isAssignedInspector && !isAdmin) {
      return NextResponse.json(
        { error: "Solo el inspector asignado o un admin puede completar la inspección" },
        { status: 403 }
      );
    }

    // Verificar que esté en estado PAID
    if (booking.status !== "PAID") {
      return NextResponse.json(
        { error: "La reserva debe estar en estado PAID para completarla" },
        { status: 400 }
      );
    }

    // Calcular scores por categoría
    const scoreByCategory = calculateScoreByCategory(parsedChecklist);
    const { score: overallScore, status: calculatedStatus } =
      calculateOverallScore(parsedChecklist);

    // Mapear status calculado a InspectionResultStatus del schema
    const statusMap: Record<string, InspectionResultStatus> = {
      OK: "OK",
      WARNING: "WARNING",
      CRITICAL: "CRITICAL",
      PENDING: "PENDING",
    };

    const now = new Date();

    await db.$transaction(async (tx) => {
      // Crear o actualizar InspectionReport
      const reportData = {
        checklistResults: parsedChecklist as unknown as Prisma.InputJsonValue,
        overallScore,
        overallStatus: statusMap[calculatedStatus],
        mechanicalVerdict: overallStatus as MechanicalVerdict,
        executiveSummary,
        estimatedRepairCost: estimatedCost != null ? estimatedCost : null,
        mileageAtInspection: realMileage != null ? realMileage : null,
        hasSiniestro: hasSiniestro ?? false,
        hasKilometrajeAdulterado: hasKmAdulterado ?? false,
        // Scores por categoría
        legalScore: scoreByCategory.legal?.score ?? null,
        legalStatus: statusMap[scoreByCategory.legal?.status ?? "PENDING"],
        mechanicalScore: scoreByCategory.mecanica?.score ?? null,
        mechanicalStatus: statusMap[scoreByCategory.mecanica?.status ?? "PENDING"],
        bodyScore: scoreByCategory.carroceria?.score ?? null,
        bodyStatus: statusMap[scoreByCategory.carroceria?.status ?? "PENDING"],
        completedAt: now,
      };

      if (booking.report) {
        await tx.inspectionReport.update({
          where: { id: booking.report.id },
          data: reportData,
        });
      } else {
        await tx.inspectionReport.create({
          data: {
            bookingId,
            ...reportData,
          },
        });
      }

      // Marcar booking como completado
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "COMPLETED",
          completedAt: now,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completando inspección:", error);
    return NextResponse.json(
      { error: "Error al completar la inspección" },
      { status: 500 }
    );
  }
}
