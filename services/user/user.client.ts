import { User } from "@prisma/client";

export async function obtenerRolPorCorreo(correo: string): Promise<User> {
    const res = await fetch("/api/user?email=" + correo);

    if (!res.ok) {
        throw new Error("Error al obtener marcas");
    }

    return res.json();
}