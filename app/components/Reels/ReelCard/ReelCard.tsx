"use client";

import { Play } from "lucide-react";
import styles from "./ReelCard.module.css";

// ============================================
// TIPOS
// ============================================

export interface ReelData {
  id: number;
  title: string;
  description: string | null;
  embedUrl: string;
  embedType: "INSTAGRAM" | "TIKTOK" | "YOUTUBE_SHORTS";
  thumbnailUrl: string;
  category: "TIPS" | "FRAUDES" | "PROCESO" | "TESTIMONIOS";
  views: number;
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
  const categoryLabels: Record<string, string> = {
    TIPS: "Tip",
    FRAUDES: "Alerta",
    PROCESO: "Proceso",
    TESTIMONIOS: "Testimonio",
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
            <Play size={24} fill="white" />
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
        {reel.views > 0 && (
          <span className={styles.views}>
            {reel.views.toLocaleString("es-PE")} vistas
          </span>
        )}
      </div>
    </button>
  );
}
