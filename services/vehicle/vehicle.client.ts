import { AgendarVehiculo } from "@/app/vehiculo/types";

export async function agendarVehiculo(payload: AgendarVehiculo) {
    //Llamar a la API de autenticación, siendo Next.js el backend
    const res = await fetch("/api/vehicles/agendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new Error("Agendamiento fallido");
    }
    
    return res.json();
}