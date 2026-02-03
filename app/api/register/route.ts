//api/register/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { registerUser } from "@/services/auth/auth.server";

export async function POST(req: Request) {
    const body = await req.json(); //fullName: "nombre ingresado", email: "email@gmail.com", password: "clave"

    try {
        // Call the login service
        const result = await registerUser(body);

        if (!result) {
            return NextResponse.json({ message: "Registration failed" }, { status: 401 });
        }

        // Process login logic here
        return NextResponse.json({ message: "Registration successful" });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "GOOGLE_ACCOUNT_EXISTS") {
                return NextResponse.json(
                    {
                        message: "Este correo ya está registrado con Google. Por favor, inicia sesión con Google.",
                        code: "GOOGLE_ACCOUNT_EXISTS"
                    },
                    { status: 409 }
                )
            }
            if (error.message === "EMAIL_ALREADY_EXISTS") {
                return NextResponse.json(
                    {
                        message: "Este correo electrónico ya está registrado. Por favor, inicia sesión o usa otro",
                        code: "EMAIL_ALREADY_EXISTS"
                    },
                    { status: 409 }
                )
            }

        }
        return NextResponse.json(
            { message: "Error al crear la cuenta. Por favor, intenta nuevamente." },
            { status: 500 }
        )
    }
}