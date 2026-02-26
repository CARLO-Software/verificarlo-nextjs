"use client";

import React, { useRef, useLayoutEffect, useId } from "react";
import Splide from "@splidejs/splide";
import "@splidejs/splide/css";
import styles from "./Riesgos.module.css";

type Riesgo = {
  iconito: string;
  titulo: string;
  descripcion: string;
  frecuencia: string;
};

const ListaRiesgosEvitar: Riesgo[] = [
  {
    iconito: "assets/icons/herramientas1.svg",
    titulo: "Fallas mecánicas",
    descripcion: "Motor reparado, consumo de aceite o cadena vencida.",
    frecuencia: "6 de cada 10 casos",
  },
  {
    iconito: "assets/icons/servicio-de-auto.svg",
    titulo: "Km adulterado",
    descripcion: "Kilometraje real oculto y desgaste no coincidente.",
    frecuencia: "7 de cada 10 casos",
  },
  {
    iconito: "assets/icons/Group.svg",
    titulo: "Precio inflado",
    descripcion: "Daños ocultos y choques no declarados que bajan su valor.",
    frecuencia: "8 de cada 10 casos",
  },
  {
    iconito: "assets/icons/velocimetro.svg",
    titulo: "Problemas legales",
    descripcion: "Multas, órdenes de captura o placas clonadas que heredas.",
    frecuencia: "4 de cada 10 casos",
  },
];

export default function RiesgosSection() {
  const splideRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();

  useLayoutEffect(() => {
    if (!splideRef.current) return;

    // Solo inicializar Splide en móviles (menos de 768px)
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    let splideInstance: Splide | null = null;

    const initSplide = () => {
      if (mediaQuery.matches && splideRef.current) {
        splideInstance = new Splide(splideRef.current, {
          type: "slide",
          perPage: 1.15,
          perMove: 1,
          gap: "16px",
          focus: "center",
          arrows: false,
          pagination: true,
          drag: true,
          padding: { left: "20px", right: "20px" },
          rewind: false,
          speed: 400,
          easing: "ease",
          snap: true,
          flickMaxPages: 1,
          flickPower: 300,
        });
        splideInstance.mount();
      }
    };

    const destroySplide = () => {
      if (splideInstance) {
        splideInstance.destroy();
        splideInstance = null;
      }
    };

    const handleResize = () => {
      if (mediaQuery.matches) {
        if (!splideInstance) {
          initSplide();
        }
      } else {
        destroySplide();
      }
    };

    // Inicializar
    initSplide();

    // Escuchar cambios de tamaño
    mediaQuery.addEventListener("change", handleResize);

    return () => {
      destroySplide();
      mediaQuery.removeEventListener("change", handleResize);
    };
  }, []);

  return (
    <section className={styles["riesgos-section"]}>
      <div className={styles["riesgos-container"]}>
        <h2 className={styles["riesgos-header"]}>
          Riesgos que pueden{" "}
          <span className={styles["riesgos-highlight"]}>
            costar miles de soles
          </span>
        </h2>

        {/* Versión móvil - Carrusel con Splide */}
        <div className={styles["riesgos-carousel"]}>
          <div
            ref={splideRef}
            id={`splide-riesgos-${uniqueId}`}
            className="splide"
          >
            <div className="splide__track">
              <ul className="splide__list">
                {ListaRiesgosEvitar.map((riesgo, index) => (
                  <li key={index} className="splide__slide">
                    <div className={styles["riesgos-item"]}>
                      <span className={styles["riesgos-icon-container"]}>
                        <img
                          src={riesgo.iconito}
                          alt={`Icono de ${riesgo.titulo}`}
                          className={styles["riesgos-icon"]}
                        />
                      </span>
                      <h3 className={styles["riesgos-titulo"]}>
                        {riesgo.titulo}
                      </h3>
                      <p className={styles["riesgos-descripcion"]}>
                        {riesgo.descripcion}
                      </p>
                      <p className={styles["riesgos-frecuencia"]}>
                        Frecuencia: {riesgo.frecuencia}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Versión desktop - Grid */}
        <div className={styles["riesgos-flex"]}>
          {ListaRiesgosEvitar.map((riesgo, index) => (
            <div key={index} className={styles["riesgos-item"]}>
              <span className={styles["riesgos-icon-container"]}>
                <img
                  src={riesgo.iconito}
                  alt={`Icono de ${riesgo.titulo}`}
                  className={styles["riesgos-icon"]}
                />
              </span>
              <h3 className={styles["riesgos-titulo"]}>{riesgo.titulo}</h3>
              <p className={styles["riesgos-descripcion"]}>
                {riesgo.descripcion}
              </p>
              <p className={styles["riesgos-frecuencia"]}>
                Frecuencia: {riesgo.frecuencia}
              </p>
            </div>
          ))}
        </div>

        <button className={styles["riesgos-button"]}>
          Agendar inspección ahora
          <svg
            className={styles["riesgos-button-arrow"]}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}
