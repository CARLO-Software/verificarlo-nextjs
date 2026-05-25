import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getResendClient, EMAIL_FROM } from "@/lib/email/resend";
import { getBlogNewsletterHtml } from "@/lib/email/templates/BlogNewsletter";

// POST /api/admin/newsletter/send - Send newsletter to all subscribers
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { blogPostId } = body;

    if (!blogPostId) {
      return NextResponse.json(
        { error: "El ID del blog es requerido" },
        { status: 400 }
      );
    }

    // Get the blog post
    const blogPost = await db.blogPost.findUnique({
      where: { id: blogPostId },
    });

    if (!blogPost) {
      return NextResponse.json(
        { error: "Blog no encontrado" },
        { status: 404 }
      );
    }

    // Get all subscribers
    const subscribers = await db.newsletterSubscriber.findMany({
      select: { email: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: "No hay suscriptores" },
        { status: 400 }
      );
    }

    // Generate email HTML once (same for all subscribers)
    const emailHtml = getBlogNewsletterHtml({
      title: blogPost.title,
      excerpt: blogPost.excerpt,
      coverImage: blogPost.coverImage,
      slug: blogPost.slug,
      author: blogPost.author,
    });

    const resend = getResendClient();

    // Send emails in batches of 10 to avoid rate limits
    const batchSize = 10;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      const promises = batch.map(async (subscriber) => {
        try {
          await resend.emails.send({
            from: EMAIL_FROM,
            to: subscriber.email,
            subject: blogPost.title,
            html: emailHtml,
          });
          return true;
        } catch (error) {
          console.error(`Error sending to ${subscriber.email}:`, error);
          return false;
        }
      });

      const results = await Promise.all(promises);
      sent += results.filter(Boolean).length;
      failed += results.filter((r) => !r).length;

      // Small delay between batches to respect rate limits
      if (i + batchSize < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      message: `Newsletter enviado`,
      sent,
      failed,
      total: subscribers.length,
    });
  } catch (error) {
    console.error("Error sending newsletter:", error);
    return NextResponse.json(
      { error: "Error al enviar newsletter" },
      { status: 500 }
    );
  }
}
