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
            <img src="assets/icons/fueguito.svg" alt="iconito" />
          </span>
          <p className={styles.bannerText}>
            <span className={styles.offerText}>
              <span className={styles.highlight}> Aprovecha el 3x2</span> en la
              inspección Premium
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
