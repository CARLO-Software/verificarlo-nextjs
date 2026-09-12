"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./ServicesSection.module.css";
import { inspectionPlans, inspectionPlanItems } from "@/prisma/data/inspections";
import { X, Play } from "lucide-react";

type ModalData = {
  title: string;
  description: string;
  price: number;
  items: string[];
  planIndex: number;
  videoId: string | null;
} | null;

const PLAN_VIDEO_IDS: Record<number, string | null> = {
  1: "8PycK5S8CpM",
  2: "z1favRdoTSY",
};

const PLAN_IMAGES = [
  "/assets/images/modal-bg-png.webp",
  "/assets/images/modal-bg-3.webp",
  "/assets/images/modal-bg-2.webp",
];

const CheckIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={styles.checkIcon}
  >
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const ArrowIcon = ({ size = 18, color = "#16171b" }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 12h15" />
    <path d="M13 6l6 6-6 6" />
  </svg>
);

export default function ServicesSection() {
  const [modalData, setModalData] = useState<ModalData>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  const legalPlan = inspectionPlans[0];
  const premiumPlan = inspectionPlans[2];
  const basicaPlan = inspectionPlans[1];
  const premiumItems = inspectionPlanItems.find((ii) => ii.inspectionPlanId === 3);
  const basicaItems = inspectionPlanItems.find((ii) => ii.inspectionPlanId === 2);

  const openModal = (
    plan: typeof inspectionPlans[0],
    items: string[],
    planIndex: number
  ) => {
    setModalData({
      title: plan.title,
      description: plan.landingDescription,
      price: plan.price,
      items,
      planIndex,
      videoId: PLAN_VIDEO_IDS[planIndex] ?? null,
    });
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setModalData(null);
    setIsPlayingVideo(false);
    document.body.style.overflow = "";
  };

  return (
    <section id="planes" className={styles.section} aria-labelledby="planes-heading">
      <div className={styles.container}>
        {/* Banner: Reporte Legal S/29 */}
        <div className={styles.legalBanner}>
          <div className={styles.bannerGlow} aria-hidden="true" />
          <div className={styles.bannerContent}>
            <span className={styles.bannerTitle}>
              Con <span className={styles.bannerPrice}>S/{legalPlan.price}</span> obtén tu
              reporte legal
            </span>
            <span className={styles.bannerDivider} />
            <span className={styles.bannerDesc}>
              Siniestros, gravámenes, papeletas e historial de propietarios. Entrega
              inmediata.
            </span>
          </div>
          <a href="/consultar" className={styles.bannerCta}>
            Obtener mi reporte
            <ArrowIcon />
          </a>
        </div>

        {/* Título de planes mecánicos */}
        <h2 id="planes-heading" className={styles.planesTitle}>
          Complementa tu reporte legal con una revisión mecánica
        </h2>

        {/* ===== Mobile: cards compactas ===== */}
        <div className={styles.mobileCards}>
          <div
            className={`${styles.mobileCard} ${styles.mobileCardFeatured}`}
            onClick={() =>
              openModal(premiumPlan, premiumItems?.label || [], 2)
            }
          >
            <span className={styles.featuredBadge}>MÁS COMPLETA</span>
            <div className={styles.mobileCardInfo}>
              <span className={styles.mobileCardTitle}>Inspección Premium</span>
              <span className={styles.mobileCardDesc}>
                Videoscopía de motor y asesoría de reparación
              </span>
            </div>
            <div className={styles.mobileCardFooter}>
              <div className={styles.mobileCardPrices}>
                <span className={styles.mobileCardPrice}>+S/{premiumPlan.price - legalPlan.price}</span>
                <span className={styles.mobileCardOldPrice}>S/400</span>
              </div>
              <div className={styles.mobileCardMore}>
                Conocer más
                <div className={styles.mobileCardMoreIcon}>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#16171b"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div
            className={styles.mobileCard}
            onClick={() =>
              openModal(basicaPlan, basicaItems?.label || [], 1)
            }
          >
            <div className={styles.mobileCardInfo}>
              <span className={styles.mobileCardTitle}>Inspección Básica</span>
              <span className={styles.mobileCardDesc}>
                200+ puntos, escáner OBD2 y escaneo de pintura
              </span>
            </div>
            <div className={styles.mobileCardFooter}>
              <div className={styles.mobileCardPrices}>
                <span className={styles.mobileCardPrice}>+S/{basicaPlan.price - legalPlan.price}</span>
                <span className={styles.mobileCardOldPrice}>S/350</span>
              </div>
              <div className={styles.mobileCardMore}>
                Conocer más
                <div className={styles.mobileCardMoreIcon}>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#16171b"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Desktop: full plan cards ===== */}
        <div className={styles.desktopGrid}>
          {/* Premium */}
          <div className={`${styles.desktopCard} ${styles.desktopCardFeatured}`}>
            <span className={styles.desktopBadge}>MÁS COMPLETA</span>
            <div className={styles.desktopCardHeader}>
              <span className={styles.desktopCardTitle}>Inspección Premium</span>
            </div>
            <div className={styles.desktopCardPriceRow}>
              <span className={styles.desktopCardPrice}>+S/{premiumPlan.price - legalPlan.price}</span>
              <span className={styles.desktopCardOldPrice}>S/400</span>
              <span className={styles.ofertaBadge}>OFERTA</span>
            </div>
            <div className={styles.desktopCardItems}>
              {premiumItems?.label.map((item, i) => (
                <div key={i} className={styles.desktopCardItem}>
                  <CheckIcon />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className={styles.desktopCardButtons}>
              <a
                href={`/agendar?plan=${premiumPlan.type}`}
                className={styles.desktopCtaPrimary}
              >
                Elegir plan
              </a>
              <button
                type="button"
                className={styles.desktopCtaSecondary}
                onClick={() => {
                  openModal(premiumPlan, premiumItems?.label || [], 2);
                  setIsPlayingVideo(true);
                }}
              >
                <Play size={15} fill="#16171b" stroke="none" />
                Ver video
              </button>
            </div>
          </div>

          {/* Básica */}
          <div className={styles.desktopCard}>
            <div className={styles.desktopCardHeader}>
              <span className={styles.desktopCardTitle}>Inspección Básica</span>
            </div>
            <div className={styles.desktopCardPriceRow}>
              <span className={styles.desktopCardPrice}>+S/{basicaPlan.price - legalPlan.price}</span>
              <span className={styles.desktopCardOldPrice}>S/350</span>
              <span className={styles.ofertaBadge}>OFERTA</span>
            </div>
            <div className={styles.desktopCardItems}>
              {basicaItems?.label.map((item, i) => (
                <div key={i} className={styles.desktopCardItem}>
                  <CheckIcon />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className={styles.desktopCardButtons}>
              <a
                href={`/agendar?plan=${basicaPlan.type}`}
                className={styles.desktopCtaOutline}
              >
                Elegir plan
              </a>
              <button
                type="button"
                className={styles.desktopCtaSecondary}
                onClick={() => {
                  openModal(basicaPlan, basicaItems?.label || [], 1);
                  setIsPlayingVideo(true);
                }}
              >
                <Play size={15} fill="#16171b" stroke="none" />
                Ver video
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal "Saber más" / Video */}
      {modalData && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalWrapper}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalClose}
              onClick={closeModal}
              aria-label="Cerrar modal"
            >
              <X size={20} />
            </button>

            <div className={styles.modalContent}>
              <div
                className={`${styles.modalBackground} ${
                  isPlayingVideo ? styles.modalBackgroundVideo : ""
                }`}
              >
                {isPlayingVideo && modalData.videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${modalData.videoId}?autoplay=1&rel=0`}
                    title="Video del plan"
                    className={styles.modalVideo}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <>
                    <Image
                      src={PLAN_IMAGES[modalData.planIndex]}
                      alt={`Imagen de ${modalData.title}`}
                      className={styles.modalBgImage}
                      fill
                      sizes="(max-width: 768px) 100vw, 600px"
                      quality={75}
                    />
                    <div className={styles.modalBgOverlay} />
                  </>
                )}
              </div>

              {!isPlayingVideo && (
                <button
                  type="button"
                  onClick={() => setIsPlayingVideo(true)}
                  className={styles.btnPlayCircle}
                  aria-label="Ver video"
                >
                  <Play size={16} color="black" fill="black" />
                </button>
              )}

              <div
                className={`${styles.modalBody} ${
                  isPlayingVideo ? styles.modalBodyVideo : ""
                }`}
              >
                <div className={styles.modalHeader}>
                  <h3 className={styles.modalTitle}>{modalData.title}</h3>
                  <p className={styles.modalDescription}>
                    {modalData.description}
                    <span className={styles.modalPriceInline}>
                      {" "}
                      por S/{modalData.price}.
                    </span>
                  </p>
                  <p className={styles.modalPriceDesktop}>S/{modalData.price}</p>
                </div>

                <ul className={styles.modalItemsList}>
                  {modalData.items.map((item, index) => (
                    <li key={index} className={styles.modalItem}>
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={`/agendar?plan=${inspectionPlans[modalData.planIndex]?.type}`}
                  className={styles.modalCta}
                  onClick={closeModal}
                >
                  <span>Elegir este plan</span>
                  <ArrowIcon />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
