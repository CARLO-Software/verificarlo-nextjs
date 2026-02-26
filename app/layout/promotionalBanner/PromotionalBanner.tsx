"use client";

import { useState, useEffect } from "react";
import styles from "./PromotionalBanner.module.css";

export default function PromotionalBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isInServicesSection, setIsInServicesSection] = useState(false);

  //   const handleClose = () => {
  //     setIsAnimating(true);
  //     setTimeout(() => {
  //       setIsVisible(false);
  //       // Guardar en sessionStorage para que no aparezca al navegar
  //       sessionStorage.setItem("bannerClosed", "true");
  //     }, 300);
  //   };

  useEffect(() => {
    // Verificar si el usuario ya cerró el banner en esta sesión
    const bannerClosed = sessionStorage.getItem("bannerClosed");
    if (bannerClosed === "true") {
      setIsVisible(false);
    }
  }, []);

  // Escuchar cambios en el atributo data-in-services del documento
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-in-services") {
          const hasAttribute = document.documentElement.hasAttribute("data-in-services");
          setIsInServicesSection(hasAttribute);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-in-services"],
    });

    return () => observer.disconnect();
  }, []);

  // Actualizar CSS variable para que otros componentes sepan la altura del banner
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--banner-height",
      isVisible ? "42px" : "0px",
    );
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className={`${styles.bannerWrapper} ${isAnimating ? styles.bannerHiding : ""} ${isInServicesSection ? styles.bannerFixed : ""}`}
      role="banner"
      aria-label="Oferta promocional"
    >
      <div className={styles.tickerContainer}>
        <div className={styles.tickerContent}>
          <span className={styles.offerIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C10 5 7 7 7 11a5 5 0 0 0 10 0c0-3-2-5-3-7
                    0 2-1 3-2 4-1-2-1-4 0-6z"
                fill="black"
                stroke="black"
                strokeWidth="1.5"
              />
            </svg>
          </span>
          <p className={styles.bannerText}>
            <span className={styles.offerText}>
              <span className={styles.highlight}>Aprovecha el 3x2</span> en la
              inspección Premium
            </span>
          </p>
          <span className={styles.separator}>•</span>
        </div>
      </div>
    </div>
  );
}
