import { Slider } from "@/utils/Slider"
import styles from './ProcessSection.module.css'
import Image from "next/image"

export default function ProcessSection() {

    const listaProcesos = [
        {
            id: 1,
            src: "/assets/images/image13.webp",
            alt: "Técnico verificando más de 200 puntos clave del vehículo",
            titulo: "Verificamos +200 puntos clave",
            descripcion: "Comprende una revisión mecánica, estética y legal del auto usado que quieres comprar."
        },
        {
            id: 2,
            src: "/assets/images/image14.webp",
            alt: "Entrega de informe detallado de inspección",
            titulo: "Te entregamos un informe detallado",
            descripcion: "Que incluye: motor, caja, carrocería, pintura, chasis, suspensión, frenos, y otros."
        },
        {
            id: 3,
            src: "/assets/images/image15.webp",
            alt: "Profesional dando opciones y presupuesto de reparaciones",
            titulo: "Te damos opciones y presupuesto",
            descripcion: "Si encontramos problemas, te brindamos soluciones y costos estimados para su reparación."
        },
        {
            id: 4,
            src: "/assets/images/image16.webp",
            alt: "Procurador notarial asistiendo con la gestión de documentos",
            titulo: "Te ayudamos con la gestión notarial",
            descripcion: "En 1 hora un procurador de la notaría va a tu domicilio a tomarte las firmas."
        },
    ]

    return (<section id="proceso" className={`${styles["section"]} ${styles['process-section']}`} aria-labelledby="process-heading">
        <div className={`w-layout-blockcontainer container ${styles['process-container']} w-container`}>
            <h2 id="process-heading" className={styles['heading-3']}>
                <strong>Nuestro</strong> proceso
            </h2>
            <Slider metodoSlider={"proceso-inspeccion"}>
                <div className={styles['process-slider']} role="group" aria-label="Proceso de inspección">
                    <div className="splide__track">
                        <ul className="splide__list">

                            {listaProcesos.map(proceso => (
                                <li key={proceso.id} className="splide__slide">
                                    <div className={styles['process-card']}>
                                        <Image
                                            src={proceso.src}
                                            alt={proceso.alt}
                                            fill
                                            sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                            className={styles['process-image']}
                                            loading="lazy"
                                        />
                                        <div className={styles['process-box']}>
                                            <div className={styles['process-box-container']}>
                                                <div className={styles['process-box-flex']}>
                                                    <div className={styles['process-card-label']} aria-label={`Paso número ${proceso.id}`}>#{proceso.id}</div>
                                                    <h3 className={styles['process-card-heading']}>{proceso.titulo}</h3>
                                                </div>
                                                <p className={styles['process-card-text']}>
                                                    {proceso.descripcion}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}

                        </ul>
                    </div>
                </div>
            </Slider>
        </div>
    </section>
    )
}