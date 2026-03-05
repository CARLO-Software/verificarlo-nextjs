import { Suspense } from "react";
import { db } from "@/lib/db";
import BlogList from "./BlogList";

export const dynamic = "force-dynamic";

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
