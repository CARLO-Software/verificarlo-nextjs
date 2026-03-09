import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import BlogList from "../../BlogList";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ search?: string; page?: string }>;
}

async function getCategory(slug: string) {
  return db.blogCategory.findUnique({
    where: { slug },
  });
}

async function getCategories() {
  return db.blogCategory.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { posts: { where: { published: true } } },
      },
    },
  });
}

async function getPosts(categorySlug: string, search?: string, page: number = 1) {
  const limit = 9;
  const skip = (page - 1) * limit;

  const where = {
    published: true,
    category: { slug: categorySlug },
    ...(search && {
      OR: [
        { title: { contains: search } },
        { excerpt: { contains: search } },
      ],
    }),
  };

  const [posts, total] = await Promise.all([
    db.blogPost.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.blogPost.count({ where }),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: "Categoría no encontrada | VerifiCARLO",
    };
  }

  return {
    title: `${category.name} - Artículos y Guías`,
    description: `Artículos sobre ${category.name.toLowerCase()} para comprar autos usados de forma segura. Consejos de expertos, guías prácticas y tips de VerifiCARLO.`,
    alternates: {
      canonical: `/blog/categoria/${slug}`,
    },
    openGraph: {
      title: `${category.name} | Blog VerifiCARLO`,
      description: `Explora artículos de ${category.name.toLowerCase()}. Guías y consejos para comprar tu auto usado con confianza.`,
      type: "website",
      url: `https://verificarlo.com/blog/categoria/${slug}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { search, page: pageParam } = await searchParams;

  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const page = parseInt(pageParam || "1");

  const [categories, { posts, pagination }] = await Promise.all([
    getCategories(),
    getPosts(slug, search, page),
  ]);

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <BlogList
        posts={posts}
        categories={categories}
        pagination={pagination}
        search={search}
        activeCategory={slug}
      />
    </Suspense>
  );
}
