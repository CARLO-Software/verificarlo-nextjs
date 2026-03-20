// services/auth.service.ts
import { LoginFormData, RegisterFormData } from "@/app/(auth)/login/types";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { sendVerificationCodeEmail } from "@/lib/email/sendVerificationCode";

export async function loginUser(payload: LoginFormData) {
  const user = await db.user.findUnique({
    where: { email: payload.email }
  });

  if (!user || !user.password) {
    return null;
  }
  
  // Comparar password
  const isPasswordValid = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordValid) {
    return null; //credenciales inválidas
  }

  //No devolver password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function registerUser(payload: RegisterFormData) {
  //Verificar si el email ya existe
  const existingUser = await db.user.findUnique({
    where: { email: payload.email },
    include: { accounts: true }
  });

  if (existingUser) {
    //Verificar si se registró con Google
    const googleAccount = existingUser.accounts.find(
      (account) => account.provider === "google"
    )
    if (googleAccount) {
      throw new Error("GOOGLE_ACCOUNT_EXISTS");
    }
    //Si tiene contraseña, es un registro normal
    if (existingUser.password) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  await db.user.create({
    data: {
      name: payload.fullName,
      email: payload.email,
      password: hashedPassword,
    },
  });

  // Generar y enviar código OTP de verificación
  await generateAndSendOTP(payload.email, payload.fullName);
}

// ============================================
// OTP — Generar, almacenar y enviar código
// ============================================

export async function generateAndSendOTP(email: string, name: string) {
  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
  const hashedCode = await bcrypt.hash(code, 10);
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  // Eliminar tokens anteriores para este email
  await db.verificationToken.deleteMany({ where: { identifier: email } });

  await db.verificationToken.create({
    data: { identifier: email, token: hashedCode, expires },
  });

  await sendVerificationCodeEmail({ to: email, clientName: name, code });
}

// ============================================
// OTP — Verificar código
// ============================================

export async function verifyEmailCode(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const record = await db.verificationToken.findFirst({
    where: { identifier: email },
  });

  if (!record) {
    return { success: false, error: "Código no encontrado. Solicita uno nuevo." };
  }

  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { identifier_token: { identifier: email, token: record.token } } });
    return { success: false, error: "El código ha expirado. Solicita uno nuevo." };
  }

  const isValid = await bcrypt.compare(code, record.token);
  if (!isValid) {
    return { success: false, error: "Código incorrecto. Verifica e intenta de nuevo." };
  }

  // Marcar email como verificado y limpiar token
  await db.$transaction([
    db.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
    db.verificationToken.delete({
      where: { identifier_token: { identifier: email, token: record.token } },
    }),
  ]);

  return { success: true };
}