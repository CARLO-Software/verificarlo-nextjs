import { Slider } from "../../services/Slider"
import styles from './ProcessSection.module.css'

export default function ProcessSection() {
    return (<section className={`${styles["section"]} ${styles['process-section']}`} aria-labelledby="process-heading">
        <div className={`w-layout-blockcontainer container ${styles['process-container']} w-container`}>
            <h2 id="process-heading" className={styles['heading-3']}>
                <strong>Nuestro</strong> proceso
            </h2>
            <Slider metodoSlider={"proceso-inspeccion"}>
                <div className={styles['process-slider']} role="group" aria-label="Proceso de inspección">
                    <div className="splide__track">
                        <ul className="splide__list">
                            <li className="splide__slide">
                                <div className={styles['process-card']}>
                                    <img src="assets/images/image13.webp" alt="Técnico verificando más de 200 puntos clave del vehículo"
                                        className={styles['process-image']} />
                                    <div className={styles['process-box']}>
                                        <div className={styles['process-box-container']}>
                                            <div className={styles['process-box-flex']}>
                                                <div className={styles['process-card-label']} aria-label="Paso número 1">#1</div>
                                                <h3 className={styles['process-card-heading']}>Verificamos +200 puntos clave</h3>
                                            </div>
                                            <p className={styles['process-card-text']}>
                                                Comprende una revisión mecánica, estética y legal del auto usado que quieres comprar.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </li>
                            <li className="splide__slide">
                                <div className={styles['process-card']}>
                                    <img src="assets/images/image14.webp" alt="Entrega de informe detallado de inspección" className={styles['process-image']} />
                                    <div className={styles['process-box']}>
                                        <div className={styles['process-box-container']}>
                                            <div className={styles['process-box-flex']}>
                                                <div className={styles['process-card-label']} aria-label="Paso número 2">#2</div>
                                                <h3 className={styles['process-card-heading']}>Te entregamos un informe detallado</h3>
                                            </div>
                                            <p className={styles['process-card-text']}>
                                                Que incluye: motor, caja, carrocería, pintura, chasis, suspensión, frenos, y otros.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </li>
                            <li className="splide__slide">
                                <div className={styles['process-card']}>
                                    <img src="assets/images/image15.webp" alt="Profesional dando opciones y presupuesto de reparaciones"
                                        className={styles['process-image']} />
                                    <div className={styles['process-box']}>
                                        <div className={styles['process-box-container']}>
                                            <div className={styles['process-box-flex']}>
                                                <div className={styles['process-card-label']} aria-label="Paso número 3">#3</div>
                                                <h3 className={styles['process-card-heading']}>Te damos opciones y presupuesto</h3>
                                            </div>
                                            <p className={styles['process-card-text']}>
                                                Si encontramos problemas, te brindamos soluciones y costos estimados para su reparación.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </li>
                            <li className="splide__slide">
                                <div className={styles['process-card']}>
                                    <img src="assets/images/image16.webp" alt="Procurador notarial asistiendo con la gestión de documentos"
                                        className={styles['process-image']} />
                                    <div className={styles['process-box']}>
                                        <div className={styles['process-box-container']}>
                                            <div className={styles['process-box-flex']}>
                                                <div className={styles['process-card-label']} aria-label="Paso número 4">#4</div>
                                                <h3 className={styles['process-card-heading']}>Te ayudamos con la gestión notarial</h3>
                                            </div>
                                            <p className={styles['process-card-text']}>
                                                En 1 hora un procurador de la notaría va a tu domicilio a tomarte las firmas.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </Slider>
        </div>
    </section>
    )
}