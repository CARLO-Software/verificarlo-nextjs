import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/blog/newsletter - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "El email es requerido" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const existingSubscriber = await db.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingSubscriber) {
      return NextResponse.json(
        { message: "Ya estás suscrito a nuestro newsletter" },
        { status: 200 }
      );
    }

    await db.newsletterSubscriber.create({
      data: {
        email: email.toLowerCase(),
      },
    });

    return NextResponse.json(
      { message: "Te has suscrito exitosamente" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    return NextResponse.json(
      { error: "Error al suscribirse" },
      { status: 500 }
    );
  }
}
