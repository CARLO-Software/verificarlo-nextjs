// ============================================
// /api/admin/inspectors
// Gestión de inspectores
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  reassignInspectorBookings,
  getInspectorsWorkload,
} from "@/lib/scheduling/inspector-assignment";
import { startOfDay, parse, format } from "date-fns";

// Middleware para verificar rol de admin
async function verifyAdmin(session: any) {
  if (!session?.user?.id) {
    return { error: "Debe iniciar sesión", status: 401 };
  }

  const user = await db.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return { error: "Acceso denegado. Solo para administradores.", status: 403 };
  }

  return { success: true };
}

// ============================================
// GET - Listar inspectores
// ============================================

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const authCheck = await verifyAdmin(session);

  if ("error" in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  const searchParams = req.nextUrl.searchParams;
  const includeWorkload = searchParams.get("workload") === "true";
  const date = searchParams.get("date"); // YYYY-MM-DD

  try {
    const inspectors = await db.user.findMany({
      where: { role: "INSPECTOR" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    // Si se solicita carga de trabajo
    if (includeWorkload && date) {
      const parsedDate = parse(date, "yyyy-MM-dd", new Date());
      const workload = await getInspectorsWorkload(parsedDate);

      const inspectorsWithWorkload = inspectors.map((inspector) => {
        const workloadData = workload.find((w) => w.id === inspector.id);
        return {
          ...inspector,
          workload: workloadData
            ? {
                totalBookings: workloadData.totalBookings,
                slots: workloadData.slots,
              }
            : { totalBookings: 0, slots: [] },
        };
      });

      return NextResponse.json(inspectorsWithWorkload);
    }

    return NextResponse.json(inspectors);
  } catch (error) {
    console.error("Error obteniendo inspectores:", error);
    return NextResponse.json(
      { error: "Error al obtener inspectores" },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Promover usuario a inspector
// ============================================

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const authCheck = await verifyAdmin(session);

  if ("error" in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  const body = await req.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json(
      { error: "Se requiere userId" },
      { status: 400 }
    );
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (user.role === "INSPECTOR") {
      return NextResponse.json(
        { error: "El usuario ya es inspector" },
        { status: 400 }
      );
    }

    if (user.role === "ADMIN") {
      return NextResponse.json(
        { error: "No se puede cambiar el rol de un administrador" },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id: userId },
      data: { role: "INSPECTOR", isActive: true },
    });

    return NextResponse.json({
      success: true,
      message: `${user.name} ahora es inspector`,
    });
  } catch (error) {
    console.error("Error promoviendo usuario:", error);
    return NextResponse.json(
      { error: "Error al promover usuario" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Activar/desactivar inspector o reasignar citas
// ============================================

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const authCheck = await verifyAdmin(session);

  if ("error" in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  const body = await req.json();
  const { inspectorId, action, date, reason } = body;

  if (!inspectorId || !action) {
    return NextResponse.json(
      { error: "Se requiere inspectorId y action" },
      { status: 400 }
    );
  }

  try {
    const inspector = await db.user.findFirst({
      where: { id: inspectorId, role: "INSPECTOR" },
    });

    if (!inspector) {
      return NextResponse.json(
        { error: "Inspector no encontrado" },
        { status: 404 }
      );
    }

    // Activar/desactivar
    if (action === "activate" || action === "deactivate") {
      const isActive = action === "activate";

      await db.user.update({
        where: { id: inspectorId },
        data: { isActive },
      });

      return NextResponse.json({
        success: true,
        message: `Inspector ${isActive ? "activado" : "desactivado"} exitosamente`,
      });
    }

    // Reasignar citas de un día específico
    if (action === "reassign") {
      if (!date) {
        return NextResponse.json(
          { error: "Se requiere fecha para reasignar" },
          { status: 400 }
        );
      }

      const parsedDate = parse(date, "yyyy-MM-dd", new Date());
      const result = await reassignInspectorBookings(
        inspectorId,
        parsedDate,
        reason || "Reasignación administrativa"
      );

      return NextResponse.json({
        success: result.success,
        message: result.success
          ? "Citas reasignadas exitosamente"
          : "Algunas citas no pudieron ser reasignadas",
        details: result,
      });
    }

    return NextResponse.json(
      { error: "Acción no válida. Use 'activate', 'deactivate' o 'reassign'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error en operación de inspector:", error);
    return NextResponse.json(
      { error: "Error en la operación" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Degradar inspector a cliente
// ============================================

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const authCheck = await verifyAdmin(session);

  if ("error" in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  const body = await req.json();
  const { inspectorId } = body;

  if (!inspectorId) {
    return NextResponse.json(
      { error: "Se requiere inspectorId" },
      { status: 400 }
    );
  }

  try {
    const inspector = await db.user.findFirst({
      where: { id: inspectorId, role: "INSPECTOR" },
    });

    if (!inspector) {
      return NextResponse.json(
        { error: "Inspector no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si tiene citas pendientes
    const pendingBookings = await db.booking.count({
      where: {
        inspectorId,
        status: "CONFIRMED",
      },
    });

    if (pendingBookings > 0) {
      return NextResponse.json(
        {
          error: `El inspector tiene ${pendingBookings} cita(s) confirmada(s). Reasígnelas antes de degradar.`,
        },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id: inspectorId },
      data: { role: "CLIENT" },
    });

    return NextResponse.json({
      success: true,
      message: `${inspector.name} ya no es inspector`,
    });
  } catch (error) {
    console.error("Error degradando inspector:", error);
    return NextResponse.json(
      { error: "Error al degradar inspector" },
      { status: 500 }
    );
  }
}
