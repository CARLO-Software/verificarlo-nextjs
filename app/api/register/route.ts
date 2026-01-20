//api/register/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { registerUser } from "@/services/auth/auth.server";

export async function POST(req: Request) {
    const body = await req.json();
    console.log("Register API called with body:", body);
    console.log("Runtime:", process.env.NEXT_RUNTIME);

    // Call the login service
    const result = await registerUser(body);

    if (!result) {
        return NextResponse.json({ message: "Registration failed" }, { status: 401 });
    }

    // Process login logic here
    return NextResponse.json({ message: "Registration successful" });
}