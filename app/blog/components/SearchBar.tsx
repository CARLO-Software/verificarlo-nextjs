"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  basePath?: string;
}

export default function SearchBar({ basePath = "/blog" }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (search) {
        params.set("search", search);
        params.delete("page");
      } else {
        params.delete("search");
      }

      const queryString = params.toString();
      router.push(`${basePath}${queryString ? `?${queryString}` : ""}`);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, basePath, router, searchParams]);

  return (
    <div className={styles.searchBar}>
      <svg
        className={styles.icon}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar artículos..."
        className={styles.input}
      />
      {search && (
        <button
          type="button"
          onClick={() => setSearch("")}
          className={styles.clearButton}
          aria-label="Limpiar búsqueda"
        >
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
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
