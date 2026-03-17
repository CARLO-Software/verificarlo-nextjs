"use client";

import { useEffect, useRef, useMemo } from "react";
import styles from "./BlogPost.module.css";

interface BlogContentProps {
  content: string;
}

// Limpiar el HTML de caracteres problemáticos
function cleanHtmlContent(html: string): string {
  return html
    // Reemplazar &nbsp; con espacios normales para permitir saltos de línea naturales
    .replace(/&nbsp;/gi, ' ')
    // Reemplazar múltiples espacios con uno solo
    .replace(/  +/g, ' ');
}

export default function BlogContent({ content }: BlogContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Limpiar el contenido HTML de caracteres problemáticos
  const cleanedContent = useMemo(() => cleanHtmlContent(content), [content]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    // Limpiar estilos inline problemáticos de todos los elementos
    const allElements = container.querySelectorAll('*');
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.style.wordBreak) {
        htmlEl.style.wordBreak = '';
      }
      if (htmlEl.style.overflowWrap) {
        htmlEl.style.overflowWrap = '';
      }
    });

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

        // Buscar el elemento - primero sin #, luego con # (para anclas mal creadas)
        let targetElement = document.getElementById(targetId);
        if (!targetElement) {
          // Fallback: buscar con # en el ID (bug de anclas antiguas)
          targetElement = document.getElementById("#" + targetId);
        }

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
        const targetId = hash.substring(1);
        // Buscar el elemento - primero sin #, luego con # (para anclas mal creadas)
        let targetElement = document.getElementById(targetId);
        if (!targetElement) {
          targetElement = document.getElementById("#" + targetId);
        }
        if (targetElement) {
          // Pequeño delay para asegurar que el contenido está renderizado
          setTimeout(() => {
            targetElement!.scrollIntoView({
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
      dangerouslySetInnerHTML={{ __html: cleanedContent }}
    />
  );
}
