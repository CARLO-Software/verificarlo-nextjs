/**
 * API: GET /api/admin/legal-reviews/count
 * Obtiene el conteo de informes legales pendientes de revisión
 * Usado para el badge en el sidebar del admin
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPendingCount } from "@/services/legalReport/legalReport.server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const count = await getPendingCount();

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error al obtener conteo de informes legales:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
