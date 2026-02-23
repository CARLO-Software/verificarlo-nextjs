"use client";

import { useState } from "react";
import { Slider } from "@/utils/Slider";
import styles from './ServicesSection.module.css';
import { inspectionPlans, inspectionPlanItems } from "@/prisma/data/inspections";
import { X, FileText } from "lucide-react";

type ModalData = {
    title: string;
    description: string;
    price: number;
    items: string[];
    whatsappLink: string;
} | null;

export default function ServicesSection() {
    const [modalData, setModalData] = useState<ModalData>(null);

    const openModal = (inspection: typeof inspectionPlans[0], items: string[]) => {
        setModalData({
            title: inspection.title,
            description: inspection.landingDescription,
            price: inspection.price,
            items,
            whatsappLink: `https://wa.me/51934140010?text=%C2%A1Hola!%20Deseo%20coordinar%20la%20${encodeURIComponent(inspection.title)}.%20Quisiera%20agendar%20y%20recibir%20informaci%C3%B3n.%E2%9C%85%F0%9F%9A%98`
        });
        document.body.style.overflow = "hidden";
    };

    const closeModal = () => {
        setModalData(null);
        document.body.style.overflow = "";
    };

    return (
        <section id="planes" className={`${styles["section-background"]} ${styles['services-section']}`} aria-labelledby="services-heading">
            <div className={`w-layout-blockcontainer ${styles["container"]} ${styles['services-container']} w-container`}>
                <div className={styles['services-div']}>
                    <h2 id="services-heading" className={styles['heading-2']}>
                        El plan que eliges <strong>define cuánto descubres</strong>
                    </h2>
                </div>
                {/* Versión Móvil - Cards en vertical */}
                <div className={styles['mobile-plans']}>
                    {inspectionPlans.map((inspection, inspectionIndex) => {
                        const itemsForInspection = inspectionPlanItems.find(
                            ii => ii.inspectionPlanId === inspectionIndex + 1
                        );
                        const isPremium = inspection.classType === "last";

                        return (
                            <article key={inspection.type} className={`${styles['services-card']} ${styles['services-card-' + inspection.classType]} ${isPremium ? styles['services-card-premium'] : ''}`}>
                                {isPremium && (
                                    <span className={styles['badge-top']} aria-label="9 de cada 10 eligen este plan">
                                        9 de cada 10 eligen este
                                    </span>
                                )}
                                <div className={styles['services-box']}>
                                    <header className={styles['card-header']}>
                                        <h3 className={styles['header-title']}>{inspection.title}</h3>
                                        <p className={styles['card-description']}>
                                            {inspection.landingDescription}
                                        </p>
                                    </header>
                                    <div className="flex justify-between items-center w-full">
                                        <p className={styles['card-price']} aria-label={`Precio ${inspection.price} soles`}>S/ {inspection.price}</p>
                                        {isPremium &&
                                            <span className={styles['badge-popular']} aria-label="Más popular">POPULAR</span>
                                        }
                                    </div>
                                </div>
                                <div className={styles['mobile-buttons']}>
                                    <a href={`https://wa.me/51934140010?text=%C2%A1Hola!%20Deseo%20coordinar%20la%20${encodeURIComponent(inspection.title)}.%20Quisiera%20agendar%20y%20recibir%20informaci%C3%B3n.%E2%9C%85%F0%9F%9A%98`}
                                        target="_blank" className={styles['btn-primary-dark']} aria-label={`Elegir ${inspection.title}`}>
                                        Elegir este plan
                                    </a>
                                    <button
                                        type="button"
                                        className={styles['btn-secondary']}
                                        onClick={() => openModal(inspection, itemsForInspection?.label || [])}
                                        aria-label={`Saber más sobre ${inspection.title}`}
                                    >
                                        Saber más
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>

                {/* Versión PC - Carrusel */}
                <div className={styles['desktop-slider']}>
                    <Slider metodoSlider="servicios">
                        <div className={styles['services-slider-div']} role="group" aria-label="Servicios de inspección">
                            <div className="splide__track" style={{ paddingLeft: "20px", paddingRight: "20px" }}>
                                <ul className="splide__list" style={{ alignItems: "center" }}>
                                    {inspectionPlans.map((inspection, inspectionIndex) => {
                                        const itemsForInspection = inspectionPlanItems.find(
                                            ii => ii.inspectionPlanId === inspectionIndex + 1
                                        );
                                        const isPremium = inspection.classType === "last";

                                        return (
                                            <li key={inspection.type} className="splide__slide">
                                                <article className={`${styles['services-card']} ${styles['services-card-' + inspection.classType]} ${isPremium ? styles['services-card-premium'] : ''}`}>
                                                    {isPremium && (
                                                        <span className={styles['badge-top']} aria-label="9 de cada 10 eligen este plan">
                                                            9 de cada 10 eligen este
                                                        </span>
                                                    )}
                                                    <div className={styles['services-box']}>
                                                        <header className={styles['card-header']}>
                                                            <h3 className={styles['header-title']}>{inspection.title}</h3>
                                                            <p className={styles['card-description']}>
                                                                {inspection.landingDescription}
                                                            </p>
                                                        </header>
                                                        <div className="flex justify-between items-center w-full">
                                                            <p className={styles['card-price']} aria-label={`Precio ${inspection.price} soles`}>S/ {inspection.price}</p>
                                                            {isPremium &&
                                                                <span className={styles['badge-popular']} aria-label="Más popular">POPULAR</span>
                                                            }
                                                        </div>
                                                        <div className={styles['feature-container']}>
                                                            <ul className={styles['feature-items-container']} role="list">
                                                                {itemsForInspection?.label.map((label, labelIndex) => (
                                                                    <li key={labelIndex} className={styles['feature-item']} role="listitem">
                                                                        <img src="assets/images/image20.svg" loading="lazy" alt="" className={styles['icons']} aria-hidden="true" />
                                                                        <span className={styles['feature-item-text']}>{label}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <a href={`https://wa.me/51934140010?text=%C2%A1Hola!%20Deseo%20coordinar%20la%20${encodeURIComponent(inspection.title)}.%20Quisiera%20agendar%20y%20recibir%20informaci%C3%B3n.%E2%9C%85%F0%9F%9A%98`}
                                                        target="_blank" className={`${styles['primary-cta']} ${styles['_w-full']}`} aria-label={`Solicitar ${inspection.title}`}>
                                                        Solicitar {inspection.title}
                                                    </a>
                                                </article>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    </Slider>
                </div>
            </div>

            {/* Modal "Saber más" */}
            {modalData && (
                <div className={styles['modal-overlay']} onClick={closeModal}>
                    <div className={styles['modal-content']} onClick={(e) => e.stopPropagation()}>
                        {/* Imagen de fondo */}
                        <div className={styles['modal-background']}>
                            <img
                                src="/assets/images/modal-bg.webp"
                                alt=""
                                className={styles['modal-bg-image']}
                            />
                            <div className={styles['modal-bg-overlay']} />
                        </div>

                        {/* Botón cerrar */}
                        <button
                            className={styles['modal-close']}
                            onClick={closeModal}
                            aria-label="Cerrar modal"
                        >
                            <X size={20} />
                        </button>

                        {/* Contenido del modal */}
                        <div className={styles['modal-body']}>
                            {/* Botón Ver informe legal - Arriba */}
                            <a
                                href="/assets/docs/informe-legal-ejemplo.pdf"
                                target="_blank"
                                className={styles['btn-view-report']}
                                aria-label="Ver informe legal de ejemplo"
                            >
                                <FileText size={18} color="white" />
                                <span>Ver informe legal</span>
                            </a>

                            <div className={styles['modal-header']}>
                                <h3 className={styles['modal-title']}>{modalData.title}</h3>
                                <p className={styles['modal-description']}>
                                    {modalData.description} <span className={styles['modal-price-inline']}>por s/{modalData.price}.</span>
                                </p>
                            </div>

                            <ul className={styles['modal-items-list']}>
                                {modalData.items.map((item, index) => (
                                    <li key={index} className={styles['modal-item']}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={styles['check-icon']}>
                                            <circle cx="12" cy="12" r="10" fill="#FFE14C" />
                                            <path d="M8 12l3 3 5-5" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <a
                                href={modalData.whatsappLink}
                                target="_blank"
                                className={styles['modal-cta']}
                                onClick={closeModal}
                            >
                                <span>Elegir este plan</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </section >
    );
}

