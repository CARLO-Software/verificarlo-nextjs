import styles from './Hero.module.css';
import Link from 'next/link'

export default function Hero() {
    return (
        <header className={`${styles["section"]} ${styles['hero-section']}`} id="main-content">
            <div className={`w-layout-blockcontainer ${styles["container"]} ${styles['hero-container']} w-container`}>
                <div className={styles['hero-left']}>
                    <div className={styles['hero-row-1']}>
                        <h1 className={styles['hero-heading']}>
                            <strong>¿Estás por comprar un auto</strong> de segunda mano?
                        </h1>
                        <p className={styles['hero-description']}>
                            ¡Verifícalo antes de comprarlo! revisamos más de 200 puntos en la mecánica, estética y legal.
                        </p>
                    </div>
                    <div className={styles['hero-row-2']}>
                        <p className={styles['hero-label']}>Verifícalo desde</p>
                        <p className={styles['hero-price']} aria-label="Precio desde 249 soles">S/249</p>
                    </div>
                    <Link
                        href="/vehiculo"
                        className={`${styles['primary-cta']} ${styles['hero-cta']} w-button`}
                        rel="noopener noreferrer"
                        aria-label="Agendar inspección por WhatsApp"
                    >
                        Agendar inspección
                    </Link>
                </div>
                <div className={styles['hero-mobile']} aria-hidden="true">
                    <img src="assets/images/image9.webp" alt="Auto siendo inspeccionado" className={styles['image-hero-car']} />
                    <img src="assets/images/image10.webp" alt="" className={styles['image-hero-shape']} />
                    <img src="assets/images/image11.webp" alt="Logos de certificación" className={styles['image-hero-logos']} />
                </div>
                <div className={styles['hero-desktop']} aria-hidden="true">
                    <img src="assets/images/image12.webp" alt="Auto siendo inspeccionado" className={styles['image-7']} />
                </div>
            </div>
        </header>
    );
}