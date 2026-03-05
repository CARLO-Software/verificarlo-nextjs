"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import styles from "./AdminBlog.module.css";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  published: boolean;
  createdAt: string;
  category: Category;
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const response = await fetch("/api/blog/posts?published=false&limit=100");
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function togglePublished(post: Post) {
    try {
      const response = await fetch(`/api/blog/posts/${post.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !post.published }),
      });

      if (response.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, published: !p.published } : p
          )
        );
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
    }
  }

  async function deletePost(post: Post) {
    if (!confirm(`¿Estás seguro de eliminar "${post.title}"?`)) return;

    setDeleting(post.id);

    try {
      const response = await fetch(`/api/blog/posts/${post.slug}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setDeleting(null);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando posts...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Blog</h1>
          <p className={styles.subtitle}>
            Gestiona los artículos del blog
          </p>
        </div>
        <Link href="/admin/blog/nuevo" className={styles.addButton}>
          <Plus size={20} />
          Nuevo artículo
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay artículos todavía</p>
          <Link href="/admin/blog/nuevo" className={styles.addButton}>
            <Plus size={20} />
            Crear primer artículo
          </Link>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <div className={styles.postTitle}>
                      <span className={styles.titleText}>{post.title}</span>
                      <span className={styles.slugText}>/{post.slug}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={styles.categoryBadge}
                      style={{ backgroundColor: post.category.color }}
                    >
                      {post.category.name}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => togglePublished(post)}
                      className={`${styles.statusBadge} ${
                        post.published ? styles.published : styles.draft
                      }`}
                    >
                      {post.published ? (
                        <>
                          <Eye size={14} />
                          Publicado
                        </>
                      ) : (
                        <>
                          <EyeOff size={14} />
                          Borrador
                        </>
                      )}
                    </button>
                  </td>
                  <td className={styles.dateCell}>
                    {formatDate(post.createdAt)}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() =>
                          router.push(`/admin/blog/${post.slug}`)
                        }
                        className={styles.actionButton}
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => deletePost(post)}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        title="Eliminar"
                        disabled={deleting === post.id}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
