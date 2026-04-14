// ============================================
// HOOK: useReelsAnalytics
// Tracking de eventos para Reels con GTM/GA4
// ============================================

import { useCallback } from "react";
import { ReelData } from "@/app/components/Reels/ReelCard/ReelCard";

// Extender Window para incluir dataLayer
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer?: any[];
  }
}

// ============================================
// TIPOS DE EVENTOS
// ============================================

interface ReelViewEvent {
  event: "reel_view";
  reel_id: number;
  reel_title: string;
  reel_category: string;
  reel_platform: string;
  source: "landing_grid" | "viewer_navigation";
}

interface ReelSwipeEvent {
  event: "reel_swipe";
  direction: "up" | "down";
  from_reel_id: number;
  to_reel_id: number;
  from_reel_title: string;
  to_reel_title: string;
}

interface ReelSectionViewEvent {
  event: "reel_section_view";
  total_reels: number;
}

interface ReelViewerCloseEvent {
  event: "reel_viewer_close";
  reel_id: number;
  reel_title: string;
  reels_viewed_count: number;
}

type AnalyticsEvent =
  | ReelViewEvent
  | ReelSwipeEvent
  | ReelSectionViewEvent
  | ReelViewerCloseEvent;

// ============================================
// HELPER: Push to dataLayer
// ============================================

function pushToDataLayer(event: AnalyticsEvent) {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({ ...event });
  }
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useReelsAnalytics() {
  // Evento: Se visualiza un reel (abre el modal o navega a otro)
  const trackReelView = useCallback(
    (reel: ReelData, source: "landing_grid" | "viewer_navigation") => {
      pushToDataLayer({
        event: "reel_view",
        reel_id: reel.id,
        reel_title: reel.title,
        reel_category: reel.category,
        reel_platform: reel.embedType,
        source,
      });
    },
    []
  );

  // Evento: Swipe entre reels
  const trackReelSwipe = useCallback(
    (
      direction: "up" | "down",
      fromReel: ReelData,
      toReel: ReelData
    ) => {
      pushToDataLayer({
        event: "reel_swipe",
        direction,
        from_reel_id: fromReel.id,
        to_reel_id: toReel.id,
        from_reel_title: fromReel.title,
        to_reel_title: toReel.title,
      });
    },
    []
  );

  // Evento: La sección de reels es visible
  const trackSectionView = useCallback((totalReels: number) => {
    pushToDataLayer({
      event: "reel_section_view",
      total_reels: totalReels,
    });
  }, []);

  // Evento: Se cierra el visor
  const trackViewerClose = useCallback(
    (currentReel: ReelData, reelsViewedCount: number) => {
      pushToDataLayer({
        event: "reel_viewer_close",
        reel_id: currentReel.id,
        reel_title: currentReel.title,
        reels_viewed_count: reelsViewedCount,
      });
    },
    []
  );

  return {
    trackReelView,
    trackReelSwipe,
    trackSectionView,
    trackViewerClose,
  };
}
