import styles from './Benefits.module.css';

export default function BenefitsSection() {
    return (
        <section className={`section ${styles['benefits-section']}`} aria-labelledby="benefits-heading">
            <div className={`container ${styles['benefits-container']}`}>
                <h2 id="benefits-heading" className="sr-only">Beneficios de nuestro servicio</h2>
                <article className={styles['benefits-card']}>
                    <div className={styles['call-to-action-container']}>
                        <img
                            src="assets/images/image31.svg"
                            loading="lazy"
                            alt="Icono de seguridad garantizada"
                            className={styles['benefits-icon']}
                        />
                        <div className={styles['frame-427318944']}>
                            <h3 className={styles['benefits-header']}>Seguridad garantizada</h3>
                            <p className={styles['benefits-description']}>
                                Revisamos que el auto que quieres comprar esté en buenas condiciones para que manejes con tranquilidad.
                            </p>
                        </div>
                    </div>
                    <img
                        src="assets/images/image32.webp"
                        alt="Mecánico inspeccionando vehículo para garantizar seguridad"
                        className={styles['rectangle-1757-mobile']}
                    />
                    <img
                        src="assets/images/image33.webp"
                        alt="Mecánico inspeccionando vehículo para garantizar seguridad"
                        className={styles['rectangle-1757-desktop']}
                    />
                </article>
                <article className={styles['benefits-card']}>
                    <div className={styles['frame-427326988']}>
                        <img
                            src="assets/images/image34.svg"
                            loading="lazy"
                            alt="Icono de detección de fallas"
                            className={styles['benefits-icon']}
                        />
                        <div className={styles['frame-427318944']}>
                            <h3 className={styles['benefits-header']}>Fallas detectadas</h3>
                            <p className={styles['benefits-description']}>
                                Inspeccionamos ruidos, fugas y niveles críticos para alertarte de problemas que podrían pasar
                                desapercibidos al
                                comprar.
                            </p>
                        </div>
                    </div>
                    <img
                        src="assets/images/image35.webp"
                        alt="Técnico detectando fallas en motor de vehículo"
                        className={styles['rectangle-1757-mobile']}
                    />
                    <img
                        src="assets/images/image36.webp"
                        alt="Técnico detectando fallas en motor de vehículo"
                        className={styles['rectangle-1757-desktop']}
                    />
                </article>
            </div>
        </section>
    );
}