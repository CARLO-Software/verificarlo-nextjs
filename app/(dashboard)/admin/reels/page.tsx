"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  GripVertical,
  Play,
  Instagram,
  Youtube,
} from "lucide-react";
import styles from "./AdminReels.module.css";

// ============================================
// TIPOS
// ============================================

type EmbedType = "INSTAGRAM" | "TIKTOK" | "YOUTUBE_SHORTS";
type ReelCategory = "TIPS" | "FRAUDES" | "PROCESO" | "TESTIMONIOS";

interface Reel {
  id: number;
  title: string;
  description: string | null;
  embedUrl: string;
  embedType: EmbedType;
  thumbnailUrl: string;
  category: ReelCategory;
  sortOrder: number;
  views: number;
  likes: number;
  isActive: boolean;
  createdAt: string;
}

// ============================================
// HELPERS
// ============================================

const categoryLabels: Record<ReelCategory, string> = {
  TIPS: "Tips",
  FRAUDES: "Fraudes",
  PROCESO: "Proceso",
  TESTIMONIOS: "Testimonios",
};

const categoryColors: Record<ReelCategory, string> = {
  TIPS: "#3b82f6",
  FRAUDES: "#ef4444",
  PROCESO: "#10b981",
  TESTIMONIOS: "#f59e0b",
};

const embedIcons: Record<EmbedType, JSX.Element> = {
  INSTAGRAM: <Instagram size={14} />,
  TIKTOK: <Play size={14} />,
  YOUTUBE_SHORTS: <Youtube size={14} />,
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AdminReelsPage() {
  const router = useRouter();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchReels();
  }, []);

  async function fetchReels() {
    try {
      const response = await fetch("/api/admin/reels");
      if (response.ok) {
        const data = await response.json();
        setReels(data);
      }
    } catch (error) {
      console.error("Error fetching reels:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(reel: Reel) {
    try {
      const response = await fetch(`/api/admin/reels/${reel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !reel.isActive }),
      });

      if (response.ok) {
        setReels((prev) =>
          prev.map((r) =>
            r.id === reel.id ? { ...r, isActive: !r.isActive } : r
          )
        );
      }
    } catch (error) {
      console.error("Error toggling active status:", error);
    }
  }

  async function deleteReel(reel: Reel) {
    if (!confirm(`¿Estás seguro de eliminar "${reel.title}"?`)) return;

    setDeleting(reel.id);

    try {
      const response = await fetch(`/api/admin/reels/${reel.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setReels((prev) => prev.filter((r) => r.id !== reel.id));
      }
    } catch (error) {
      console.error("Error deleting reel:", error);
    } finally {
      setDeleting(null);
    }
  }

  // ============================================
  // DRAG & DROP
  // ============================================

  function handleDragStart(e: React.DragEvent, id: number) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, targetId: number) {
    e.preventDefault();
    if (draggingId === null || draggingId === targetId) return;

    const newReels = [...reels];
    const dragIndex = newReels.findIndex((r) => r.id === draggingId);
    const dropIndex = newReels.findIndex((r) => r.id === targetId);

    const [draggedItem] = newReels.splice(dragIndex, 1);
    newReels.splice(dropIndex, 0, draggedItem);

    setReels(newReels);
    setDraggingId(null);

    // Guardar nuevo orden en el servidor
    saveOrder(newReels.map((r) => r.id));
  }

  function handleDragEnd() {
    setDraggingId(null);
  }

  async function saveOrder(orderedIds: number[]) {
    setSaving(true);
    try {
      await fetch("/api/admin/reels/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
    } catch (error) {
      console.error("Error saving order:", error);
    } finally {
      setSaving(false);
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando reels...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reels Educativos</h1>
          <p className={styles.subtitle}>
            Gestiona los videos educativos de la landing page
            {saving && <span className={styles.savingBadge}>Guardando...</span>}
          </p>
        </div>
        <Link href="/admin/reels/nuevo" className={styles.addButton}>
          <Plus size={20} />
          Nuevo Reel
        </Link>
      </div>

      {reels.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Play size={48} />
          </div>
          <p>No hay reels todavía</p>
          <Link href="/admin/reels/nuevo" className={styles.addButton}>
            <Plus size={20} />
            Crear primer reel
          </Link>
        </div>
      ) : (
        <>
          <p className={styles.dragHint}>
            <GripVertical size={16} />
            Arrastra las filas para reordenar los reels
          </p>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Reel</th>
                  <th>Categoría</th>
                  <th>Plataforma</th>
                  <th>Likes</th>
                  <th>Vistas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reels.map((reel) => (
                  <tr
                    key={reel.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, reel.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, reel.id)}
                    onDragEnd={handleDragEnd}
                    className={draggingId === reel.id ? styles.dragging : ""}
                  >
                    <td className={styles.dragHandle}>
                      <GripVertical size={16} />
                    </td>
                    <td>
                      <div className={styles.reelInfo}>
                        <div className={styles.thumbnail}>
                          <img src={reel.thumbnailUrl} alt={reel.title} />
                          <div className={styles.playOverlay}>
                            <Play size={16} />
                          </div>
                        </div>
                        <div className={styles.reelText}>
                          <span className={styles.reelTitle}>{reel.title}</span>
                          {reel.description && (
                            <span className={styles.reelDescription}>
                              {reel.description.slice(0, 60)}
                              {reel.description.length > 60 ? "..." : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={styles.categoryBadge}
                        style={{ backgroundColor: categoryColors[reel.category] }}
                      >
                        {categoryLabels[reel.category]}
                      </span>
                    </td>
                    <td>
                      <span className={styles.platformBadge}>
                        {embedIcons[reel.embedType]}
                        {reel.embedType === "YOUTUBE_SHORTS"
                          ? "YouTube"
                          : reel.embedType.charAt(0) +
                            reel.embedType.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className={styles.viewsCell}>
                      {formatNumber(reel.likes)}
                    </td>
                    <td className={styles.viewsCell}>
                      {formatNumber(reel.views)}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleActive(reel)}
                        className={`${styles.statusBadge} ${
                          reel.isActive ? styles.active : styles.inactive
                        }`}
                      >
                        {reel.isActive ? (
                          <>
                            <Eye size={14} />
                            Activo
                          </>
                        ) : (
                          <>
                            <EyeOff size={14} />
                            Oculto
                          </>
                        )}
                      </button>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() =>
                            router.push(`/admin/reels/${reel.id}/editar`)
                          }
                          className={styles.actionButton}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => deleteReel(reel)}
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          title="Eliminar"
                          disabled={deleting === reel.id}
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
        </>
      )}
    </div>
  );
}
