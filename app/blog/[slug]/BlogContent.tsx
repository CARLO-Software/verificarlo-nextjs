"use client";

import { useEffect, useRef } from "react";
import styles from "./BlogPost.module.css";

interface BlogContentProps {
  content: string;
}

export default function BlogContent({ content }: BlogContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    // Función para manejar clics en enlaces internos
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (!link) return;

      const href = link.getAttribute("href");

      // Solo procesar enlaces que empiezan con #
      if (href && href.startsWith("#")) {
        e.preventDefault();

        const targetId = href.substring(1); // Remover el #
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          // Scroll suave hacia el elemento
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });

          // Actualizar la URL sin recargar (opcional)
          history.pushState(null, "", href);
        }
      }
    };

    container.addEventListener("click", handleClick);

    // Manejar si la página carga con un hash en la URL
    const handleInitialHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const targetElement = document.getElementById(hash.substring(1));
        if (targetElement) {
          // Pequeño delay para asegurar que el contenido está renderizado
          setTimeout(() => {
            targetElement.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);
        }
      }
    };

    handleInitialHash();

    return () => {
      container.removeEventListener("click", handleClick);
    };
  }, [content]);

  return (
    <div
      ref={contentRef}
      className={styles.content}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
