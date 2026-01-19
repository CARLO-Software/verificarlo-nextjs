// services/auth.service.ts
import { LoginFormData } from "@/app/(auth)/login/types";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";
export async function loginUser(payload: LoginFormData) {
    const user = await db.user.findUnique({
        where: { email: payload.email }
    });

    if (!user) {
        return null;
    }

    //Validar password

    return user;
}

export async function register(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return db.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });
}