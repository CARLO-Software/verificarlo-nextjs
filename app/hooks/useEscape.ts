import { useEffect } from "react";

//El useEscape es un hook personalizado que consiste en poder ingresar un metodo
//El metodo onEscape esperado es un -> setOpen(false) que ya es dado por el padre
export function useEscape(onEscape: () => void) {

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onEscape();
            }
        };

        document.addEventListener("keydown", handler);

        return () => document.removeEventListener("keydown", handler);
    }, [onEscape]);

}