import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { validatePasswordStrength } from "@/lib/password";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debe iniciar sesión" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { currentPassword, newPassword, confirmPassword } = body;

  // Validar campos requeridos
  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { error: "Todos los campos son obligatorios" },
      { status: 400 }
    );
  }

  // Validar que las contraseñas coincidan
  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "Las contraseñas no coinciden" },
      { status: 400 }
    );
  }

  // Validar fortaleza de la nueva contraseña
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    return NextResponse.json(
      { error: passwordValidation.errors[0] },
      { status: 400 }
    );
  }

  try {
    // Obtener usuario con su contraseña actual
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Si el usuario no tiene contraseña (se registró con Google), no puede cambiarla
    if (!user.password) {
      return NextResponse.json(
        { error: "Tu cuenta usa inicio de sesión con Google. No puedes cambiar la contraseña aquí." },
        { status: 400 }
      );
    }

    const bcrypt = (await import("bcryptjs")).default;

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "La contraseña actual es incorrecta" },
        { status: 400 }
      );
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { error: "La nueva contraseña debe ser diferente a la actual" },
        { status: 400 }
      );
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    return NextResponse.json(
      { error: "Error al cambiar la contraseña" },
      { status: 500 }
    );
  }
}
