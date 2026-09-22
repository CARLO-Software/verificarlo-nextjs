import styles from "./Hero.module.css";

export default function Hero() {
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
          Inspecciones vehiculares profesionales antes de comprar
        </p>

        <div className={styles.heroCtas}>
          <a href="/agendar" className={styles.ctaAgendar}>
            Agendar inspeccion
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h15" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </a>
          <a href="#planes" className={styles.ctaPlanes}>
            Ver planes
          </a>
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
