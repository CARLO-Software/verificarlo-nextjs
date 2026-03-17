"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Componente que soluciona el problema de elementos que no se renderizan
 * correctamente cuando la página se restaura desde el back-forward cache (bfcache).
 *
 * Cuando el usuario navega hacia atrás, el navegador puede mostrar una versión
 * cacheada de la página donde algunos elementos (SVGs, imágenes) no se muestran.
 * Este componente detecta esa situación y fuerza un refresh del router.
 */
export default function BfcacheFix() {
  const router = useRouter();

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // persisted = true significa que la página viene del bfcache
      if (event.persisted) {
        // Forzar refresh del router de Next.js
        router.refresh();
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [router]);

  return null;
}
