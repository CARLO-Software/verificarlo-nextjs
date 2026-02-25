"use client";

import { useState, useRef, useLayoutEffect } from "react";
// Splide: librería de carrusel con soporte de drag, flechas y más
import Splide from "@splidejs/splide";
import "@splidejs/splide/css";
import styles from './ServicesSection.module.css';
import { inspectionPlans, inspectionPlanItems } from "@/prisma/data/inspections";
// Iconos: X (cerrar), FileText (PDF), Play (video), ChevronLeft/Right (flechas)
import { X, FileText, Play, ChevronLeft, ChevronRight } from "lucide-react";

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
    0: null,           // Plan Básico: usa PDF, no video
    1: "IRIAhxOg6hU",  // Plan Estándar: reemplazar con ID real
    2: "tgBM9EGWLig", // Plan Premium: reemplazar con ID real
};

// Imágenes de fondo para el carrusel de desktop (una por cada plan)
// El índice corresponde al plan: 0 = Básico, 1 = Estándar, 2 = Premium
const PLAN_IMAGES = [
    "/assets/images/modal-bg.svg",    // Plan Básico
    "/assets/images/modal-bg-2.png",  // Plan Estándar
    "/assets/images/modal-bg-3.png",  // Plan Premium
];

export default function ServicesSection() {
    const [modalData, setModalData] = useState<ModalData>(null);
    // Controla si el video está reproduciéndose en el modal
    const [isPlayingVideo, setIsPlayingVideo] = useState(false);

    // Estados para controlar el color de las flechas (dinámico)
    const [isAtStart, setIsAtStart] = useState(true);   // ¿Estamos en el primer slide?
    const [isAtEnd, setIsAtEnd] = useState(false);      // ¿Estamos en el último slide?

    // Referencia al contenedor del carrusel (donde Splide se monta)
    const carouselRef = useRef<HTMLDivElement>(null);
    // Referencia a la instancia de Splide (para controlar las flechas)
    const splideInstanceRef = useRef<Splide | null>(null);

    // ========================================
    // INICIALIZACIÓN DE SPLIDE
    // ========================================
    useLayoutEffect(() => {
        if (!carouselRef.current) return;

        // Configuración de Splide
        const splide = new Splide(carouselRef.current, {
            type: "slide",           // Tipo de carrusel (slide = normal)
            fixedWidth: "750px",     // Ancho fijo de cada slide
            perMove: 1,              // Mueve 1 slide por click
            gap: "24px",             // Espacio entre slides
            arrows: false,           // Ocultamos flechas nativas (usamos las nuestras)
            pagination: false,       // Sin puntos de paginación
            drag: true,              // Permite arrastrar con mouse
            speed: 400,              // Velocidad de animación (ms)
            easing: "ease",          // Tipo de animación
            padding: { left: 40, right: 40 },
            trimSpace: true,         // Elimina espacio extra al final
        });

        // Función para actualizar el estado de las flechas
        const updateArrowState = () => {
            const index = splide.index;
            const endIndex = splide.Components.Controller.getEnd();
            setIsAtStart(index === 0);
            setIsAtEnd(index >= endIndex);
        };

        // Escuchar DESPUÉS de que el carrusel termine de moverse
        splide.on('moved', updateArrowState);
        // Al montar para estado inicial
        splide.on('mounted', updateArrowState);

        splide.mount();
        splideInstanceRef.current = splide;

        // Cleanup
        return () => {
            splide.destroy();
            splideInstanceRef.current = null;
        };
    }, []);

    // Funciones para las flechas de navegación
    const goToPrev = () => {
        splideInstanceRef.current?.go("<");
    };

    const goToNext = () => {
        splideInstanceRef.current?.go(">");
    };

    const openModal = (inspection: typeof inspectionPlans[0], items: string[], planIndex: number) => {
        setModalData({
            title: inspection.title,
            description: inspection.landingDescription,
            price: inspection.price,
            items,
            whatsappLink: `https://wa.me/51934140010?text=%C2%A1Hola!%20Deseo%20coordinar%20la%20${encodeURIComponent(inspection.title)}.%20Quisiera%20agendar%20y%20recibir%20informaci%C3%B3n.%E2%9C%85%F0%9F%9A%98`,
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
                {/* Header con título y flechas en la misma línea (solo PC) */}
                <div className={styles['services-header']}>
                    <div className={styles['services-div']}>
                        <h2 id="services-heading" className={styles['heading-2']}>
                            El plan que eliges <span className={styles['negrita']}>define cuánto descubres</span>
                        </h2>
                    </div>
                    {/* Flechas de navegación - solo visibles en PC */}
                    <div className={styles['carousel-arrows']}>
                       
                        <button
                            type="button"
                            className={`${styles['carousel-arrow']} ${isAtStart ? styles['carousel-arrow-disabled'] : styles['carousel-arrow-active']}`}
                            onClick={goToPrev}
                            disabled={isAtStart}
                            aria-label="Slide anterior"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            type="button"
                            className={`${styles['carousel-arrow']} ${isAtEnd ? styles['carousel-arrow-disabled'] : styles['carousel-arrow-active']}`}
                            onClick={goToNext}
                            disabled={isAtEnd}
                            aria-label="Slide siguiente"
                        >
                            <ChevronRight size={20} />
                        </button>
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

                {/* Versión PC - Carrusel con Splide */}
                {/*
                    Splide maneja automáticamente:
                    - Arrastre con mouse y touch
                    - Animaciones suaves
                    - Las flechas están arriba, conectadas a la instancia de Splide
                */}
                <div className={styles['desktop-carousel']}>
                    {/* Contenedor de Splide - usa clases específicas de la librería */}
                    <div ref={carouselRef} className="splide" aria-label="Galería de planes">
                        {/* splide__track: área visible del carrusel */}
                        <div className="splide__track">
                            {/* splide__list: contenedor de las slides */}
                            <ul className="splide__list">
                                {/* Mapeamos cada plan para crear una slide */}
                                {inspectionPlans.map((inspection, index) => {
                                    const itemsForInspection = inspectionPlanItems.find(
                                        ii => ii.inspectionPlanId === index + 1
                                    );

                                    const isPremiumPlus = index === 2; // Tercer plan (Premium Plus)

                                    return (
                                        // splide__slide: cada slide individual
                                        <li key={inspection.type} className="splide__slide">
                                            <div className={`${styles['carousel-slide']} ${isPremiumPlus ? styles['carousel-slide-featured'] : ''}`}>
                                                {/* Imagen de fondo completa */}
                                                <img
                                                    src={PLAN_IMAGES[index]}
                                                    alt={`Imagen de ${inspection.title}`}
                                                    className={styles['carousel-image']}
                                                    draggable={false}
                                                />
                                                {/* Degradado oscuro de derecha a izquierda */}
                                                <div className={styles['carousel-gradient']} />

                                                {/* Contenido del plan sobre la imagen */}
                                                <div className={styles['carousel-content']}>
                                                    <div className={styles['carousel-header']}>
                                                        <div className={styles['carousel-title-row']}>
                                                            <h3 className={styles['carousel-title']}>{inspection.title}</h3>
                                                            {isPremiumPlus && (
                                                                <span className={styles['badge-popular']}>MÁS POPULAR</span>
                                                            )}
                                                        </div>
                                                        <p className={styles['carousel-description']}>
                                                            {inspection.landingDescription}
                                                        </p>
                                                        {/* Precio grande - mismo estilo que el modal en PC */}
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
                                                            href={`https://wa.me/51934140010?text=%C2%A1Hola!%20Deseo%20coordinar%20la%20${encodeURIComponent(inspection.title)}.%20Quisiera%20agendar%20y%20recibir%20informaci%C3%B3n.%E2%9C%85%F0%9F%9A%98`}
                                                            target="_blank"
                                                            className={styles['carousel-cta']}
                                                        >
                                                            <span>Elegir este plan</span>
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <line x1="5" y1="12" x2="19" y2="12" />
                                                                <polyline points="12 5 19 12 12 19" />
                                                            </svg>
                                                        </a>
                                                        {index === 0 ? (
                                                            <a
                                                                href="/assets/docs/informe-legal-ejemplo.pdf"
                                                                target="_blank"
                                                                className={styles['carousel-btn-secondary']}
                                                            >
                                                                <FileText size={18} />
                                                                <span>Ver informe legal</span>
                                                            </a>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className={styles['carousel-btn-secondary']}
                                                                onClick={() => {
                                                                    openModal(inspection, itemsForInspection?.label || [], index);
                                                                    setIsPlayingVideo(true);
                                                                }}
                                                            >
                                                                <Play size={18} />
                                                                <span>Ver video</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>{/* cierre carousel-content */}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
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

                            {/* Botón: PDF para plan básico, Video para otros planes */}
                            {/* Se oculta cuando el video está reproduciéndose */}
                            {!isPlayingVideo && (
                                modalData.planIndex === 0 ? (
                                    // Plan Básico: enlace al PDF
                                    <a
                                        href="/assets/docs/informe-legal-ejemplo.pdf"
                                        target="_blank"
                                        className={`${styles['btn-view-report']} ${styles['ripple-animation']}`}
                                        aria-label="Ver informe legal de ejemplo"
                                    >
                                        <FileText size={18} color="black" />
                                        <span>Ver informe legal</span>
                                    </a>
                                ) : (
                                    // Planes 2 y 3: botón circular para reproducir video
                                    <button
                                        type="button"
                                        onClick={handlePlayVideo}
                                        className={`${styles['btn-view-report']} ${styles['btn-play-circle']} ${styles['ripple-animation']}`}
                                        aria-label="Ver video"
                                    >
                                        <Play size={16} color="black" fill="black" />
                                    </button>
                                )
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

