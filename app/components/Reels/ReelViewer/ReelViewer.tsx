"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronUp, ChevronDown, Volume2, VolumeX, Play } from "lucide-react";
import { ReelData } from "../ReelCard/ReelCard";
import { useReelsAnalytics } from "@/app/hooks/useReelsAnalytics";
import styles from "./ReelViewer.module.css";

// ============================================
// TIPOS
// ============================================

interface ReelViewerProps {
  reels: ReelData[];
  initialIndex: number;
  onClose: () => void;
}

// ============================================
// HELPERS: Generar URL de embed
// ============================================

function getEmbedUrl(reel: ReelData): string | null {
  const url = reel.embedUrl;
  if (!url) return null;

  if (reel.embedType === "INSTAGRAM") {
    const cleanUrl = url.split("?")[0];
    return cleanUrl.endsWith("/") ? `${cleanUrl}embed` : `${cleanUrl}/embed`;
  }

  if (reel.embedType === "TIKTOK") {
    const match = url.match(/video\/(\d+)/);
    if (match) {
      return `https://www.tiktok.com/embed/v2/${match[1]}`;
    }
  }

  if (reel.embedType === "YOUTUBE_SHORTS") {
    const match = url.match(/(?:shorts\/|v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=0`;
    }
  }

  return url;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ReelViewer({
  reels,
  initialIndex,
  onClose,
}: ReelViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewedReelsRef = useRef<Set<number>>(new Set([initialIndex]));

  const { trackReelView, trackReelSwipe, trackViewerClose } = useReelsAnalytics();

  const currentReel = reels[currentIndex];
  const hasNext = currentIndex < reels.length - 1;
  const hasPrev = currentIndex > 0;

  // Registrar vista en BD y analytics
  useEffect(() => {
    // Registrar en BD
    fetch(`/api/reels/${currentReel.id}/view`, { method: "POST" }).catch(() => {});

    // Track en GA4 (solo si es navegación, no la apertura inicial)
    if (viewedReelsRef.current.size > 1 || currentIndex !== initialIndex) {
      trackReelView(currentReel, "viewer_navigation");
    }

    viewedReelsRef.current.add(currentIndex);

    // Reset progress when changing reels
    setProgress(0);
    setIsPlaying(true);
  }, [currentReel, currentIndex, initialIndex, trackReelView]);

  // Sync muted state with video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Handle video time update for progress bar
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const percentage = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(isNaN(percentage) ? 0 : percentage);
    }
  }, []);

  // Toggle play/pause for native video
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  // Handler de cierre con tracking
  const handleClose = useCallback(() => {
    trackViewerClose(currentReel, viewedReelsRef.current.size);
    onClose();
  }, [currentReel, onClose, trackViewerClose]);

  // Navegación con teclado
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowUp" && hasPrev) setCurrentIndex((i) => i - 1);
      if (e.key === "ArrowDown" && hasNext) setCurrentIndex((i) => i + 1);
    },
    [handleClose, hasPrev, hasNext]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  // Swipe handling
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isSwipeUp = distance > minSwipeDistance;
    const isSwipeDown = distance < -minSwipeDistance;

    if (isSwipeUp && hasNext) {
      trackReelSwipe("up", reels[currentIndex], reels[currentIndex + 1]);
      setCurrentIndex((i) => i + 1);
    }
    if (isSwipeDown && hasPrev) {
      trackReelSwipe("down", reels[currentIndex], reels[currentIndex - 1]);
      setCurrentIndex((i) => i - 1);
    }
  };

  const goNext = () => {
    if (hasNext) {
      trackReelSwipe("up", reels[currentIndex], reels[currentIndex + 1]);
      setCurrentIndex((i) => i + 1);
    }
  };

  const goPrev = () => {
    if (hasPrev) {
      trackReelSwipe("down", reels[currentIndex], reels[currentIndex - 1]);
      setCurrentIndex((i) => i - 1);
    }
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div
        ref={containerRef}
        className={styles.container}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>V</span>
            <span className={styles.logoText}>VerifiCARLO</span>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.muteButton}
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? "Activar sonido" : "Silenciar"}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button
              className={styles.closeButton}
              onClick={handleClose}
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>
          </div>
        </header>

        {/* Video container */}
        <div className={styles.videoContainer}>
          {currentReel.videoUrl ? (
            <>
              <video
                key={currentReel.id}
                ref={videoRef}
                src={currentReel.videoUrl}
                className={styles.video}
                autoPlay
                loop
                playsInline
                muted={isMuted}
                poster={currentReel.thumbnailUrl}
                onClick={togglePlayPause}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              {/* Play/Pause overlay indicator */}
              {!isPlaying && (
                <div className={styles.playOverlay} onClick={togglePlayPause}>
                  <Play size={48} fill="white" />
                </div>
              )}
              {/* Progress bar */}
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : getEmbedUrl(currentReel) ? (
            <iframe
              key={currentReel.id}
              src={getEmbedUrl(currentReel)!}
              className={styles.iframe}
              frameBorder="0"
              allowFullScreen
              allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <img
              src={currentReel.thumbnailUrl}
              alt={currentReel.title}
              className={styles.video}
            />
          )}
        </div>

        {/* Info del reel */}
        <div className={styles.reelInfo}>
          <h2 className={styles.reelTitle}>{currentReel.title}</h2>
          {currentReel.description && (
            <p className={styles.reelDescription}>{currentReel.description}</p>
          )}
        </div>

        {/* Navegación lateral */}
        <div className={styles.navigation}>
          <button
            className={`${styles.navButton} ${!hasPrev ? styles.navDisabled : ""}`}
            onClick={goPrev}
            disabled={!hasPrev}
            aria-label="Video anterior"
          >
            <ChevronUp size={28} />
          </button>
          <button
            className={`${styles.navButton} ${!hasNext ? styles.navDisabled : ""}`}
            onClick={goNext}
            disabled={!hasNext}
            aria-label="Siguiente video"
          >
            <ChevronDown size={28} />
          </button>
        </div>

        {/* Indicador de posición */}
        <div className={styles.dots}>
          {reels.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentIndex ? styles.dotActive : ""}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Ir al video ${index + 1}`}
            />
          ))}
        </div>

        {/* Hint de swipe (solo mobile) */}
        {hasNext && (
          <div className={styles.swipeHint}>
            <ChevronUp size={16} />
            <span>Desliza para ver más</span>
          </div>
        )}
      </div>
    </div>
  );
}
