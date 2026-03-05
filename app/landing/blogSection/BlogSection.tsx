"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./BlogSection.module.css";
import NewsletterForm from "./NewsletterForm";

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  createdAt: string;
  category: BlogCategory;
}

function BlogCard({ post }: { post: BlogPost }) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <article className={styles.card}>
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
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{post.title}</h3>
        <p className={styles.cardExcerpt}>{post.excerpt}</p>
        <div className={styles.cardMeta}>
          <span className={styles.cardDate}>{formattedDate}</span>
          <span className={styles.cardDivider}>|</span>
          <span className={styles.cardAuthor}>{post.author}</span>
        </div>
        <Link href={`/blog/${post.slug}`} className={styles.cardLink}>
          <span className={styles.cardLinkIcon}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </Link>
      </div>
    </article>
  );
}

function BlogCardSkeleton() {
  return (
    <article className={styles.card}>
      <div className={`${styles.cardImageWrapper} ${styles.skeleton}`} />
      <div className={styles.cardContent}>
        <div className={`${styles.skeletonText} ${styles.skeletonTitle}`} />
        <div className={`${styles.skeletonText} ${styles.skeletonExcerpt}`} />
        <div className={`${styles.skeletonText} ${styles.skeletonMeta}`} />
      </div>
    </article>
  );
}

export default function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch("/api/blog/posts?limit=3&published=true");
        const data = await response.json();
        setPosts(data.posts || []);
      } catch (error) {
        console.error("Error fetching blog posts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  return (
    <section className={styles.section} id="blog">
      {/* Newsletter Banner */}
      <div className={styles.newsletterBanner}>
        <div className={styles.newsletterContent}>
          <h2 className={styles.newsletterTitle}>
            Recibe consejos para comprar tu auto usado
          </h2>
          <p className={styles.newsletterText}>
            Suscríbete a nuestro newsletter y recibe tips, alertas y guías
            directamente en tu correo.
          </p>
          <NewsletterForm />
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Blog</h2>
          <p className={styles.subtitle}>
            Consejos y guías para comprar tu auto usado con seguridad
          </p>
        </div>

        <div className={styles.grid}>
          {loading ? (
            <>
              <BlogCardSkeleton />
              <BlogCardSkeleton />
              <BlogCardSkeleton />
            </>
          ) : posts.length > 0 ? (
            posts.map((post) => <BlogCard key={post.id} post={post} />)
          ) : (
            <div className={styles.emptyState}>
              <p>Próximamente tendremos contenido para ti.</p>
            </div>
          )}
        </div>

        {posts.length > 0 && (
          <div className={styles.viewMore}>
            <Link href="/blog" className={styles.viewMoreButton}>
              Ver más artículos
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
