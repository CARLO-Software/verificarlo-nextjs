"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import Breadcrumbs from "./components/Breadcrumbs";
import SearchBar from "./components/SearchBar";
import CategoryFilter from "./components/CategoryFilter";
import styles from "./Blog.module.css";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  _count?: {
    posts: number;
  };
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  createdAt: Date;
  category: Category;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BlogListProps {
  posts: Post[];
  categories: Category[];
  pagination: Pagination;
  search?: string;
  activeCategory?: string;
}

function BlogCard({ post }: { post: Post }) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <article className={styles.card}>
      <Link href={`/blog/${post.slug}`} className={styles.cardImageLink}>
        <div className={styles.cardImageWrapper}>
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className={styles.cardImage}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <span
            className={styles.categoryBadge}
            style={{ backgroundColor: post.category.color }}
          >
            {post.category.name}
          </span>
        </div>
      </Link>
      <div className={styles.cardContent}>
        <Link href={`/blog/${post.slug}`}>
          <h2 className={styles.cardTitle}>{post.title}</h2>
        </Link>
        <p className={styles.cardExcerpt}>{post.excerpt}</p>
        <div className={styles.cardMeta}>
          <span className={styles.cardDate}>{formattedDate}</span>
          <span className={styles.cardDivider}>|</span>
          <span className={styles.cardAuthor}>{post.author}</span>
        </div>
        <Link href={`/blog/${post.slug}`} className={styles.cardLink}>
          Leer más
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
}

function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <nav className={styles.pagination} aria-label="Paginación">
      {currentPage > 1 && (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className={styles.pageLink}
        >
          Anterior
        </Link>
      )}

      <div className={styles.pageNumbers}>
        {pages.map((page) => (
          <Link
            key={page}
            href={`${basePath}?page=${page}`}
            className={`${styles.pageNumber} ${
              page === currentPage ? styles.active : ""
            }`}
          >
            {page}
          </Link>
        ))}
      </div>

      {currentPage < totalPages && (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className={styles.pageLink}
        >
          Siguiente
        </Link>
      )}
    </nav>
  );
}

export default function BlogList({
  posts,
  categories,
  pagination,
  search,
  activeCategory,
}: BlogListProps) {
  const breadcrumbItems = activeCategory
    ? [
        { label: "Blog", href: "/blog" },
        {
          label:
            categories.find((c) => c.slug === activeCategory)?.name ||
            activeCategory,
        },
      ]
    : [{ label: "Blog" }];

  const basePath = activeCategory ? `/blog/categoria/${activeCategory}` : "/blog";

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Breadcrumbs items={breadcrumbItems} />

        <header className={styles.header}>
          <h1 className={styles.title}>
            {activeCategory
              ? `Artículos de ${
                  categories.find((c) => c.slug === activeCategory)?.name
                }`
              : "Blog"}
          </h1>
          <p className={styles.subtitle}>
            Consejos y guías para comprar tu auto usado con seguridad
          </p>
        </header>

        <div className={styles.filters}>
          <Suspense fallback={<div>Cargando...</div>}>
            <SearchBar basePath={basePath} />
          </Suspense>
          <Suspense fallback={<div>Cargando...</div>}>
            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
            />
          </Suspense>
        </div>

        {search && (
          <p className={styles.searchInfo}>
            Resultados para: <strong>&quot;{search}&quot;</strong> (
            {pagination.total} encontrados)
          </p>
        )}

        {posts.length > 0 ? (
          <>
            <div className={styles.grid}>
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              basePath={basePath}
            />
          </>
        ) : (
          <div className={styles.emptyState}>
            <h2>No se encontraron artículos</h2>
            <p>
              {search
                ? "Intenta con otros términos de búsqueda"
                : "Próximamente publicaremos contenido nuevo"}
            </p>
            {(search || activeCategory) && (
              <Link href="/blog" className={styles.resetButton}>
                Ver todos los artículos
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
