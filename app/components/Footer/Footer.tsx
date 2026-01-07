import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={`section ${styles['primary-background']}`}>
            <div className={styles['div-block-4']}>
                <div className={`w-layout-blockcontainer container ${styles['footer-container']} w-container`}>
                    <div className={styles['footer-row-1']}>
                        <div className={styles['footer-left']}>
                            <div className={styles['div-block-6']}><img src="assets/images/image63.svg" loading="lazy" alt="" className={styles['image-12']} /></div>
                            <div className={styles['footer-box-inner-1']}>
                                <div className={styles['footer-item']}>
                                    <div className={styles['icon']}><img src="assets/images/image64.svg" loading="lazy" alt="" /></div>
                                    <p className={styles['footer-text']}>Cerro Azul 421, Santiago de
                                        Surco, Lima</p>
                                </div>
                                <div className={styles['footer-item']}>
                                    <div className={styles['icon']}><img src="assets/images/image65.svg" loading="lazy" alt="" /></div>
                                    <div className="w-layout-vflex">
                                        <p className={styles['footer-text']}><a href="tel:+51934140010" className={styles['link']}>+51 934 140 010</a></p>
                                    </div>
                                </div>
                                <div className={styles['footer-item']}>
                                    <div className={styles['icon']}><img src="assets/images/image66.svg" loading="lazy" alt="" className={styles['material-symbols-lightmail-outline']} />
                                    </div>
                                    <div className="w-layout-vflex">
                                        <p className={styles['footer-text']}><a href="mailto:verificarlo@carlo.pe?subject=Hola"
                                            className={styles['link']}>verificarlo@carlo.pe</a></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles['footer-right']}>
                            <div className={styles['footer-box-inner-2']}>
                                <h4 className={styles['footer-heading']}>Tu seguridad empieza con una buena decisi&oacute;n.</h4>
                                <p className={styles['footer-description']}>Verifica el auto usado que quieres comprar con profesionales expertos.</p>
                            </div>
                            <a href="https://wa.link/64579s" target="_blank" className={`${styles['primary-cta']} w-button`}
                                aria-label="Agendar inspección por WhatsApp">
                                Agendar inspecci&oacute;n
                            </a>

                        </div>
                    </div>
                    <div className={styles['footer-row-2']}>
                        <p className={styles['_2025-todos-los-derechos-reservados']}>
                            &copy; 2025 Todos los derechos reservados.
                        </p>
                        <div className={styles['list']}>
                            <a href="https://www.facebook.com/profile.php?id=61577445755386" target="_blank" className="w-inline-block">
                                <img src="assets/images/image67.svg" loading="lazy" alt="Facebook" />
                            </a>
                            <a href="https://www.instagram.com/verificarlo.peru?igsh=NzllN2JrbWI5MXVm&amp;utm_source=qr" target="_blank"
                                className="w-inline-block">
                                <img src="assets/images/image68.svg" loading="lazy" alt="Instagram" />
                            </a>
                            <a href="https://www.tiktok.com/@verificarlo.peru?_t=ZM-8xHtDLk63fy&amp;_r=1" target="_blank" className="w-inline-block">
                                <img src="assets/images/image69.svg" loading="lazy" alt="TikTok" />
                            </a>
                            <a href="https://www.linkedin.com/company/107714281/admin/dashboard" target="_blank" className="w-inline-block">
                                <img src="assets/images/image70.svg" loading="lazy" alt="LinkedIn" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}