"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./CategoryFilter.module.css";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  _count?: {
    posts: number;
  };
}

interface CategoryFilterProps {
  categories: Category[];
  activeCategory?: string;
}

export default function CategoryFilter({ categories, activeCategory }: CategoryFilterProps) {
  const searchParams = useSearchParams();

  function buildUrl(categorySlug?: string) {
    const params = new URLSearchParams();
    const search = searchParams.get("search");

    if (search) {
      params.set("search", search);
    }

    if (categorySlug) {
      return `/blog/categoria/${categorySlug}${params.toString() ? `?${params}` : ""}`;
    }

    return `/blog${params.toString() ? `?${params}` : ""}`;
  }

  return (
    <div className={styles.filter}>
      <Link
        href={buildUrl()}
        className={`${styles.pill} ${!activeCategory ? styles.active : ""}`}
      >
        Todos
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={buildUrl(category.slug)}
          className={`${styles.pill} ${activeCategory === category.slug ? styles.active : ""}`}
          style={{
            "--category-color": category.color,
          } as React.CSSProperties}
        >
          {category.name}
          {category._count && (
            <span className={styles.count}>{category._count.posts}</span>
          )}
        </Link>
      ))}
    </div>
  );
}
