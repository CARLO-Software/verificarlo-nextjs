import { Suspense } from "react";
import { Metadata } from "next";
import { db } from "@/lib/db";
import BlogList from "./BlogList";

export const dynamic = "force-dynamic";

// Metadata para SEO del blog
export const metadata: Metadata = {
  title: "Blog - Consejos para Comprar Autos Usados",
  description:
    "Aprende a comprar un auto usado con seguridad. Consejos de expertos, guías de inspección, detección de fraudes y todo lo que necesitas saber antes de comprar.",
  keywords: [
    "consejos comprar auto usado",
    "guía inspección vehicular",
    "detectar fraudes autos",
    "revisar auto antes de comprar",
    "tips compra vehículos usados",
  ],
  openGraph: {
    title: "Blog VerifiCARLO - Guías y Consejos Automotrices",
    description:
      "Consejos de expertos para comprar autos usados de forma segura. Guías, tips y todo lo que necesitas saber.",
    type: "website",
    url: "https://verificarlo.com/blog",
  },
  alternates: {
    canonical: "/blog",
  },
};

interface SearchParams {
  search?: string;
  page?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
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

async function getPosts(search?: string, page: number = 1) {
  const limit = 9;
  const skip = (page - 1) * limit;

  const where = {
    published: true,
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

export default async function BlogPage({ searchParams }: Props) {
  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || "1");

  const [categories, { posts, pagination }] = await Promise.all([
    getCategories(),
    getPosts(search, page),
  ]);

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <BlogList
        posts={posts}
        categories={categories}
        pagination={pagination}
        search={search}
      />
    </Suspense>
  );
}
