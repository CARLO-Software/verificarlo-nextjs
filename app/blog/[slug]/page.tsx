import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import Breadcrumbs from "../components/Breadcrumbs";
import { BlogPostSchema, BreadcrumbSchema } from "@/app/components/SEO/JsonLd";
import styles from "./BlogPost.module.css";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  const post = await db.blogPost.findUnique({
    where: { slug, published: true },
    include: { category: true },
  });

  return post;
}

async function getRelatedPosts(categoryId: string, excludeSlug: string) {
  return db.blogPost.findMany({
    where: {
      categoryId,
      published: true,
      slug: { not: excludeSlug },
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Post no encontrado | VerifiCARLO",
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      authors: [post.author],
      section: post.category.name,
      tags: [post.category.name, "autos usados", "inspección vehicular"],
      images: [
        {
          url: post.coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post.categoryId, post.slug);

  const formattedDate = new Date(post.createdAt).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const breadcrumbItems = [
    { label: "Blog", href: "/blog" },
    { label: post.category.name, href: `/blog/categoria/${post.category.slug}` },
    { label: post.title },
  ];

  // Breadcrumbs para schema SEO
  const breadcrumbSchemaItems = [
    { name: "Inicio", url: "https://verificarlo.pe" },
    { name: "Blog", url: "https://verificarlo.pe/blog" },
    { name: post.category.name, url: `https://verificarlo.pe/blog/categoria/${post.category.slug}` },
    { name: post.title, url: `https://verificarlo.pe/blog/${post.slug}` },
  ];

  return (
    <main className={styles.main}>
      {/* Schemas JSON-LD para SEO */}
      <BlogPostSchema
        title={post.title}
        description={post.excerpt}
        slug={post.slug}
        coverImage={post.coverImage}
        author={post.author}
        publishedAt={post.createdAt.toISOString()}
        modifiedAt={post.updatedAt?.toISOString()}
      />
      <BreadcrumbSchema items={breadcrumbSchemaItems} />

      <article className={styles.article}>
        <div className={styles.container}>
          <Breadcrumbs items={breadcrumbItems} />

          <header className={styles.header}>
            <span
              className={styles.category}
              style={{ backgroundColor: post.category.color }}
            >
              {post.category.name}
            </span>
            <h1 className={styles.title}>{post.title}</h1>
            <div className={styles.meta}>
              <span className={styles.date}>{formattedDate}</span>
              <span className={styles.divider}>|</span>
              <span className={styles.author}>Por {post.author}</span>
            </div>
          </header>
        </div>

        <div className={styles.coverWrapper}>
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className={styles.coverImage}
            priority
            sizes="100vw"
          />
        </div>

        <div className={styles.container}>
          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className={styles.share}>
            <span className={styles.shareLabel}>Compartir:</span>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                `https://verificarlo.pe/blog/${post.slug}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.shareLink}
              aria-label="Compartir en Facebook"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
              </svg>
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                post.title
              )}&url=${encodeURIComponent(
                `https://verificarlo.pe/blog/${post.slug}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.shareLink}
              aria-label="Compartir en Twitter"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M23.44 4.83c-.8.37-1.5.38-2.22.02.93-.56.98-.96 1.32-2.02-.88.52-1.86.9-2.9 1.1-.82-.88-2-1.43-3.3-1.43-2.5 0-4.55 2.04-4.55 4.54 0 .36.03.7.1 1.04-3.77-.2-7.12-2-9.36-4.75-.4.67-.6 1.45-.6 2.3 0 1.56.8 2.95 2 3.77-.74-.03-1.44-.23-2.05-.57v.06c0 2.2 1.56 4.03 3.64 4.44-.67.2-1.37.2-2.06.08.58 1.8 2.26 3.12 4.25 3.16C5.78 18.1 3.37 18.74 1 18.46c2 1.3 4.4 2.04 6.97 2.04 8.35 0 12.92-6.92 12.92-12.93 0-.2 0-.4-.02-.6.9-.63 1.96-1.22 2.56-2.14z" />
              </svg>
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `${post.title} - https://verificarlo.pe/blog/${post.slug}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.shareLink}
              aria-label="Compartir en WhatsApp"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          </div>
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.container}>
            <h2 className={styles.relatedTitle}>Artículos relacionados</h2>
            <div className={styles.relatedGrid}>
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/blog/${relatedPost.slug}`}
                  className={styles.relatedCard}
                >
                  <div className={styles.relatedImageWrapper}>
                    <Image
                      src={relatedPost.coverImage}
                      alt={relatedPost.title}
                      fill
                      className={styles.relatedImage}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className={styles.relatedContent}>
                    <span
                      className={styles.relatedCategory}
                      style={{ backgroundColor: relatedPost.category.color }}
                    >
                      {relatedPost.category.name}
                    </span>
                    <h3 className={styles.relatedCardTitle}>
                      {relatedPost.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
