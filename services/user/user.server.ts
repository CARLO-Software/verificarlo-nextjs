import { db } from "@/lib/db";

//* OBTENER POR ___
export async function obtenerPorId(id: string) {
    return await db.user.findUnique({
        where: { id: id }
    });
}

//Obtener rol por correo electronico
export async function obtenerRolPorCorreo(correo: string) {
    return await db.user.findUnique({
        where: { email: correo }
    });
}

//* OBTENER TODO
export async function obtenerTodosLosClientes() {
    return await db.user.findMany({
        where: { role: "CLIENT" }
    });
}
export async function obtenerTodosLosInspectores() {
    return await db.user.findMany({
        where: { role: "INSPECTOR" }
    });
}
export async function obtenerTodosLosAdministradores() {
    return await db.user.findMany({
        where: { role: "ADMIN" }
    });
}
