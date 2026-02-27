"use client";

import { useState } from "react";
import { Slider, SliderControls } from "@/utils/Slider"
import styles from './ProcessSection.module.css'
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProcessSection() {
    const [sliderControls, setSliderControls] = useState<SliderControls | null>(null);

    const listaProcesos = [
        {
            id: 1,
            src: "/assets/images/modal-bg.svg",
            alt: "Inspección de +200 puntos",
            titulo: "Inspección de +200 puntos",
            descripcion: "Revisión mecánica, estética y legal completa para asegurar que eI auto esté en perfectas condiciones."
        },
        {
            id: 2,
            src: "/assets/images/segunda-foto.png",
            alt: "Te entregamos un informe detallado",
            titulo: "Te entregamos un informe detallado",
            descripcion: "Recibe un reporte técnico de motor, caja, chasis y suspensión. Transparencia total sobre el estado real."
        },
        {
            id: 3,
            src: "/assets/images/tercera-foto.jpg",
            alt: "Presupuesto de reparaciones",
            titulo: "Presupuesto de reparaciones",
            descripcion: "Si hallamos fallas, te damos soluciones y costos estimados para que decidas con la información clara."
        },
        {
            id: 4,
            src: "/assets/images/cuarta-foto.png",
            alt: "Gestión notarial a docimicilio",
            titulo: "Gestión notarial a docimicilio",
            descripcion: "Firmamos en I hora. Un procurador va a donde estés para formalizar la compra sin que pierdas tiempo."
        },
    ]

    return (<section id="proceso" className={`${styles["section"]} ${styles['process-section']}`} aria-labelledby="process-heading">
        <div className={`w-layout-blockcontainer container ${styles['process-container']} w-container`}>
            <h2 id="process-heading" className={styles['heading-3']}>
                <span className={styles['process-heading-span']}>¿Por qué elegir</span> Verificarlo
                <p className={styles['process-subheading']}>Solo necesitas 1 hora para saber si ese auto vale la pena</p>
            </h2>
            <Slider metodoSlider={"proceso-inspeccion"} onControlsReady={setSliderControls}>
                <div className={styles['process-slider']} role="group" aria-label="Proceso de inspección">
                    <div className="splide__track">
                        <ul className="splide__list">

                            {listaProcesos.map(proceso => (
                                <li key={proceso.id} className="splide__slide">
                                    <div className={styles['process-card']}>
                                        <Image
                                            src={proceso.src}
                                            alt={proceso.alt}
                                            width={800}
                                            height={450}
                                            className={styles['process-image']}
                                        />
                                        <div className={styles['process-box']}>
                                            <div className={styles['process-box-container']}>
                                                <div className={styles['process-box-flex']}>
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

            {/* Flechas de navegación - solo móvil */}
            <div className={styles['carousel-arrows-mobile']}>
                <button
                    type="button"
                    className={`${styles['carousel-arrow']} ${sliderControls?.isAtStart ? styles['carousel-arrow-disabled'] : styles['carousel-arrow-active']}`}
                    onClick={() => sliderControls?.goPrev()}
                    disabled={sliderControls?.isAtStart}
                    aria-label="Slide anterior"
                >
                    <ChevronLeft size={20} />
                </button>
                <button
                    type="button"
                    className={`${styles['carousel-arrow']} ${sliderControls?.isAtEnd ? styles['carousel-arrow-disabled'] : styles['carousel-arrow-active']}`}
                    onClick={() => sliderControls?.goNext()}
                    disabled={sliderControls?.isAtEnd}
                    aria-label="Slide siguiente"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    </section>
    )
}