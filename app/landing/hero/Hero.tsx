"use client";

/**
 * ============================================
 * Hero - Sección Hero Principal (Pixel-Perfect desde Figma)
 * ============================================
 *
 * NOTA: Este componente solo contiene el Hero.
 * El Banner y NavBar son componentes separados en /app/layout/
 *
 * Estructura:
 * 1. Hero con imagen de fondo + overlay
 * 2. Contenido: Título, descripción, CTA
 * 3. Botón "¿Qué revisamos?" (negro con ícono de auto)
 *
 * Responsive: Mobile-first approach
 */

import styles from "./Hero.module.css";
import { Car } from "@phosphor-icons/react";

const ArrowRightIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);


export default function Hero() {
  return (
    <header className={styles.heroSection} id="hero">
      {/* Background Image with Overlay */}

      {/* Video Background */}
      <div className={styles.videoContainer}>
        
        <video
          autoPlay
          muted
          loop
          playsInline
          className={styles.videoBackground}
          poster="/assets/images/frame-hero.jpg"
        >
          <source src="/assets/videos/hero-video-2.mp4" type="video/mp4" />
        </video>
        <div className={styles.videoOverlay} aria-hidden="true" />
      </div>

      {/* Hero Content */}
      <div className={styles.heroContainer}>
        <div className={styles.heroContent}>
          {/* Main Heading */}
          <h1 className={styles.heroTitle}>
            <span className={styles.titleLine1}>¿Estás por comprar</span>
            <span className={styles.titleLine2}>
              un auto usado?
              {/* <span className={styles.brushUnderline} aria-hidden="true" /> */}
            </span>
            {/* Description */}
            <p className={styles.heroDescription}>
              Descubre las fallas que oculta y asegura tu inversión
            </p>
          </h1>

          <div className={styles.queRevisamosSection}>
            {/* CTA Button - Blanco - WhatsApp */}
            <a href="https://wa.link/64579s" target="_blank" rel="noopener noreferrer" className={styles.ctaButton}>
              <span>Agendar inspección ahora</span>
              <ArrowRightIcon />
            </a>

            {/* "¿Qué revisamos?" Button - Negro - Va a planes */}
            <a href="#proceso" className={styles.queRevisamosButton}>
              <Car size={22} weight="fill" color="white" />
              <span>¿Qué revisamos?</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
