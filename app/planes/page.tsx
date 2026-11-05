"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Planes.module.css";

export default function PlanesPage() {
  const [videoOpen, setVideoOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleCard = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openVideo = () => {
    setVideoOpen(true);
  };

  const closeVideo = () => {
    setVideoOpen(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Asegura tu inversión con nuestros{" "}
              <strong>planes de verificación.</strong>
            </h1>
            <p className={styles.heroSubtitle}>
              <strong>¿Cómo revisamos tu auto?</strong> Mira a nuestros expertos en acción
            </p>
          </div>
          <div className={styles.heroVideoWrap} onClick={openVideo}>
            <video
              className={styles.heroVideoThumb}
              poster="/assets/images/frame-hero.webp"
              muted
              playsInline
              loop
              autoPlay
            >
              <source src="/assets/videos/hero-video-2.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* Video modal */}
      {videoOpen && (
        <div className={styles.videoOverlay} onClick={closeVideo}>
          <div className={styles.videoModal} onClick={e => e.stopPropagation()}>
            <button className={styles.videoClose} onClick={closeVideo} aria-label="Cerrar video">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <video
              ref={videoRef}
              className={styles.videoPlayer}
              controls
              autoPlay
              playsInline
            >
              <source src="/assets/videos/hero-video-2.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      )}

      {/* Plans grid */}
      <section className={styles.plansSection}>
        <div className={styles.plansGrid}>
          {/* Reporte Legal */}
          <div className={styles.planCard}>
            <div className={styles.planBody}>
              <h2 className={styles.planName}>Reporte Legal</h2>
              <p className={styles.planDesc}>
                Obtén el historial legal completo del vehículo. Pago único,
                seguro y con entrega inmediata.
              </p>

              <button className={styles.includesToggle} onClick={() => toggleCard("legal")}>
                ¿Qué incluye?
              </button>
              <ul className={`${styles.featureList} ${expandedCards.legal ? styles.showMobile : ""}`}>
                <li>
                  <CheckIcon /> Datos Técnicos de SUNARP
                </li>
                <li>
                  <CheckIcon /> Historial de propietarios
                </li>
                <li>
                  <CheckIcon /> SOAT
                </li>
                <li>
                  <CheckIcon /> Revelar siniestros ocultos
                </li>
                <li>
                  <CheckIcon /> Verificar gravámenes activos
                </li>
                <li>
                  <CheckIcon /> Revisar papeletas impagas
                </li>
                <li>
                  <CheckIcon /> Conocer a los dueños anteriores
                </li>
              </ul>
            </div>

            <div className={styles.planFooter}>
              <span className={styles.planPrice}>S/19.90</span>
              <Link href="/consultar" className={styles.planBtn}>
                Elegir este plan
              </Link>
            </div>
          </div>

          {/* Inspección Básica */}
          <div className={`${styles.planCard} ${styles.planCardBasica}`}>
            <div className={styles.planBody}>
              <h2 className={styles.planName}>Inspección Básica</h2>
              <p className={styles.planDesc}>
                Revisión mecánica de +200 puntos con escaneo profesional y
                verificación legal.
              </p>

              <button className={styles.includesToggle} onClick={() => toggleCard("basica")}>
                ¿Qué incluye?
              </button>
              <p className={`${styles.includesLabel} ${expandedCards.basica ? styles.showMobile : ""}`}>
                Todo lo del plan Legal, más:
              </p>
              <ul className={`${styles.featureList} ${expandedCards.basica ? styles.showMobile : ""}`}>
                <li>
                  <CheckIcon /> Revisión mecánica (200+ puntos de verificación)
                </li>
                <li>
                  <CheckIcon /> Escáner Profesional (motor, caja, airbags, ABS,
                  módulos)
                </li>
                <li>
                  <CheckIcon /> Escaneo de pintura y carrocería (choques)
                </li>
                <li>
                  <CheckIcon /> Aprobación o desaprobación verbal
                </li>
              </ul>

              <div className={styles.legalBadge}>
                <span className={styles.legalIcon}>
                  <Image
                    src="/assets/icons/vista-previa-reporte-legal/documento.svg"
                    alt=""
                    width={16}
                    height={16}
                  />
                </span>
                <span>
                  Reporte legal <strong>GRATIS</strong>
                </span>
                <span className={styles.legalSave}>Ahorra S/ 19.90</span>
              </div>
            </div>

            <div className={styles.planFooter}>
              <span className={styles.planPrice}>S/299</span>
              <Link href="/agendar?plan=basica" className={styles.planBtn}>
                Elegir este plan
              </Link>
            </div>
          </div>

          {/* Inspección Premium */}
          <div className={`${styles.planCard} ${styles.planCardPremium}`}>
            <span className={styles.recommendedBadge}>RECOMENDADO</span>
            <div className={styles.planBody}>
              <h2 className={styles.planName}>Inspección Premium</h2>
              <p className={styles.planDesc}>
                La verificación más completa y detallada del mercado que incluye
                videoscopía y asesoría.
              </p>

              <button className={styles.includesToggle} onClick={() => toggleCard("premium")}>
                ¿Qué incluye?
              </button>
              <p className={`${styles.includesLabel} ${expandedCards.premium ? styles.showMobile : ""}`}>
                Todo lo del plan Básico, más:
              </p>
              <ul className={`${styles.featureList} ${expandedCards.premium ? styles.showMobile : ""}`}>
                <li>
                  <CheckIcon /> Videoscopía (diagnóstico interno del motor).
                </li>
                <li>
                  <CheckIcon /> Presupuesto de reparación.
                </li>
              </ul>

              <div className={styles.legalBadge}>
                <span className={styles.legalIcon}>
                  <Image
                    src="/assets/icons/vista-previa-reporte-legal/documento.svg"
                    alt=""
                    width={16}
                    height={16}
                  />
                </span>
                <span>
                  Reporte legal <strong>GRATIS</strong>
                </span>
                <span className={styles.legalSave}>Ahorra S/ 19.90</span>
              </div>
            </div>

            <div className={styles.planFooter}>
              <div className={styles.priceGroup}>
                <span className={styles.planPrice}>S/349</span>
                <div className={styles.priceSubline}>
                  <span className={styles.priceOld}>S/437</span>
                  <span className={styles.priceDiscount}>-20%</span>
                </div>
              </div>
              <Link href="/agendar?plan=completa" className={styles.planBtn}>
                Elegir este plan
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFD700"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.checkIcon}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
