import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/blog/categories - List all categories
export async function GET() {
  try {
    const categories = await db.blogCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { posts: { where: { published: true } } },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching blog categories:", error);
    return NextResponse.json(
      { error: "Error al obtener las categorías" },
      { status: 500 }
    );
  }
}

// POST /api/blog/categories - Create a new category (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, color } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Nombre y slug son requeridos" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingCategory = await db.blogCategory.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese slug" },
        { status: 400 }
      );
    }

    const category = await db.blogCategory.create({
      data: {
        name,
        slug,
        color: color || "#FFD700",
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating blog category:", error);
    return NextResponse.json(
      { error: "Error al crear la categoría" },
      { status: 500 }
    );
  }
}
