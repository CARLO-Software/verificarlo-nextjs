//api/register/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { agendarVehiculo } from "@/services/vehicle/vehicle.server";

export async function POST(req: Request) {
    const body = await req.json();

    // Call the login service
    const result = await agendarVehiculo(body);

    if (!result) {
        return NextResponse.json({ message: "Agendamiento fallido" }, { status: 401 });
    }

    // Process login logic here
    return NextResponse.json({ message: "Agendamiento con exito" });
}