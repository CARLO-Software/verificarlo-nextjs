import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { generateSecurePassword } from "@/lib/password";

// Middleware para verificar rol de admin
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// GET - Listar usuarios
// ============================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const authCheck = await verifyAdmin(session);

  if ("error" in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const usuarios = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        isInspectorAvailable: true,
        address: true,
        district: true,
      },
    });
    return NextResponse.json(usuarios);
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Crear usuario
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
  const { name, email, phone, role } = body;

  if (!name || !email || !role) {
    return NextResponse.json(
      { error: "Nombre, email y rol son obligatorios" },
      { status: 400 }
    );
  }

  if (!["CLIENT", "INSPECTOR", "ADMIN"].includes(role)) {
    return NextResponse.json(
      { error: "Rol inválido. Solo CLIENT, INSPECTOR o ADMIN" },
      { status: 400 }
    );
  }

  try {
    const existing = await db.user.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email" },
        { status: 409 }
      );
    }

    // Generar contraseña segura automáticamente
    const generatedPassword = generateSecurePassword(16);

    const bcrypt = (await import("bcryptjs")).default;
    const hashedPassword = await bcrypt.hash(generatedPassword, 12);

    const newUser = await db.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role,
        isInspectorAvailable: role === "INSPECTOR",
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = newUser;

    // Devolver usuario + contraseña generada (solo en la creación)
    return NextResponse.json(
      {
        ...userWithoutPassword,
        temporaryPassword: generatedPassword
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando usuario:", error);
    return NextResponse.json(
      { error: "Error al crear el usuario" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Cambiar rol, suspender, reactivar
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
  const { userId, action, newRole } = body;

  if (!userId || !action) {
    return NextResponse.json(
      { error: "Se requiere userId y action" },
      { status: 400 }
    );
  }

  try {
    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // No permitir cambiar el propio usuario
    if (userId === session!.user.id) {
      return NextResponse.json(
        { error: "No puede modificar su propia cuenta" },
        { status: 400 }
      );
    }

    // --- Cambiar rol ---
    // Permitido para todos, incluyendo admins (para corregir errores)
    if (action === "changeRole") {
      if (!newRole || !["CLIENT", "INSPECTOR", "ADMIN"].includes(newRole)) {
        return NextResponse.json(
          { error: "Rol inválido. Solo CLIENT, INSPECTOR o ADMIN" },
          { status: 400 }
        );
      }

      const updateData: { role: Role; isInspectorAvailable?: boolean } = { role: newRole as Role };
      if (newRole === "INSPECTOR") {
        updateData.isInspectorAvailable = true;
      }

      await db.user.update({
        where: { id: userId },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: `Rol actualizado a ${newRole}`,
      });
    }

    // Para las siguientes acciones, no permitir actuar sobre usuarios ADMIN
    if (user.role === "ADMIN" && ["suspend", "reactivate", "resetPassword"].includes(action)) {
      return NextResponse.json(
        { error: "No se puede suspender, reactivar o resetear contraseña de un administrador. Solo puede cambiar su rol." },
        { status: 400 }
      );
    }

    // --- Suspender ---
    if (action === "suspend") {
      await db.user.update({
        where: { id: userId },
        data: { status: "SUSPENDED" },
      });

      return NextResponse.json({
        success: true,
        message: "Usuario suspendido",
      });
    }

    // --- Reactivar ---
    if (action === "reactivate") {
      await db.user.update({
        where: { id: userId },
        data: { status: "ACTIVE" },
      });

      return NextResponse.json({
        success: true,
        message: "Usuario reactivado",
      });
    }

    // --- Resetear contraseña ---
    if (action === "resetPassword") {
      // Verificar si el usuario usa Google (no tiene contraseña)
      if (!user.password) {
        return NextResponse.json(
          { error: "Este usuario inicia sesión con Google. No se puede resetear la contraseña." },
          { status: 400 }
        );
      }

      // Generar nueva contraseña segura
      const newPassword = generateSecurePassword(16);

      const bcrypt = (await import("bcryptjs")).default;
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await db.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return NextResponse.json({
        success: true,
        message: "Contraseña reseteada",
        temporaryPassword: newPassword,
        userName: user.name,
        userEmail: user.email,
      });
    }

    return NextResponse.json(
      { error: "Acción no válida. Use 'changeRole', 'suspend', 'reactivate' o 'resetPassword'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error en operación de usuario:", error);
    return NextResponse.json(
      { error: "Error en la operación" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Eliminar usuario
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
  const { userId } = body;

  if (!userId) {
    return NextResponse.json(
      { error: "Se requiere userId" },
      { status: 400 }
    );
  }

  try {
    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // No permitir eliminar ADMIN
    if (user.role === "ADMIN") {
      return NextResponse.json(
        { error: "No se puede eliminar a un administrador" },
        { status: 400 }
      );
    }

    // No permitir eliminarse a sí mismo
    if (userId === session!.user.id) {
      return NextResponse.json(
        { error: "No puede eliminar su propia cuenta" },
        { status: 400 }
      );
    }

    // Eliminar usuario (cascade elimina reservas automáticamente)
    await db.user.delete({ where: { id: userId } });

    return NextResponse.json({
      success: true,
      message: `Usuario ${user.name} eliminado`,
    });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    return NextResponse.json(
      { error: "Error al eliminar el usuario" },
      { status: 500 }
    );
  }
}
