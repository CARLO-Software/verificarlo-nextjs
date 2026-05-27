"use client";

/**
 * ScrollDebug - Componente temporal para depurar problemas de scroll
 *
 * INSTRUCCIONES:
 * 1. Importa este componente en app/page.tsx
 * 2. Agrega <ScrollDebug /> al final del main
 * 3. Observa la consola del navegador mientras haces scroll en móvil
 * 4. Busca cambios bruscos en bodyHeight o documentHeight que indiquen layout shift
 * 5. IMPORTANTE: Elimina este componente después de depurar
 */

import { useEffect, useState, useRef } from "react";

interface ScrollData {
  scrollY: number;
  innerHeight: number;
  bodyHeight: number;
  documentHeight: number;
  visualViewportHeight: number | null;
  timestamp: number;
}

export default function ScrollDebug() {
  const [data, setData] = useState<ScrollData | null>(null);
  const [layoutShiftDetected, setLayoutShiftDetected] = useState(false);
  const lastHeightRef = useRef<number>(0);
  const shiftCountRef = useRef<number>(0);

  useEffect(() => {
    const updateData = () => {
      const currentHeight = document.documentElement.scrollHeight;
      const newData: ScrollData = {
        scrollY: Math.round(window.scrollY),
        innerHeight: window.innerHeight,
        bodyHeight: document.body.scrollHeight,
        documentHeight: currentHeight,
        visualViewportHeight: window.visualViewport?.height ?? null,
        timestamp: Date.now(),
      };

      // Detectar cambio de altura (layout shift)
      if (lastHeightRef.current > 0) {
        const heightDiff = Math.abs(currentHeight - lastHeightRef.current);
        if (heightDiff > 5) {
          shiftCountRef.current++;
          setLayoutShiftDetected(true);
          console.warn(
            `[ScrollDebug] Layout Shift detectado! Diferencia: ${heightDiff}px`,
            {
              anterior: lastHeightRef.current,
              actual: currentHeight,
              scrollY: newData.scrollY,
              totalShifts: shiftCountRef.current,
            }
          );
        }
      }
      lastHeightRef.current = currentHeight;

      setData(newData);

      // Log detallado cada 500ms max
      console.log("[ScrollDebug]", newData);
    };

    // Throttle para no saturar
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateData();
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleViewportResize = () => {
      console.log("[ScrollDebug] VisualViewport resize:", {
        height: window.visualViewport?.height,
        offsetTop: window.visualViewport?.offsetTop,
      });
      updateData();
    };

    // Initial
    updateData();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateData);
    window.visualViewport?.addEventListener("resize", handleViewportResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateData);
      window.visualViewport?.removeEventListener("resize", handleViewportResize);
    };
  }, []);

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        right: 10,
        background: layoutShiftDetected ? "rgba(255,0,0,0.9)" : "rgba(0,0,0,0.85)",
        color: "white",
        padding: "8px 12px",
        borderRadius: 8,
        fontSize: 11,
        fontFamily: "monospace",
        zIndex: 99999,
        maxWidth: 200,
        lineHeight: 1.4,
        pointerEvents: "none",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: 4 }}>
        {layoutShiftDetected ? "LAYOUT SHIFT!" : "Scroll Debug"}
      </div>
      {data && (
        <>
          <div>scrollY: {data.scrollY}px</div>
          <div>innerH: {data.innerHeight}px</div>
          <div>docH: {data.documentHeight}px</div>
          {data.visualViewportHeight && (
            <div>vvH: {Math.round(data.visualViewportHeight)}px</div>
          )}
          {layoutShiftDetected && (
            <div style={{ color: "#ff6b6b", marginTop: 4 }}>
              Shifts: {shiftCountRef.current}
            </div>
          )}
        </>
      )}
    </div>
  );
}
