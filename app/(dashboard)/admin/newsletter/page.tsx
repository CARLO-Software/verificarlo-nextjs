"use client";

import { useEffect, useState } from "react";
import { Mail, Send, Users, CheckCircle, AlertCircle } from "lucide-react";
import styles from "./AdminNewsletter.module.css";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  createdAt: string;
  category: {
    name: string;
  };
}

interface SendResult {
  message: string;
  sent: number;
  failed: number;
  total: number;
}

export default function AdminNewsletterPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [selectedPost, setSelectedPost] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const response = await fetch("/api/admin/newsletter");
      if (response.ok) {
        const data = await response.json();
        setBlogPosts(data.blogPosts || []);
        setSubscriberCount(data.subscriberCount || 0);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!selectedPost) {
      setError("Selecciona un artículo para enviar");
      return;
    }

    const post = blogPosts.find((p) => p.id === selectedPost);
    if (!confirm(`¿Enviar "${post?.title}" a ${subscriberCount} suscriptores?`)) {
      return;
    }

    setSending(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogPostId: selectedPost }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setSelectedPost("");
      } else {
        setError(data.error || "Error al enviar");
      }
    } catch (err) {
      console.error("Error sending newsletter:", err);
      setError("Error de conexión");
    } finally {
      setSending(false);
    }
  }

  const selectedBlog = blogPosts.find((p) => p.id === selectedPost);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Newsletter</h1>
          <p className={styles.subtitle}>
            Envía artículos del blog a tus suscriptores
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Users className={styles.statIcon} />
          <div>
            <span className={styles.statValue}>{subscriberCount}</span>
            <span className={styles.statLabel}>Suscriptores</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Mail className={styles.statIcon} />
          <div>
            <span className={styles.statValue}>{blogPosts.length}</span>
            <span className={styles.statLabel}>Artículos disponibles</span>
          </div>
        </div>
      </div>

      {/* Send Section */}
      <div className={styles.sendSection}>
        <h2 className={styles.sectionTitle}>Enviar Newsletter</h2>

        {blogPosts.length === 0 ? (
          <p className={styles.emptyMessage}>
            No hay artículos publicados para enviar.
          </p>
        ) : (
          <>
            <div className={styles.selectWrapper}>
              <label htmlFor="blog-select" className={styles.label}>
                Selecciona un artículo:
              </label>
              <select
                id="blog-select"
                value={selectedPost}
                onChange={(e) => {
                  setSelectedPost(e.target.value);
                  setResult(null);
                  setError(null);
                }}
                className={styles.select}
                disabled={sending}
              >
                <option value="">-- Seleccionar artículo --</option>
                {blogPosts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.title} ({post.category.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Preview */}
            {selectedBlog && (
              <div className={styles.preview}>
                <h3 className={styles.previewTitle}>Vista previa</h3>
                <div className={styles.previewCard}>
                  <img
                    src={selectedBlog.coverImage}
                    alt={selectedBlog.title}
                    className={styles.previewImage}
                  />
                  <div className={styles.previewContent}>
                    <h4>{selectedBlog.title}</h4>
                    <p>{selectedBlog.excerpt}</p>
                    <span className={styles.previewAuthor}>
                      Por {selectedBlog.author}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className={styles.errorMessage}>
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {/* Success message */}
            {result && (
              <div className={styles.successMessage}>
                <CheckCircle size={20} />
                <div>
                  <strong>{result.message}</strong>
                  <p>
                    Enviados: {result.sent} | Fallidos: {result.failed} | Total:{" "}
                    {result.total}
                  </p>
                </div>
              </div>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!selectedPost || sending || subscriberCount === 0}
              className={styles.sendButton}
            >
              {sending ? (
                <>Enviando...</>
              ) : (
                <>
                  <Send size={20} />
                  Enviar a {subscriberCount} suscriptores
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
