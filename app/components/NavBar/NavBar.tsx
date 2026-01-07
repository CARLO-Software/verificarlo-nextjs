import styles from './NavBar.module.css';

export default function NavBar() {
    return (
        <nav className={styles['navbar']} role="navigation" aria-label="Navegación principal">
            <div className={`w-layout-blockcontainer container ${styles['nav-container']} w-container`}>
                <div className="div-block">
                    <img loading="lazy" src="assets/images/image6.svg" alt="Logo VerifiCARLO" className="image-9" />
                </div>
                <div className={styles['navbar-box']}>
                    <div className={styles['navbar-item']}>
                        <div className={styles['icon']} aria-hidden="true">
                            <img loading="lazy" src="assets/images/image7.svg" alt="" />
                        </div>
                        <p className={styles['navbar-text']}>Cerro Azul 421, Santiago de Surco, Lima</p>
                    </div>
                    <div className={styles['navbar-item']}>
                        <div className={styles['icon']} aria-hidden="true">
                            <img loading="lazy" src="assets/images/image8.svg" alt="" />
                        </div>
                        <p className={styles['navbar-text']}>Teléfono +51 934 140 010</p>
                    </div>
                    <a
                        href="https://wa.link/64579s"
                        target="_blank"
                        className={`${styles['secondary-cta']} w-button`}
                        aria-label="Agendar inspección por WhatsApp"
                    >
                        Agendar inspección
                    </a>
                </div>
            </div>
        </nav>
    );
}