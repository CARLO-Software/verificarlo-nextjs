// services/auth.service.ts
import { LoginFormData, RegisterFormData } from "@/app/(auth)/login/types";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
export async function loginUser(payload: LoginFormData) {
    const user = await db.user.findUnique({
        where: { email: payload.email }
    });

    if (!user || !user.password) {
        return null;
    }

    // Comparar password
    const isPasswordValid = await bcrypt.compare(payload.password, user.password);

    if(!isPasswordValid) {
        return null; //credenciales inválidas
    }

    //No devolver password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

export async function registerUser(payload: RegisterFormData) {
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  return db.user.create({
    data: {
      name: payload.fullName,
      email: payload.email,
      password: hashedPassword,
    },
  });
}