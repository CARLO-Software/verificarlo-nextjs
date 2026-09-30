"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function formatPlate(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length <= 3) return clean;
  return clean.slice(0, 3) + "-" + clean.slice(3, 6);
}

function cleanPlate(formatted: string): string {
  return formatted.replace(/-/g, "");
}

export default function DemoHero() {
  const [plate, setPlate] = useState("");
  const router = useRouter();

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    const clean = raw.replace(/-/g, "");
    if (clean.length <= 6) {
      setPlate(formatPlate(clean));
    }
  };

  const handleConsultar = () => {
    if (cleanPlate(plate).length < 6) return;
    router.push(`/demo?placa=${encodeURIComponent(cleanPlate(plate))}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConsultar();
  };

  const isReady = cleanPlate(plate).length >= 6;

  return (
    <div style={{
      position: "relative",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    }}>
      {/* Video background */}
      <video
        autoPlay muted loop playsInline
        poster="/assets/images/frame-hero.webp"
        style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          objectFit: "cover", zIndex: 0,
        }}
      >
        <source src="/assets/videos/hero-video-2.mp4" type="video/mp4" />
      </video>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.75) 100%)",
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", padding: "0 20px", maxWidth: 520, width: "100%",
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontWeight: 800, fontSize: 28, fontFamily: "Inter, system-ui, sans-serif" }}>
            <span style={{ color: "#fff" }}>VERIFI</span>
            <span style={{ color: "#BFFF00" }}>CARLO</span>
          </span>
          <span style={{
            background: "#7C3AED", color: "#fff", fontSize: 11, fontWeight: 700,
            padding: "3px 8px", borderRadius: 4, marginLeft: 10, verticalAlign: "middle",
          }}>DEMO</span>
        </div>

        <h1 style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "clamp(28px, 6vw, 48px)",
          fontWeight: 800,
          color: "#fff",
          lineHeight: 1.05,
          margin: "0 0 8px",
        }}>
          ¿Vas a comprar<br />un auto usado?
        </h1>

        <p style={{
          color: "rgba(219,219,219,0.9)",
          fontSize: "clamp(14px, 3vw, 16px)",
          fontWeight: 300,
          margin: "0 0 28px",
          fontFamily: "Inter, system-ui, sans-serif",
        }}>
          Verifica gratis cualquier placa antes de comprar
        </p>

        {/* Plate input box */}
        <div style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 16,
          padding: 6,
          width: "100%",
          maxWidth: 420,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}>
          <div style={{
            display: "flex", alignItems: "center",
            background: "#fff", borderRadius: 12, padding: "0 4px",
            height: 52,
          }}>
            {/* Flag */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "0 10px", gap: 2,
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#1a1a1a", lineHeight: 1 }}>PE</span>
              <div style={{ display: "flex", gap: 1 }}>
                <div style={{ width: 14, height: 3, background: "#D91023", borderRadius: 1 }} />
                <div style={{ width: 14, height: 3, background: "#fff", border: "1px solid #ddd", borderRadius: 1 }} />
                <div style={{ width: 14, height: 3, background: "#D91023", borderRadius: 1 }} />
              </div>
            </div>
            <div style={{ width: 1, height: 28, background: "#e5e7eb" }} />
            {/* Search icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A8A8F" strokeWidth="2.1" strokeLinecap="round" style={{ margin: "0 8px", flexShrink: 0 }}>
              <circle cx="11" cy="11" r="7" />
              <path d="M16.5 16.5L21 21" />
            </svg>
            <input
              type="text"
              value={plate}
              onChange={handlePlateChange}
              onKeyDown={handleKeyDown}
              placeholder="Ingresa tu placa"
              maxLength={7}
              autoFocus
              style={{
                flex: 1, border: "none", outline: "none", background: "transparent",
                fontSize: 16, fontWeight: 600, color: "#111", fontFamily: "Inter, system-ui, sans-serif",
                letterSpacing: 1,
              }}
              aria-label="Numero de placa del vehiculo"
            />
          </div>
          <button
            onClick={handleConsultar}
            disabled={!isReady}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "14px 0", borderRadius: 12,
              border: "none", cursor: isReady ? "pointer" : "default",
              background: isReady ? "#BFFF00" : "rgba(191,255,0,0.3)",
              color: isReady ? "#111" : "rgba(17,17,17,0.5)",
              fontWeight: 700, fontSize: 15, fontFamily: "Inter, system-ui, sans-serif",
              transition: "all 0.2s ease",
            }}
          >
            Consultar
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h15" /><path d="M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 20, marginTop: 32, flexWrap: "wrap",
        }}>
          {[
            { value: "+500", label: "inspecciones" },
            { value: "S/8,500", label: "ahorro promedio" },
            { value: "5.0 ★", label: "Google Reviews" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {i > 0 && <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.2)" }} />}
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#BFFF00", fontWeight: 800, fontSize: 18 }}>{s.value}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 400 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
