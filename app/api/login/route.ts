//api/login/route.ts
import { NextResponse } from "next/server";
import { loginUser } from "@/services/auth/auth.server";

export async function POST(req: Request) {
    const body = await req.json();

    // Call the login service
    const result = await loginUser(body);
    
    if (!result) {
        return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    // Process login logic here
    return NextResponse.json({ message: "Login successful" });
}