// services/auth.client.ts
import { LoginFormData, RegisterFormData } from "@/app/(auth)/login/types";

export async function login(payload: LoginFormData) {
    //Llamar a la API de autenticación, siendo Next.js el backend
    const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new Error("Login failed");
    }

    return res.json();
}
export async function register(payload: RegisterFormData) {
    const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Error al registrar");
    }

    return data;
}