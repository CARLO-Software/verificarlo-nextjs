"use client";

import { useLayoutEffect, useRef, useId } from "react";
import Splide from "@splidejs/splide";
import "@splidejs/splide/css"; // estilos necesarios

export type SliderControls = {
    goNext: () => void;
    goPrev: () => void;
    isAtStart: boolean;
    isAtEnd: boolean;
};

type SliderProps = {
    metodoSlider: "proceso-inspeccion" | "servicios",
    children: React.ReactNode;
    onControlsReady?: (controls: SliderControls) => void;
};

export const Slider = ({ metodoSlider, children, onControlsReady }: SliderProps) => {
    // ref al div .splide
    const splideRef = useRef<HTMLDivElement>(null);
    const uniqueId = useId();


    useLayoutEffect(() => {
        if (!splideRef.current) return;

        let options = {}

        if (metodoSlider === "proceso-inspeccion") {
            // Creamos la instancia de Splide
            options = {
                type: "slide",
                perPage: 1.01,
                gap: "16px",
                focus: "center",
                arrows: false,
                pagination: false,
                drag: true,
                padding: { left: "38px", right: "38px" },
                rewind: false,
                clampDrag: true,
                autoWidth: false,
                lazyLoad: "nearby",
                mediaQuery: "min",
                width: "100%",
                breakpoints: {
                    600: {
                        perPage: 2.01,
                        perMove: 2,
                        gap: "20px",
                        padding: { right: "38px", left: "38px" },
                        focus: 0,
                    },
                    1200: {
                        fixedWidth: "285px",
                        gap: "24px",
                        padding: { right: "0px", left: "0px" },
                        drag: false,
                    },
                },
            }

        } else if (metodoSlider === "servicios") {
            // Creamos la instancia de Splide
            options = {
                // Mobile-first options
                type: "slide",
                perPage: 1.01,
                gap: "12px",
                focus: "center",
                arrows: false,
                pagination: false,
                rewind: false,
                clampDrag: true,
                padding: { right: "16px", left: "16px" },
                mediaQuery: "min",
                breakpoints: {
                    480: {
                        perPage: 1.4,
                        focus: "center",
                    },
                    600: {
                        perPage: 2.01,
                        gap: "16px",
                        padding: { right: "20px", left: "20px" },
                        focus: 0,
                    },
                    992: {
                        perPage: 3,
                        gap: "16px",
                        padding: { right: "0px", left: "0px" },
                        drag: false,
                    },
                },

            }
        }
        const splide = new Splide(splideRef.current, options);

        // Función para actualizar el estado de las flechas
        const updateControls = () => {
            const index = splide.index;
            const endIndex = splide.Components.Controller.getEnd();
            if (onControlsReady) {
                onControlsReady({
                    goNext: () => splide.go(">"),
                    goPrev: () => splide.go("<"),
                    isAtStart: index === 0,
                    isAtEnd: index >= endIndex,
                });
            }
        };

        splide.on('moved', updateControls);
        splide.on('mounted', updateControls);

        splide.mount(); // Aquí Splide agrega la clase "is-initialized"

        return () => {
            splide.destroy();
        };


    }, [metodoSlider, onControlsReady]);

    return (
        <>
            <div ref={splideRef} id={`splide-${metodoSlider}-${uniqueId}`} className="splide" >
                {children}
            </div>
        </>
    );
};