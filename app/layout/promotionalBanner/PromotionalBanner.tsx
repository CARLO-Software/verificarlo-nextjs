import styles from './PromotionalBanner.module.css';

export default function PromotionalBanner() {
    return (
        <div className={styles['ticker-container']} role="banner" aria-label="Oferta promocional">
            <div data-w-id="94ba9fbc-8785-3683-0f40-b6b8ba5d1ff8" className={styles['ticker-content']}>
                <div className={styles['ticker-item']}>
                    <img src="assets/images/image1.svg" loading="lazy" alt="Icono de oferta" className={`${styles['image-14']} w-full`} />
                    <p className={styles['banner-text']}>
                        Aprovecha nuestro paquete <span className={styles['text-span-9']}>4x3 en la inspección completa</span> y compra seguro
                    </p>
                </div>
                <div className={styles['ticker-item']}>
                    <img src="assets/images/image1.svg" loading="lazy" alt="Icono de oferta" className={`${styles['image-14']} w-full`} />
                    <p className={styles['banner-text']}>
                        Aprovecha nuestro paquete <span className={styles['text-span-9']}>4x3 en la inspección completa</span> y compra seguro
                    </p>
                </div>
                <div className={styles['ticker-item']}>
                    <img src="assets/images/image1.svg" loading="lazy" alt="Icono de oferta" className={`${styles['image-14']} w-full`} />
                    <p className={styles['banner-text']}>
                        Aprovecha nuestro paquete <span className={styles['text-span-9']}>4x3 en la inspección completa</span> y compra seguro
                    </p>
                </div>
                <div className={styles['ticker-item']}>
                    <img src="assets/images/image1.svg" loading="lazy" alt="Icono de oferta" className={`${styles['image-14']} w-full`} />
                    <p className={styles['banner-text']}>
                        Aprovecha nuestro paquete <span className={styles['text-span-9']}>4x3 en la inspección completa</span> y compra seguro
                    </p>
                </div>
                <div className={styles['ticker-item']}>
                    <img src="assets/images/image1.svg" loading="lazy" alt="Icono de oferta" className={`${styles['image-14']} w-full`} />
                    <p className={styles['banner-text']}>
                        Aprovecha nuestro paquete <span className={styles['text-span-9']}>4x3 en la inspección completa</span> y compra seguro
                    </p>
                </div>
            </div>
        </div>
    )
}