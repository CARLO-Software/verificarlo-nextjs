"use client";

import { useState } from "react";
import styles from './ServicesSection.module.css';
import { inspectionPlans, inspectionPlanItems } from "@/prisma/data/inspections";
// Iconos: X (cerrar), Play (video)
import { X, Play } from "lucide-react";

type ModalData = {
    title: string;
    description: string;
    price: number;
    items: string[];
    whatsappLink: string;
    planIndex: number;
    videoId: string | null; // ID del video de YouTube (null para plan básico que usa PDF)
} | null;

// IDs de videos de YouTube para cada plan (reemplazar con los reales)
const PLAN_VIDEO_IDS: Record<number, string | null> = {
    0: "0b_rVuMBJEc",  // Plan Legal Express: reemplazar con ID real
    1: "IRIAhxOg6hU",  // Plan Básico: reemplazar con ID real
    2: "tgBM9EGWLig",  // Plan Premium: reemplazar con ID real
};

// Imágenes de fondo para el carrusel de desktop (una por cada plan)
// El índice corresponde al plan: 0 = Básico, 1 = Estándar, 2 = Premium
const PLAN_IMAGES = [
    "/assets/images/modal-bg.png",    // Plan Básico
    "/assets/images/modal-bg-3.png",  // Plan Estándar
    "/assets/images/modal-bg-2.png",  // Plan Premium
];

// Mensajes de WhatsApp personalizados para cada plan
const PLAN_WHATSAPP_MESSAGES: Record<number, string> = {
    0: "¡Hola! Quiero saber los antecedentes de un carro usado que quiero comprar.",
    1: "¡Hola! Voy a comprar un carro usado y quiero agendar una cita para la Inspección Básica 🚘✅",
    2: "¡Hola! Voy a comprar un carro usado y quiero agendar cita para una Inspección Premium 🚘✅",
};

// Función para generar el enlace de WhatsApp
const getWhatsAppLink = (planIndex: number) => {
    const message = PLAN_WHATSAPP_MESSAGES[planIndex] || "";
    return `https://api.whatsapp.com/send?phone=51934140010&text=${message}`;
};

export default function ServicesSection() {
    const [modalData, setModalData] = useState<ModalData>(null);
    // Controla si el video está reproduciéndose en el modal
    const [isPlayingVideo, setIsPlayingVideo] = useState(false);

    const openModal = (inspection: typeof inspectionPlans[0], items: string[], planIndex: number) => {
        setModalData({
            title: inspection.title,
            description: inspection.landingDescription,
            price: inspection.price,
            items,
            whatsappLink: getWhatsAppLink(planIndex),
            planIndex,
            videoId: PLAN_VIDEO_IDS[planIndex] // Asigna el video según el plan
        });
        document.body.style.overflow = "hidden";
    };

    const closeModal = () => {
        setModalData(null);
        setIsPlayingVideo(false); // Reset al cerrar
        document.body.style.overflow = "";
    };

    // Activa la reproducción del video
    const handlePlayVideo = () => {
        setIsPlayingVideo(true);
    };

    return (
        <section id="planes" className={`${styles["section-background"]} ${styles['services-section']}`} aria-labelledby="services-heading">
            <div className={`w-layout-blockcontainer ${styles["container"]} ${styles['services-container']} w-container`}>
                {/* Header con título */}
                <div className={styles['services-header']}>
                    <div className={styles['services-div']}>
                        <h2 id="services-heading" className={styles['heading-2']}>
                            El plan que eliges <span className={styles['negrita']}>define cuánto descubres.</span>
                        </h2>
                    </div>
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
                                        <img src="/assets/images/estrellita.png" alt="Badge top" /> 9 de cada 10 eligen este
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
                                     
                                    </div>
                                </div>
                                <div className={styles['mobile-buttons']}>
                                    <a href={getWhatsAppLink(inspectionIndex)}
                                        target="_blank" className={styles['btn-primary-dark']} aria-label={`Elegir ${inspection.title}`}>
                                        Elegir este plan
                                    </a>
                                    <button
                                        type="button"
                                        className={styles['btn-secondary']}
                                        onClick={() => openModal(inspection, itemsForInspection?.label || [], inspectionIndex)}
                                        aria-label={`Saber más sobre ${inspection.title}`}
                                    >
                                        Saber más
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>

                {/* Versión PC - Grid con 3 planes (Premium al centro) */}
                <div className={styles['desktop-plans']}>
                    {/* Reordenamos: Legal Express (0), Premium (2), Básica (1) - Premium al centro */}
                    {[0, 2, 1].map((originalIndex) => {
                        const inspection = inspectionPlans[originalIndex];
                        const itemsForInspection = inspectionPlanItems.find(
                            ii => ii.inspectionPlanId === originalIndex + 1
                        );

                        const isPremium = originalIndex === 2; // Plan Premium

                        return (
                            <div
                                key={inspection.type}
                                className={`${styles['desktop-plan-card']} ${isPremium ? styles['desktop-plan-featured'] : ''}`}
                            >
                                {/* Badge "Recomendado" para Premium - posicionado arriba */}
                                {isPremium && (
                                    <div className={styles['premium-badge-top']}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        <span>MÁS POPULAR</span>
                                    </div>
                                )}

                                {/* Imagen de fondo completa */}
                                <img
                                    src={PLAN_IMAGES[originalIndex]}
                                    alt={`Imagen de ${inspection.title}`}
                                    className={styles['carousel-image']}
                                />
                                {/* Degradado oscuro */}
                                <div className={styles['carousel-gradient']} />

                                {/* Contenido del plan sobre la imagen */}
                                <div className={styles['carousel-content']}>
                                    <div className={styles['carousel-header']}>
                                        <div className={styles['carousel-title-row']}>
                                            <h3 className={styles['carousel-title']}>{inspection.title}</h3>
                                         
                                        </div>
                                        <p className={styles['carousel-description']}>
                                            {inspection.landingDescription}
                                        </p>
                                        {/* Precio grande */}
                                        <p className={styles['carousel-price-large']}>S/{inspection.price}</p>
                                    </div>

                                    {/* Lista de items con checks verdes */}
                                    <ul className={styles['carousel-items-list']}>
                                        {itemsForInspection?.label.map((item, itemIndex) => (
                                            <li key={itemIndex} className={styles['carousel-item']}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={styles['check-icon']}>
                                                    <path d="M5 12l5 5 9-9" stroke="#5cbf26" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Botones */}
                                    <div className={styles['carousel-buttons']}>
                                        <a
                                            href={getWhatsAppLink(originalIndex)}
                                            target="_blank"
                                            className={styles['carousel-cta']}
                                        >
                                            <span>Elegir este plan</span>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                                <polyline points="12 5 19 12 12 19" />
                                            </svg>
                                        </a>
                                        <button
                                            type="button"
                                            className={styles['carousel-btn-secondary']}
                                            onClick={() => {
                                                openModal(inspection, itemsForInspection?.label || [], originalIndex);
                                                setIsPlayingVideo(true);
                                            }}
                                        >
                                            <Play size={18} />
                                            <span>Ver video</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal "Saber más" */}
            {modalData && (
                <div className={styles['modal-overlay']} onClick={closeModal}>
                    {/* Wrapper para que la X no se corte por el overflow:hidden */}
                    <div className={styles['modal-wrapper']} onClick={(e) => e.stopPropagation()}>
                        {/* Botón cerrar - Fuera del modal-content para que no se corte */}
                        <button
                            className={styles['modal-close']}
                            onClick={closeModal}
                            aria-label="Cerrar modal"
                        >
                            <X size={20} />
                        </button>

                        <div className={styles['modal-content']}>
                            {/* Fondo del modal: muestra video o imagen según el estado */}
                            <div className={`${styles['modal-background']} ${isPlayingVideo ? styles['modal-background-video'] : ''}`}>
                                {isPlayingVideo && modalData.videoId ? (
                                    // Iframe de YouTube cuando el usuario hace clic en "Ver video"
                                    <iframe
                                        src={`https://www.youtube.com/embed/${modalData.videoId}?autoplay=1&rel=0`}
                                        title="Video del plan"
                                        className={styles['modal-video']}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    // Imagen de fondo por defecto
                                    <>
                                        <img
                                            src="/assets/images/modal-bg.svg"
                                            alt="foto de fondo modal"
                                            className={styles['modal-bg-image']}
                                        />
                                        <div className={styles['modal-bg-overlay']} />
                                    </>
                                )}
                            </div>

                            {/* Botón play - Se oculta cuando el video está reproduciéndose */}
                            {!isPlayingVideo && (
                                <button
                                    type="button"
                                    onClick={handlePlayVideo}
                                    className={`${styles['btn-view-report']} ${styles['btn-play-circle']} ${styles['ripple-animation']}`}
                                    aria-label="Ver video"
                                >
                                    <Play size={16} color="black" fill="black" />
                                </button>
                            )}

                        {/* Contenido del modal */}
                        <div className={`${styles['modal-body']} ${isPlayingVideo ? styles['modal-body-video'] : ''}`}>


                            <div className={styles['modal-header']}>
                                <h3 className={styles['modal-title']}>{modalData.title}</h3>
                                <p className={styles['modal-description']}>
                                    {modalData.description}
                                    {/* Precio inline - solo visible en móvil */}
                                    <span className={styles['modal-price-inline']}> por S/{modalData.price}.</span>
                                </p>
                                {/* Precio grande - solo visible en PC */}
                                <p className={styles['modal-price-desktop']}>S/{modalData.price}</p>
                            </div>

                            <ul className={styles['modal-items-list']}>
                                {modalData.items.map((item, index) => (
                                    <li key={index} className={styles['modal-item']}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={styles['check-icon']}>
                                            <path d="M5 12l5 5 9-9" stroke="#5cbf26" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
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
                        </div>{/* cierre modal-content */}
                    </div>{/* cierre modal-wrapper */}
                </div>
            )}
        </section >
    );
}

