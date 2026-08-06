"use client";

import { useEffect, useRef, useMemo } from "react";
import DOMPurify from "dompurify";
import styles from "./BlogPost.module.css";

interface BlogContentProps {
  content: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

// Limpiar el HTML de caracteres problemáticos
function cleanHtmlContent(html: string): string {
  return html
    .replace(/&nbsp;/gi, ' ')
    .replace(/  +/g, ' ');
}

// Extraer headings del HTML y asegurar que tengan IDs
function processContent(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  let counter = 0;

  const processed = html.replace(
    /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi,
    (_match, tag: string, attrs: string, inner: string) => {
      const level = parseInt(tag[1]);
      const text = inner.replace(/<[^>]+>/g, '').trim();
      if (!text) return _match;

      // Usar ID existente o generar uno
      const idMatch = attrs.match(/id\s*=\s*["']([^"']+)["']/);
      const id = idMatch ? idMatch[1] : `sec-${++counter}`;

      if (!idMatch) {
        attrs += ` id="${id}"`;
      }

      toc.push({ id, text, level });
      return `<${tag}${attrs}>${inner}</${tag}>`;
    }
  );

  return { html: processed, toc };
}

export default function BlogContent({ content }: BlogContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const { html: cleanedContent, toc } = useMemo(() => {
    const cleaned = cleanHtmlContent(content);
    // Sanitizar HTML para prevenir XSS almacenado
    const sanitized = DOMPurify.sanitize(cleaned, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: ["target", "allowfullscreen", "frameborder", "allow", "loading"],
      ALLOW_DATA_ATTR: false,
    });
    return processContent(sanitized);
  }, [content]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    // Limpiar estilos inline problemáticos de todos los elementos
    const allElements = container.querySelectorAll('*');
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.style.wordBreak) htmlEl.style.wordBreak = '';
      if (htmlEl.style.overflowWrap) htmlEl.style.overflowWrap = '';
    });

    // Marcar los últimos elementos para el highlight amarillo
    const children = container.children;
    const totalChildren = children.length;
    // ponytail: marca ~últimos 15% de elementos como "cierre", ajustar ratio si se ve raro
    const highlightStart = Math.max(0, totalChildren - Math.ceil(totalChildren * 0.15));
    for (let i = highlightStart; i < totalChildren; i++) {
      children[i].classList.add(styles.highlightBlock);
    }

    // Función para manejar clics en enlaces internos
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (!link) return;

      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        const targetId = href.substring(1);
        let targetElement = document.getElementById(targetId);
        if (!targetElement) {
          targetElement = document.getElementById("#" + targetId);
        }
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
          history.pushState(null, "", href);
        }
      }
    };

    container.addEventListener("click", handleClick);

    const handleInitialHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const targetId = hash.substring(1);
        let targetElement = document.getElementById(targetId);
        if (!targetElement) {
          targetElement = document.getElementById("#" + targetId);
        }
        if (targetElement) {
          setTimeout(() => {
            targetElement!.scrollIntoView({ behavior: "smooth", block: "start" });
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
    <>
      {toc.length >= 3 && (
        <nav className={styles.toc}>
          <h2 className={styles.tocTitle}>Contenido del artículo</h2>
          <ul className={styles.tocList}>
            {toc.map((item) => (
              <li
                key={item.id}
                className={item.level === 3 ? styles.tocSubItem : styles.tocItem}
              >
                <a href={`#${item.id}`}>{item.text}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div
        ref={contentRef}
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: cleanedContent }}
      />
    </>
  );
}
