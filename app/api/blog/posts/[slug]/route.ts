import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/blog/posts/[slug] - Get a single post
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const post = await db.blogPost.findUnique({
      where: { slug },
      include: {
        category: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { error: "Error al obtener el post" },
      { status: 500 }
    );
  }
}

// PUT /api/blog/posts/[slug] - Update a post (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const { title, newSlug, excerpt, content, coverImage, categoryId, author, published } = body;

    const existingPost = await db.blogPost.findUnique({
      where: { slug },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post no encontrado" },
        { status: 404 }
      );
    }

    // Check if new slug already exists (if changing slug)
    if (newSlug && newSlug !== slug) {
      const slugExists = await db.blogPost.findUnique({
        where: { slug: newSlug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: "Ya existe un post con ese slug" },
          { status: 400 }
        );
      }
    }

    const post = await db.blogPost.update({
      where: { slug },
      data: {
        ...(title && { title }),
        ...(newSlug && { slug: newSlug }),
        ...(excerpt && { excerpt }),
        ...(content && { content }),
        ...(coverImage && { coverImage }),
        ...(categoryId && { categoryId }),
        ...(author && { author }),
        ...(typeof published === "boolean" && { published }),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { error: "Error al actualizar el post" },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/posts/[slug] - Delete a post (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;

    const existingPost = await db.blogPost.findUnique({
      where: { slug },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post no encontrado" },
        { status: 404 }
      );
    }

    await db.blogPost.delete({
      where: { slug },
    });

    return NextResponse.json({ message: "Post eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { error: "Error al eliminar el post" },
      { status: 500 }
    );
  }
}
