//api/register/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { registerUser } from "@/services/auth/auth.server";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
    // Rate limit: 5 registros por IP cada 15 minutos
    const blocked = rateLimitResponse(req, "register", 5, 15 * 60 * 1000);
    if (blocked) return blocked;

    const body = await req.json();

    // Validar input básico
    if (!body.fullName || typeof body.fullName !== "string" || body.fullName.trim().length < 2) {
        return NextResponse.json({ message: "Nombre inválido" }, { status: 400 });
    }
    if (!body.email || typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        return NextResponse.json({ message: "Email inválido" }, { status: 400 });
    }
    if (!body.password || typeof body.password !== "string" || body.password.length < 8) {
        return NextResponse.json({ message: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }

    try {
        await registerUser(body);
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