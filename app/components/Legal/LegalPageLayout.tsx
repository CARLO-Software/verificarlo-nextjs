import Link from "next/link";
import Image from "next/image";
import styles from "./LegalPageLayout.module.css";

interface LegalPageLayoutProps {
  children: React.ReactNode;
  title: string;
  lastUpdated: string;
}

export default function LegalPageLayout({
  children,
  title,
  lastUpdated,
}: LegalPageLayoutProps) {
  return (
    <div className={styles.container}>
      {/* Header simple */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logoLink}>
            <Image
              src="/assets/images/verificarlo-logo.png"
              alt="VerifiCARLO"
              width={150}
              height={40}
              priority
            />
          </Link>
          <Link href="/" className={styles.backLink}>
            ← Volver al inicio
          </Link>
        </div>
      </header>

      {/* Contenido principal */}
      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.lastUpdated}>
            Última actualización: {lastUpdated}
          </p>
          <div className={styles.body}>{children}</div>
        </div>
      </main>

      {/* Footer simple */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.legalLinks}>
            <Link href="/terminos-y-condiciones">Términos y Condiciones</Link>
            <span className={styles.separator}>•</span>
            <Link href="/politica-de-privacidad">Política de Privacidad</Link>
            <span className={styles.separator}>•</span>
            <Link href="/politica-de-cambios-y-devoluciones">
              Política de Cambios y Devoluciones
            </Link>
          </div>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} VerifiCARLO. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
