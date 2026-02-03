"use client";

import styles from './Hero.module.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Hero() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <header className={styles.heroSection} id="main-content">
            {/* Video Background */}
            <div className={styles.videoContainer}>
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className={styles.videoBackground}
                    poster="assets/images/image12.webp"
                >
                    <source src="assets/videos/hero-video.mp4" type="video/mp4" />
                </video>
                <div className={styles.videoOverlay}></div>
            </div>

            {/* Hero Content */}
            <div className={`${styles.heroContainer} ${isVisible ? styles.visible : ''}`}>
                <div className={styles.heroContent}>
                    {/* Badge */}
                    <div className={styles.heroBadge}>
                        <span className={styles.badgePulse}></span>
                        <span>Inspección Certificada</span>
                    </div>

                    {/* Main Heading */}
                    <h1 className={styles.heroHeading}>
                        <span className={styles.headingLine1}>¿Vas a comprar un</span>
                        <span className={styles.headingHighlight}>auto usado?</span>
                        <span className={styles.headingLine2}>Verifícalo primero</span>
                    </h1>

                    {/* Description */}
                    <p className={styles.heroDescription}>
                        Revisamos más de <strong>200 puntos</strong> en mecánica, estética y documentación legal para que compres con total confianza.
                    </p>

                    {/* Price Section */}
                    <div className={styles.priceSection}>
                        <span className={styles.priceLabel}>Desde</span>
                        <span className={styles.priceAmount}>S/249</span>
                        <span className={styles.priceBadge}>Reporte en 24h</span>
                    </div>

                    {/* CTA Buttons */}
                    <div className={styles.ctaContainer}>
                        <Link href="/vehiculo" className={styles.primaryCta}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Agendar Inspección
                        </Link>
                        <a
                            href="https://wa.me/51934140010?text=Hola,%20quiero%20agendar%20una%20inspección%20vehicular"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.whatsappCta}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            ¿Qué revisamos?
                        </a>
                    </div>

                    {/* Trust Badges */}
                    <div className={styles.trustBadges}>
                        <div className={styles.trustItem}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--bright-sun--400)" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <span>+200 puntos revisados</span>
                        </div>
                        <div className={styles.trustItem}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--bright-sun--400)" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                            <span>Garantía de servicio</span>
                        </div>
                        <div className={styles.trustItem}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--bright-sun--400)" strokeWidth="2">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                <line x1="8" y1="21" x2="16" y2="21"></line>
                                <line x1="12" y1="17" x2="12" y2="21"></line>
                            </svg>
                            <span>Reporte 100% digital</span>
                        </div>
                    </div>
                </div>

                {/* Hero Image (Desktop) */}
                <div className={styles.heroImageContainer}>
                    <img
                        src="assets/images/image12.webp"
                        alt="Auto siendo inspeccionado por profesionales"
                        className={styles.heroImage}
                    />
                    {/* Floating Card */}
                    <div className={styles.floatingCard}>
                        <div className={styles.floatingCardIcon}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </div>
                        <div className={styles.floatingCardText}>
                            <span className={styles.floatingCardTitle}>Reporte Detallado</span>
                            <span className={styles.floatingCardDesc}>Mecánica • Estética • Legal</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className={styles.scrollIndicator}>
                <span>Descubre más</span>
                <div className={styles.scrollArrow}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
        </header>
    );
}
