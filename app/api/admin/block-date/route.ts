// ============================================
// /api/admin/block-date
// Gestión de fechas bloqueadas
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfDay, parse, format } from "date-fns";

// Middleware para verificar rol de admin
async function verifyAdmin(session: any) {
  if (!session?.user?.id) {
    return { error: "Debe iniciar sesión", status: 401 };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return { error: "Acceso denegado. Solo para administradores.", status: 403 };
  }

  return { success: true };
}

// ============================================
// GET - Listar fechas bloqueadas
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
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  try {
    let whereClause = {};

    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      whereClause = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    const blockedDates = await db.blockedDate.findMany({
      where: whereClause,
      include: {
        admin: {
          select: { name: true },
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(
      blockedDates.map((bd) => ({
        id: bd.id,
        date: format(bd.date, "yyyy-MM-dd"),
        reason: bd.reason,
        createdBy: bd.admin.name,
        createdAt: bd.createdAt,
      }))
    );
  } catch (error) {
    console.error("Error obteniendo fechas bloqueadas:", error);
    return NextResponse.json(
      { error: "Error al obtener fechas bloqueadas" },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Bloquear fecha
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
  const { date, reason } = body;

  if (!date) {
    return NextResponse.json(
      { error: "Se requiere la fecha (formato YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  try {
    const parsedDate = parse(date, "yyyy-MM-dd", new Date());

    // Verificar si ya existe
    const existing = await db.blockedDate.findUnique({
      where: { date: startOfDay(parsedDate) },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Esta fecha ya está bloqueada" },
        { status: 409 }
      );
    }

    // Verificar si hay citas para esa fecha
    const bookingsOnDate = await db.booking.count({
      where: {
        date: startOfDay(parsedDate),
        status: { in: ["CONFIRMED", "PAID"] },
      },
    });

    const blockedDate = await db.blockedDate.create({
      data: {
        date: startOfDay(parsedDate),
        reason: reason || null,
        createdBy: parseInt(session!.user!.id),
      },
    });

    return NextResponse.json({
      success: true,
      blockedDate: {
        id: blockedDate.id,
        date: format(blockedDate.date, "yyyy-MM-dd"),
        reason: blockedDate.reason,
      },
      warning:
        bookingsOnDate > 0
          ? `Hay ${bookingsOnDate} cita(s) confirmada(s) para esta fecha que deberán ser reprogramadas.`
          : null,
    });
  } catch (error) {
    console.error("Error bloqueando fecha:", error);
    return NextResponse.json(
      { error: "Error al bloquear la fecha" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Desbloquear fecha
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
  const { date, id } = body;

  try {
    if (id) {
      // Eliminar por ID
      await db.blockedDate.delete({
        where: { id },
      });
    } else if (date) {
      // Eliminar por fecha
      const parsedDate = parse(date, "yyyy-MM-dd", new Date());
      await db.blockedDate.delete({
        where: { date: startOfDay(parsedDate) },
      });
    } else {
      return NextResponse.json(
        { error: "Se requiere 'id' o 'date'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Fecha desbloqueada exitosamente",
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Fecha no encontrada" },
        { status: 404 }
      );
    }

    console.error("Error desbloqueando fecha:", error);
    return NextResponse.json(
      { error: "Error al desbloquear la fecha" },
      { status: 500 }
    );
  }
}
