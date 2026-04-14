"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import ReelCard, { ReelData } from "../ReelCard/ReelCard";
import ReelViewer from "../ReelViewer/ReelViewer";
import { useReelsAnalytics } from "@/app/hooks/useReelsAnalytics";
import styles from "./ReelsSection.module.css";

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ReelsSection() {
  const [reels, setReels] = useState<ReelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionTrackedRef = useRef(false);

  const { trackReelView, trackSectionView } = useReelsAnalytics();

  // Cargar reels desde la API
  useEffect(() => {
    async function fetchReels() {
      try {
        const response = await fetch("/api/reels");
        if (response.ok) {
          const data = await response.json();
          setReels(data);

          // Track section view (solo una vez)
          if (data.length > 0 && !sectionTrackedRef.current) {
            sectionTrackedRef.current = true;
            trackSectionView(data.length);
          }
        }
      } catch (error) {
        console.error("Error loading reels:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReels();
  }, [trackSectionView]);

  // Detectar si se puede scrollear
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [reels]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollAmount = 400;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const openViewer = (index: number) => {
    // Track apertura desde la grid
    trackReelView(reels[index], "landing_grid");
    setSelectedIndex(index);
  };

  const closeViewer = () => {
    setSelectedIndex(null);
  };

  // No renderizar si no hay reels
  if (!loading && reels.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} id="reels">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.badge}>
              <Play size={14} />
              <span>Tips en video</span>
            </div>
            <h2 className={styles.title}>Aprende a comprar seguro</h2>
            <p className={styles.subtitle}>
              Tips de expertos para evitar fraudes en la compra de autos usados
            </p>
          </div>

          {/* Controles de navegación (desktop) */}
          <div className={styles.navControls}>
            <button
              className={`${styles.navButton} ${!canScrollLeft ? styles.navDisabled : ""}`}
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label="Anterior"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className={`${styles.navButton} ${!canScrollRight ? styles.navDisabled : ""}`}
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label="Siguiente"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Grid de reels */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </div>
        ) : (
          <div className={styles.scrollWrapper}>
            {/* Gradientes laterales */}
            {canScrollLeft && <div className={styles.gradientLeft} />}
            {canScrollRight && <div className={styles.gradientRight} />}

            <div
              ref={scrollRef}
              className={styles.reelsGrid}
              onScroll={checkScroll}
            >
              {reels.map((reel, index) => (
                <ReelCard
                  key={reel.id}
                  reel={reel}
                  index={index}
                  onClick={() => openViewer(index)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Indicador de scroll (mobile) */}
        <div className={styles.scrollIndicator}>
          <span>Desliza para ver más</span>
          <ChevronRight size={16} />
        </div>
      </div>

      {/* Modal del visor */}
      {selectedIndex !== null && (
        <ReelViewer
          reels={reels}
          initialIndex={selectedIndex}
          onClose={closeViewer}
        />
      )}
    </section>
  );
}
