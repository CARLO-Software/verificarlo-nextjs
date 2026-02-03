"use client";

import { useState, useEffect } from 'react';
import styles from './PromotionalBanner.module.css';

export default function PromotionalBanner() {
    const [isVisible, setIsVisible] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClose = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setIsVisible(false);
            // Guardar en sessionStorage para que no aparezca al navegar
            sessionStorage.setItem('bannerClosed', 'true');
        }, 300);
    };

    useEffect(() => {
        // Verificar si el usuario ya cerró el banner en esta sesión
        const bannerClosed = sessionStorage.getItem('bannerClosed');
        if (bannerClosed === 'true') {
            setIsVisible(false);
        }
    }, []);

    // Actualizar CSS variable para que otros componentes sepan la altura del banner
    useEffect(() => {
        document.documentElement.style.setProperty(
            '--banner-height',
            isVisible ? '42px' : '0px'
        );
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div
            className={`${styles.bannerWrapper} ${isAnimating ? styles.bannerHiding : ''}`}
            role="banner"
            aria-label="Oferta promocional"
        >
            <div className={styles.tickerContainer}>
                <div className={styles.tickerContent}>
                    {[...Array(5)].map((_, index) => (
                        <div key={index} className={styles.tickerItem}>
                            <span className={styles.offerIcon}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                                          fill="var(--bright-sun--400)" stroke="var(--bright-sun--400)" strokeWidth="2"/>
                                </svg>
                            </span>
                            <p className={styles.bannerText}>
                                Aprovecha nuestro paquete <span className={styles.highlight}>4x3 en la inspección completa</span> y compra seguro
                            </p>
                            <span className={styles.separator}>•</span>
                        </div>
                    ))}
                </div>
            </div>

            <button
                className={styles.closeButton}
                onClick={handleClose}
                aria-label="Cerrar banner promocional"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    );
}
