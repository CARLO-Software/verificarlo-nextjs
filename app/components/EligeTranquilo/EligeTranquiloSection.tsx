import styles from './EligeTranquilo.module.css';

export default function EligeTranquiloSection() {
    return (
        <section className={styles['section-background-yellow']}>
            <div className={styles['cta-container']}>
                <h2 className={styles['call-to-action-header']}><strong>Nosotros inspeccionamos</strong>, t&uacute; eliges tranquilo </h2>
                <img src="assets/images/image37.webp" loading="lazy" alt="" className={styles['call-to-action-mobile']} />
                <img src="assets/images/image38.svg" loading="lazy" alt="" className={styles['call-to-action-desktop']} />
                <div className={styles['div-block-5']}><a href="https://wa.link/64579s" target="_blank" className={`${styles['secondary-cta']} w-button`}>Agendar
                    inspecci&oacute;n</a>
                    <div className={styles['frame-427327043']}> <img src="assets/images/image39.webp" loading="lazy" alt="" className={styles['image-11']} /> <img
                        src="assets/images/image40.webp" loading="lazy" alt="" className={styles['image12']} /></div>
                </div>
                <div className={styles['div-block-3']}><img src="assets/images/image41.svg" loading="lazy" alt="" className={styles['image-3']} /></div>
            </div>
            <div className={styles['cta-container-background']}></div>
        </section>
    );
}