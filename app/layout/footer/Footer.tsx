import styles from "./footer.module.css";

export default function Footer() {
  // Keywords SEO - para posicionamiento en buscadores
  const keywords = [
    "diagnosticar",
    "diagnosticar auto usado",
    "diagnosticar auto",
    "diagnosticar auto lima",
    "diagnosticar carro usado",
    "diagnosticar carros",
    "diagnóstico vehicular",
    "diagnóstico de autos usados Lima",
    "diagnóstico vehicular Lima",
    "inspección auto usado Lima",
    "antecedentes vehiculares Perú",
    "comprar auto usado seguro Lima",
    "asesoría para comprar un auto",
    "herramientas diagnóstico vehicular",
    "diagnostico mecánico",
    "inspección y diagnóstico de carros usados",
    "inspección de vehiculos usados",
    "verificacion de antecendes vehiculares",
    "estafas autos usados Lima",
    "SUNARP verificar auto",
    "verificación legal autos Lima",
    "Revisión mecánica",
    "Inspección de autos usados Lima",
    "Verificación legal de autos",
    "Peritaje vehicular Lima",
    "Comprar auto seguro",
    "Detectar choques",
    "Informe vehicular técnico",
    "Escaneo de motor",
    "Gravamen vehicular",
    "Escaneo motor",
    "Inspección vehicular a domicilio",
    "Historial de multas",
    "Fallas mecánicas ocultas",
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Logo - visible en móvil arriba, en desktop dentro de brandColumn */}
        <div className={styles.logoMobile}>
          <img
            src="/assets/images/verificarlo-logo.png"
            alt="VerifiCARLO"
            className={styles.logoImage}
          />
        </div>

        {/* Sección principal */}
        <div className={styles.mainSection}>
          {/* Columna 1: Logo (desktop) + Redes + CTA */}
          <div className={styles.brandColumn}>
            <div className={styles.logoDesktop}>
              <img
                src="/assets/images/verificarlo-logo.png"
                alt="VerifiCARLO"
                className={styles.logoImage}
              />
            </div>
            <div className={styles.socialIcons}>
              <a
                href="https://www.facebook.com/profile.php?id=61577445755386"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <img src="/assets/images/image67.svg" alt="Facebook" />
              </a>
              <a
                href="https://www.instagram.com/verificarlo.peru"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <img src="/assets/images/image68.svg" alt="Instagram" />
              </a>
              <a
                href="https://www.tiktok.com/@verificarlo.peru"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
              >
                <img src="/assets/images/image69.svg" alt="TikTok" />
              </a>
              <a
                href="https://www.linkedin.com/company/107714281"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <img src="/assets/images/image70.svg" alt="LinkedIn" />
              </a>
            </div>
            <a
              href="https://wa.link/64579s"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaButton}
            >
              Agendar inspección ahora
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          {/* Grupo de columnas: Navegación, Planes, Contacto */}
          <div className={styles.columnsGroup}>
            {/* Columna: Navegación */}
            <div className={styles.navColumn}>
              <h4 className={styles.columnTitle}>Navegación</h4>
              <nav className={styles.navLinks}>
                <a href="#inicio">Inicio</a>
                <a href="#planes">Planes</a>
                <a href="#proceso">Proceso</a>
                <a href="#testimonios">Testimonios</a>
                <a href="#blog">Blog</a>
                <a href="#fqas">FQAs</a>
              </nav>
            </div>

            {/* Columna: Planes + Servicios */}
            <div className={styles.plansColumn}>
              <h4 className={styles.columnTitle}>Planes</h4>
              <nav className={styles.navLinks}>
                <a href="#inspeccion-legal">Inspección Legal Express</a>
                <a href="#inspeccion-completa">Inspección Básica</a>
                <a href="#inspeccion-premium" className={styles.premiumLink}>
                  Inspección Premium
                  <span className={styles.popularBadge}>MÁS POPULAR</span>
                </a>
              </nav>
              <h4 className={`${styles.columnTitle} ${styles.servicesTitle}`}>
                Servicios
              </h4>
              <nav className={styles.navLinks}>
                <a href="#gestion-notarial">Gestión notarial</a>
              </nav>
            </div>

            {/* Columna: Contacto */}
            <div className={styles.contactColumn}>
              {/* Línea divisora - solo visible en móvil */}
              <div className={styles.dividerMobile}></div>
              {/* Título Contacto - solo visible en PC */}
              <h4 className={`${styles.columnTitle} ${styles.contactTitle}`}>
                Contacto
              </h4>
              <div className={styles.contactItems}>
                <div className={styles.contactItem}>
                  <div className={styles.contactIcon}>
                    <img src="/assets/images/image64.svg" alt="" />
                  </div>
                  <span>Cerro Azul 421, Santiago de Surco, Lima</span>
                </div>
                <div className={styles.contactItem}>
                  <div className={styles.contactIcon}>
                    <img src="/assets/images/image65.svg" alt="" />
                  </div>
                  <a href="tel:+51934140010">+51 934 140 010</a>
                </div>
                <div className={styles.contactItem}>
                  <div className={styles.contactIcon}>
                    <img src="/assets/images/image66.svg" alt="" />
                  </div>
                  <a href="mailto:verificarlo@carlo.pe">verificarlo@carlo.pe</a>
                </div>
              </div>
              {/* Línea divisora debajo de contacto - solo móvil */}
              <div className={styles.dividerAfterContact}></div>
            </div>
          </div>
        </div>

        {/* Línea divisora arriba de keywords - solo PC */}
        <div className={styles.dividerDesktop}></div>

        {/* Sección de keywords SEO */}
        <div className={styles.keywordsSection}>
          {keywords.map((keyword, index) => (
            <span key={index} className={styles.keyword}>
              {keyword}
              {index < keywords.length - 1 && (
                <span className={styles.separator}>|</span>
              )}
            </span>
          ))}
        </div>

        {/* Línea divisora */}
        <div className={styles.divider}></div>

        {/* Copyright */}
        <div className={styles.copyright}>
          <p>© 2025 Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
