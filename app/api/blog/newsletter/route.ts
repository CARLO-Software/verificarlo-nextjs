import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getResendClient, EMAIL_FROM } from "@/lib/email/resend";
import { getWelcomeNewsletterHtml } from "@/lib/email/templates/WelcomeNewsletter";

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

    const normalizedEmail = email.toLowerCase();

    // Check if already subscribed
    const existingSubscriber = await db.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingSubscriber) {
      return NextResponse.json(
        { message: "Ya estás suscrito a nuestro newsletter" },
        { status: 200 }
      );
    }

    await db.newsletterSubscriber.create({
      data: {
        email: normalizedEmail,
      },
    });

    // Send welcome email
    const resend = getResendClient();
    await resend.emails.send({
      from: EMAIL_FROM,
      to: normalizedEmail,
      subject: "¡Bienvenido al newsletter de Verificarlo!",
      html: getWelcomeNewsletterHtml(normalizedEmail),
    });

    return NextResponse.json(
      { message: "Te has suscrito exitosamente. Revisa tu correo." },
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
