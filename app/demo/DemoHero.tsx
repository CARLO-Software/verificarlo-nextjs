"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../landing/hero/Hero.module.css";

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

  return (
    <header className={styles.hero} id="hero">
      <div className={styles.videoContainer}>
        <video
          autoPlay
          muted
          loop
          playsInline
          className={styles.videoBackground}
          poster="/assets/images/frame-hero.webp"
        >
          <source src="/assets/videos/hero-video-2.mp4" type="video/mp4" />
        </video>
        <div className={styles.videoOverlay} aria-hidden="true" />
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>
          ¿Vas a comprar
          <br />
          un auto usado?
        </h1>
        <p className={styles.subtitle}>
          Verifica gratis cualquier placa antes de comprar
        </p>

        <div className={styles.plateBox}>
          <div className={styles.plateInput}>
            <div className={styles.plateFlag}>
              <span className={styles.plateFlagCode}>PE</span>
              <div className={styles.plateFlagStripes}>
                <div className={styles.stripeRed} />
                <div className={styles.stripeWhite} />
                <div className={styles.stripeRed} />
              </div>
            </div>
            <div className={styles.plateDivider} />
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8A8A8F"
              strokeWidth="2.1"
              strokeLinecap="round"
              className={styles.plateSearchIcon}
            >
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
              className={styles.plateInputField}
              aria-label="Numero de placa del vehiculo"
            />
          </div>
          <button
            onClick={handleConsultar}
            className={styles.plateBtn}
            disabled={cleanPlate(plate).length < 6}
          >
            Consultar
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#16171b"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12h15" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>+500</span>
            <span className={styles.statLabel}>inspecciones</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>S/8,500</span>
            <span className={styles.statLabel}>de ahorro promedio</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>5.0 ★</span>
            <span className={styles.statLabel}>Google Reviews</span>
          </div>
        </div>
      </div>
    </header>
  );
}
