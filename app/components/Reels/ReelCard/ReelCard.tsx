"use client";

import { useState } from "react";
import { Heart, Play } from "lucide-react";
import styles from "./ReelCard.module.css";

// ============================================
// TIPOS
// ============================================

export interface ReelData {
  id: number;
  title: string;
  description: string | null;
  embedUrl: string | null; // Opcional si hay videoUrl
  embedType: "INSTAGRAM" | "TIKTOK" | "YOUTUBE_SHORTS";
  thumbnailUrl: string;
  videoUrl?: string; // Video nativo - si existe, se usa en lugar del embed
  category: "TIPS" | "FRAUDES" | "PROCESO" | "TESTIMONIOS";
  views: number;
  likes: number;
}

interface ReelCardProps {
  reel: ReelData;
  onClick: () => void;
  index: number;
}

// ============================================
// COMPONENTE
// ============================================

export default function ReelCard({ reel, onClick, index }: ReelCardProps) {
  const [likeCount, setLikeCount] = useState(reel.likes);
  const [liked, setLiked] = useState(false);

  const categoryLabels: Record<string, string> = {
    TIPS: "Tip",
    FRAUDES: "Alerta",
    PROCESO: "Proceso",
    TESTIMONIOS: "Testimonio",
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikeCount((prev) => prev + 1);
    setLiked(true);
    fetch(`/api/reels/${reel.id}/like`, { method: "POST" });
  };

  return (
    <button
      className={styles.card}
      onClick={onClick}
      aria-label={`Ver video: ${reel.title}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Thumbnail */}
      <div className={styles.thumbnailWrapper}>
        <img
          src={reel.thumbnailUrl}
          alt={reel.title}
          className={styles.thumbnail}
          loading="lazy"
        />

        {/* Overlay con play */}
        <div className={styles.overlay}>
          <div className={styles.playButton}>
            <Play size={10} fill="#FBD307" stroke="#FBD307" />
          </div>
        </div>

        {/* Badge de categoría */}
        <span className={styles.categoryBadge}>
          {categoryLabels[reel.category]}
        </span>

      </div>

      {/* Info */}
      <div className={styles.info}>
        <h3 className={styles.title}>{reel.title}</h3>
        {false && reel.views > 0 && (
          <span className={styles.views}>
            {reel.views.toLocaleString("es-PE")} vistas
          </span>
        )}
      </div>
    </button>
  );
}
