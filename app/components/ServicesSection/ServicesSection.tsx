import { Slider } from "../../services/Slider";
import styles from './ServicesSection.module.css';

export default function ServicesSection() {
    return (
        <section className={`${styles["section-background"]} ${styles['services-section']}`} aria-labelledby="services-heading">
            <div className={`w-layout-blockcontainer ${styles["container"]} ${styles['services-container']} w-container`}>
                <div className={styles['services-div']}>
                    <h2 id="services-heading" className={styles['heading-2']}>
                        <strong>Elige la inspección para tu</strong> próximo auto seminuevo
                    </h2>
                </div>
                <Slider metodoSlider="servicios">
                    <div className={styles['services-slider-div']} role="group" aria-label="Servicios de inspección">
                        <div className="splide__track" style={{ paddingLeft: "20px", paddingRight: "20px" }}>
                            <ul className="splide__list" style={{ alignItems: "center" }}>


                                <li className="splide__slide">
                                    <article className={`${styles['services-card']} ${styles['services-card-first']}`}>
                                        <div className={styles['services-box']}>
                                            <header className={styles['card-header']}>
                                                <h3 className={styles['header-title']}>Inspección Legal</h3>
                                                <p className={styles['card-description']}>
                                                    Ideal para quienes saben de mecánica y quieren complementar con la verificación legal.
                                                </p>
                                            </header>
                                            <p className={styles['card-price']} aria-label="Precio 49 soles">S/ 49</p>
                                            <div className={styles['feature-container']}>
                                                <h4 className={styles['feature-header']}>Incluye:</h4>
                                                <ul className={styles['feature-items-container']} role="list">
                                                    <li className={styles['feature-item']} role="listitem">
                                                        <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className={styles['icons']} aria-hidden="true" />
                                                        <span className={styles['feature-item-text']}>Siniestros reportados</span>
                                                    </li>
                                                    <li className={styles['feature-item']} role="listitem">
                                                        <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className={styles['icons']} aria-hidden="true" />
                                                        <span className={styles['feature-item-text']}>Revisión de Gravámenes y Papeletas</span>
                                                    </li>
                                                    <li className={styles['feature-item']} role="listitem">
                                                        <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className={styles['icons']} aria-hidden="true" />
                                                        <span className={styles['feature-item-text']}>Historial de propietarios</span>
                                                    </li>
                                                    <li className={styles['feature-item']} role="listitem">
                                                        <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className={styles['icons']} aria-hidden="true" />
                                                        <span className={styles['feature-item-text']}>Boleta informativa</span>
                                                    </li>
                                                    <li className={styles['feature-item']} role="listitem">
                                                        <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className={styles['icons']} aria-hidden="true" />
                                                        <span className={styles['feature-item-text']}>Otros puntos</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        <a href="https://wa.me/51934140010?text=%C2%A1Hola!%20Deseo%20coordinar%20la%20Inspecci%C3%B3n%20Legal.%20Quisiera%20agendar%20y%20recibir%20informaci%C3%B3n.%E2%9C%85%F0%9F%9A%98"
                                            target="_blank" className={`${styles['primary-cta']} ${styles['_w-full']}`} aria-label="Solicitar inspección legal">
                                            Solicitar inspección legal
                                        </a>
                                    </article>
                                </li>
                                <li className="splide__slide">
                                    <article className={`${styles['services-card']} ${styles['services-card-middle']}`}>
                                        <div className={styles['services-box']}>
                                            <header className={styles['card-header']}>
                                                <h3 className={styles['header-title']}>Inspección BÁSICA</h3>
                                                <p className={styles['card-description']}>
                                                    Revisamos los puntos clave en la mecánica, estética y legal del carro que quieres comprar.
                                                </p>
                                            </header>
                                            <p className={`${styles['card-price']} ${styles['s-27900']}`} aria-label="Precio 249 soles">S/ 249</p>
                                            <div className={styles['feature-container']}>
                                                <h4 className={styles['feature-header']}>Incluye:</h4>
                                                <ul className={styles['feature-items-container']} role="list">
                                                    <li className={styles['feature-item']} role="listitem">
                                                        <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className={styles['icons']} aria-hidden="true" />
                                                        <span className={styles['feature-item-text']}>
                                                            Todo sobre <span className={styles['text-span']}>revisión legal</span>
                                                        </span>
                                                    </li>
                                                    <li className={styles['feature-item']} role="listitem">
                                                        <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className={styles['icons']} aria-hidden="true" />
                                                        <span className={styles['feature-item-text']}>
                                                            Revisión mecánica (200+ puntos de verificación)
                                                        </span>
                                                    </li>
                                                    <li className={styles['feature-item']} role="listitem">
                                                        <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className={styles['icons']} aria-hidden="true" />
                                                        <span className={styles['feature-item-text']}>
                                                            Escáner Profesional (motor, caja, airbags, ABS, módulos)
                                                        </span>
                                                    </li>
                                                    <li className={styles['feature-item']} role="listitem">
                                                        <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className={styles['icons']} aria-hidden="true" />
                                                        <span className={styles['feature-item-text']}>
                                                            Escaneo de pintura y carrocería (choques)
                                                        </span>
                                                    </li>
                                                    <li className={styles['feature-item']} role="listitem">
                                                        <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className={styles['icons']} aria-hidden="true" />
                                                        <span className={styles['feature-item-text']}>
                                                            Aprobación o desaprobación verbal
                                                        </span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        <a href="https://wa.me/51934140010?text=%C2%A1Hola!%20Deseo%20coordinar%20la%20Inspecci%C3%B3n%20B%C3%A1sica.%20Quisiera%20agendar%20y%20recibir%20informaci%C3%B3n.%E2%9C%85%F0%9F%9A%98"
                                            target="_blank" className={`${styles['primary-cta']} ${styles['_w-full']} w-button`} aria-label="Elegir inspección básica">
                                            Elegir inspección básica
                                        </a>
                                    </article>
                                </li>
                                <li className="splide__slide">
                                    <article className={`${styles['services-card']} ${styles['services-card-last']}`}>
                                        <div className={styles['services-box']}>
                                            <header className={styles['card-header']}>
                                                <h3 className={styles['header-title']}>Inspección COMPLETA</h3>
                                                <p className={styles['card-description']}>
                                                    Para quienes buscan verificar hasta el alma del carro. Incluye soporte en el trámite notarial.
                                                </p>
                                            </header>


                                            <div className={styles['price-container']} style={{
                                                display: 'flex',
                                                justifyContent: "space-between",
                                                alignItems: "center", width: "100%"
                                            }} >
                                                <p className={`${styles['card-price']} ${styles['s-27900']}`} aria-label="Precio 299 soles">S/ 299</p>
                                                <span className={styles['badge-popular']} aria-label="Más popular">POPULAR</span>
                                            </div>
                                            <div className={styles['feature-container']}>
                                                <h4 className={styles['feature-header']}>Incluye:</h4>
                                                <ul className={styles['feature-items-container']} role="list">
                                                    <li className={styles['feature-item']} role="listitem">
                                                        <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className={styles['icons']} aria-hidden="true" />
                                                        <span className={styles['feature-item-text']}>
                                                            Toda la <span className={styles['text-span']}>inspección básica</span>
                                                        </span>
                                                    </li>
                                                    <li className={styles['feature-item']} role="listitem">
                                                        <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className={styles['icons']} aria-hidden="true" />
                                                        <span className={styles['feature-item-text']}>
                                                            Videoscopía completa del motor y zonas críticas
                                                        </span>
                                                    </li>
                                                    <li className={styles['feature-item']} role="listitem">
                                                        <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className={styles['icons']} aria-hidden="true" />
                                                        <span className={styles['feature-item-text']}>
                                                            Asesoría en presupuesto de reparación
                                                        </span>
                                                    </li>
                                                    <li className={styles['feature-item']} role="listitem">
                                                        <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className={styles['icons']} aria-hidden="true" />
                                                        <span className={styles['feature-item-text']}>
                                                            Informe técnico y legal documentado
                                                        </span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        <a href="https://wa.me/51934140010?text=%C2%A1Hola!%20Deseo%20coordinar%20la%20Inspecci%C3%B3n%20Completa.%20Quisiera%20agendar%20y%20recibir%20informaci%C3%B3n.%E2%9C%85%F0%9F%9A%98"
                                            target="_blank" className={`${styles['primary-cta']} ${styles['_w-full']} w-button`} aria-label="Elegir inspección completa">
                                            Elegir inspección completa
                                        </a>
                                    </article>
                                </li>
                            </ul>
                        </div>
                    </div>
                </Slider>
            </div>
        </section >
    );
}

