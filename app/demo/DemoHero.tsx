"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./DemoHero.module.css";

function formatPlate(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length <= 3) return clean;
  return clean.slice(0, 3) + "-" + clean.slice(3, 6);
}

function cleanPlate(formatted: string): string {
  return formatted.replace(/-/g, "");
}

const LOGOS = [
  { src: "/assets/images/image-carrusel-1.png", alt: "SAT Lima" },
  { src: "/assets/images/image-carrusel-2.png", alt: "APESEG" },
  { src: "/assets/images/image-carrusel-3.png", alt: "SUTRAN" },
  { src: "/assets/images/image-carrusel-4.png", alt: "MTC" },
  { src: "/assets/images/image-carrusel-5.png", alt: "SBS" },
  { src: "/assets/images/image-carrusel-6.png", alt: "SUNARP" },
];

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
    <>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.videoContainer}>
          <video
            autoPlay muted loop playsInline
            className={styles.video}
            poster="/assets/images/frame-hero.webp"
          >
            <source src="/assets/videos/hero-video-2.mp4" type="video/mp4" />
          </video>
          <div className={styles.overlay} aria-hidden="true" />
        </div>

        <div className={styles.content}>
          {/* Left — title & subtitle */}
          <div className={styles.left}>
            <h1 className={styles.title}>
              Compra tu próximo auto
              <br />
              usado <em>con total
              <br />
              seguridad</em>
            </h1>
            <p className={styles.subtitle}>
              Empieza verificando gratis la placa antes de comprar y evita
              sorpresas con tu inversión.
            </p>
            <a href="#planes" className={styles.ctaPlanes}>
              Conoce nuestros planes
            </a>
          </div>

          {/* Right — plate card */}
          <div className={styles.right}>
            <div className={styles.plateCard}>
              <h2 className={styles.plateTitle}>Consulta la placa gratis aquí</h2>

              <div className={styles.plateInputRow}>
                <div className={styles.flagSection}>
                  <Image src="/assets/images/icons/bandera-peru.png" alt="PE" width={28} height={18} />
                </div>
                <div className={styles.divider} />
                <input
                  type="text"
                  value={plate}
                  onChange={handlePlateChange}
                  onKeyDown={handleKeyDown}
                  placeholder="ABC-123"
                  maxLength={7}
                  autoFocus
                  className={styles.plateInput}
                  aria-label="Número de placa del vehículo"
                />
                <Image src="/assets/images/icons/car.png" alt="" width={22} height={22} className={styles.carIcon} />
              </div>

              <button
                onClick={handleConsultar}
                disabled={!isReady}
                className={`${styles.ctaButton} ${isReady ? styles.ctaReady : styles.ctaDisabled}`}
              >
                Ver historial gratis
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </button>

              {/* Stats */}
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <div className={styles.statIcon}>
                    <Image src="/assets/images/icons/no-perfecto.png" alt="" width={20} height={20} />
                  </div>
                  <span className={styles.statValue}>82%</span>
                  <span className={styles.statLabel}>Autos &quot;perfectos&quot; que ocultaban fallas</span>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statIcon}>
                    <Image src="/assets/images/icons/mecanico.png" alt="" width={20} height={20} />
                  </div>
                  <span className={styles.statValue}>+500</span>
                  <span className={styles.statLabel}>Inspecciones realizadas</span>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statIcon}>
                    <Image src="/assets/images/icons/alcancia.png" alt="" width={20} height={20} />
                  </div>
                  <span className={styles.statValue}>S/8,500</span>
                  <span className={styles.statLabel}>Ahorro promedio por cliente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services section */}
      <section className={styles.servicesSection} id="planes">
        {/* Logo carousel */}
        <div className={styles.carouselWrap}>
          <div className={styles.carouselTrack}>
            {[...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS].map((logo, i) => (
              <div className={styles.logoItem} key={i}>
                <Image src={logo.src} alt={logo.alt} width={140} height={48} className={styles.logoImg} />
              </div>
            ))}
          </div>
        </div>

        {/* Heading */}
        <div className={styles.sectionHeading}>
          <h2 className={styles.sectionTitle}>
            <em>Inspección mecánica a domicilio</em>,
            <br />
            hecha por expertos
          </h2>
          <p className={styles.sectionDesc}>
            Todas las inspecciones mecánicas incluyen el Reporte Legal Completo.
            Tú eliges el plan que se adapta mejor a lo que necesitas.
          </p>
        </div>

        {/* Plan cards */}
        <div className={styles.plans}>
          {/* Básica */}
          <div className={styles.planCard}>
            <div className={styles.planCardHeader}>
              <div>
                <h3 className={styles.planName}>Inspección Básica</h3>
                <p className={styles.planDesc}>
                  Lo esencial para descartar fallas mecánicas graves rápidamente.
                </p>
              </div>
              <span className={styles.planPrice}>S/299</span>
            </div>

            <div className={styles.legalBadge}>
              <span className={styles.legalIcon}><Image src="/assets/images/icons/documento.png" alt="" width={14} height={14} /></span>
              <span>Reporte legal <strong>GRATIS</strong></span>
              <span className={styles.legalSave}>Ahorra S/ 19.90</span>
            </div>

            <div className={styles.features}>
              <p className={styles.featuresTitle}>Incluye:</p>
              <ul className={styles.featureList}>
                <li>Revisión integral de +200 puntos clave.</li>
                <li>Escaneo electrónico de fallas ocultas.</li>
              </ul>
            </div>

            <a href="/agendar" className={styles.ctaDark}>Quiero el plan Básico</a>
            <a href="/agendar?plan=BASIC" className={styles.ctaLink}>Saber más</a>
          </div>

          {/* Premium */}
          <div className={`${styles.planCard} ${styles.planCardPremium}`}>
            <span className={styles.planBadge}>RECOMENDADO</span>

            <div className={styles.planCardHeader}>
              <div>
                <h3 className={styles.planName}>Inspección Premium</h3>
                <p className={styles.planDesc}>
                  Nuestro diagnóstico mecánico más completo para una decisión inteligente.
                </p>
              </div>
              <div className={styles.priceWrap}>
                <span className={styles.planPrice}>S/349</span>
                <span className={styles.priceOld}>S/436</span>
                <span className={styles.priceDiscount}>-20%</span>
              </div>
            </div>

            <div className={styles.legalBadge}>
              <span className={styles.legalIcon}><Image src="/assets/images/icons/documento.png" alt="" width={14} height={14} /></span>
              <span>Reporte legal <strong>GRATIS</strong></span>
              <span className={styles.legalSave}>Ahorra S/ 19.90</span>
            </div>

            <div className={styles.features}>
              <p className={styles.featuresTitle}>Todo lo del plan Básico, más:</p>
              <ul className={styles.featureList}>
                <li>Videoscopía (diagnóstico interno del motor).</li>
                <li>Presupuesto de reparación.</li>
              </ul>
            </div>

            <a href="/agendar?plan=PREMIUM" className={styles.ctaYellow}>Quiero el plan Premium</a>
            <a href="/agendar?plan=PREMIUM" className={styles.ctaLink}>Saber más</a>
          </div>
        </div>
      </section>

      {/* Legal report CTA — mobile */}
      <section className={styles.legalCta}>
        <div className={styles.legalCtaInner}>
          <div className={styles.legalCtaText}>
            <h2 className={styles.legalCtaTitle}>
              Obtén tu <strong>reporte legal por S/19.90</strong>
            </h2>
            <p className={styles.legalCtaDesc}>
              Siniestros, gravámenes, papeletas e historial de propietarios en minutos.
            </p>
            <a href="/consultar" className={styles.legalCtaBtn}>
              Solicitar reporte
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          <div className={styles.legalCtaImg}>
            <Image
              src="/assets/images/imagen-joven-celular.png"
              alt="Joven consultando reporte en su celular"
              width={200}
              height={280}
              className={styles.legalCtaPhoto}
            />
          </div>
        </div>
      </section>
    </>
  );
}
