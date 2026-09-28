"use client";

import Image from "next/image";
import styles from "./ServicesSection.module.css";

const LOGOS = [
  { src: "/assets/images/image-carrusel-1.png", alt: "SAT Lima" },
  { src: "/assets/images/image-carrusel-2.png", alt: "APESEG" },
  { src: "/assets/images/image-carrusel-3.png", alt: "SUTRAN" },
  { src: "/assets/images/image-carrusel-4.png", alt: "MTC" },
  { src: "/assets/images/image-carrusel-5.png", alt: "SBS" },
  { src: "/assets/images/image-carrusel-6.png", alt: "SUNARP" },
];

export default function ServicesSection() {
  return (
    <section className={styles.section} id="planes">
      {/* Logo carousel */}
      <div className={styles.carouselWrap}>
        <div className={styles.carouselTrack}>
          {[...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS].map((logo, i) => (
            <div className={styles.logoItem} key={i}>
              <Image
                src={logo.src}
                alt={logo.alt}
                width={140}
                height={48}
                className={styles.logoImg}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Heading */}
      <div className={styles.heading}>
        <h2 className={styles.title}>
          <em>Inspección mecánica a domicilio</em>,
          <br />
          hecha por expertos
        </h2>
        <p className={styles.desc}>
          Todas las inspecciones mecánicas incluyen el Reporte Legal Completo.
          Tú eliges el plan que se adapta mejor a lo que necesitas.
        </p>
      </div>

      {/* Plan cards */}
      <div className={styles.plans}>
        {/* Básica */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.planName}>Inspección Básica</h3>
              <p className={styles.planDesc}>
                Lo esencial para descartar fallas mecánicas graves rápidamente.
              </p>
            </div>
            <span className={styles.planPrice}>S/299</span>
          </div>

          <div className={styles.legalBadge}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A6A00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
            <span>Reporte legal <strong>GRATIS</strong></span>
            <span className={styles.legalSave}>Ahorra S/ 19.90</span>
          </div>

          <div className={styles.features}>
            <p className={styles.featuresTitle}>Todo lo del plan Exprés, más:</p>
            <ul className={styles.featureList}>
              <li>Revisión integral de +200 puntos clave.</li>
              <li>Escaneo electrónico de fallas ocultas.</li>
            </ul>
          </div>

          <a href="/agendar" className={styles.ctaDark}>
            Quiero el plan Básico
          </a>
          <a href="#" className={styles.ctaLink}>Saber más</a>
        </div>

        {/* Premium */}
        <div className={`${styles.card} ${styles.cardPremium}`}>
          <span className={styles.badge}>RECOMENDADO</span>

          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.planName}>Inspección Premium</h3>
              <p className={styles.planDesc}>
                Nuestro diagnóstico mecánico más completo para una decisión
                inteligente.
              </p>
            </div>
            <div className={styles.priceWrap}>
              <span className={styles.planPrice}>S/349</span>
              <span className={styles.priceOld}>S/436</span>
              <span className={styles.priceDiscount}>-20%</span>
            </div>
          </div>

          <div className={styles.legalBadge}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A6A00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
            <span>Reporte legal <strong>GRATIS</strong></span>
            <span className={styles.legalSave}>Ahorra S/ 19.90</span>
          </div>

          <div className={styles.features}>
            <p className={styles.featuresTitle}>
              Todo lo del plan Básico, más:
            </p>
            <ul className={styles.featureList}>
              <li>Videoscopía (diagnóstico interno del motor).</li>
              <li>Presupuesto de reparación.</li>
            </ul>
          </div>

          <a href="/agendar" className={styles.ctaYellow}>
            Quiero el plan Premium
          </a>
          <a href="#" className={styles.ctaLink}>Saber más</a>
        </div>
      </div>

      {/* Legal report banner */}
      <div className={styles.legalBanner}>
        <div className={styles.legalBannerContent}>
          <h3 className={styles.legalBannerTitle}>
            Obtén tu <strong>reporte legal por S/19.90</strong>
          </h3>
          <p className={styles.legalBannerDesc}>
            Siniestros, gravámenes, papeletas e historial de propietarios en
            minutos.
          </p>
          <a href="/consultar" className={styles.legalBannerBtn}>
            Solicitar reporte
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h15" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
        <div className={styles.legalBannerImgWrap}>
          <Image
            src="/assets/images/imagen-plan-legal.png"
            alt="Reporte legal VerifiCarlo"
            width={500}
            height={300}
            className={styles.legalBannerImg}
          />
        </div>
      </div>
    </section>
  );
}
