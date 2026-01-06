"use client";

import { useEffect, useRef } from "react";
import Splide from "@splidejs/splide";
import "@splidejs/splide/css"; // estilos necesarios

type SliderProps = {
    children: React.ReactNode;
};

export const Slider = ({ children }: SliderProps) => {
    // ref al div .splide
    const splideRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!splideRef.current) return;

        // Creamos la instancia de Splide
        const splide = new Splide(splideRef.current, {
            type: "slide",
            perPage: 1.01,
            gap: "14px",
            focus: "center",
            arrows: false,
            pagination: false,
            drag: true,
            padding: { left: "16px", right: "16px" },
            rewind: false,
            clampDrag: true,
            autoWidth: false,
            mediaQuery: "min",
            breakpoints: {
                600: {
                    perPage: 2.01,
                    gap: "8px",
                    padding: { right: "20px", left: "20px" },
                    focus: 0
                },
                1200: {
                    fixedWidth: "294px",
                    padding: { right: "0px", left: "0px" },
                    drag: false, // ejemplo: desactivar drag en desktop
                },
            },
        });

        splide.mount(); // ✅ existe y funciona

        return () => {
            splide.destroy();
        };
    }, []);

    return (
        <div ref={splideRef} className="splide" >
            {children}
        </div>
    );
};