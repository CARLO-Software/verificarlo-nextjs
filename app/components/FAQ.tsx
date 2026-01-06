import { useState } from "react";

// Componente FAQ
const FAQ = () => {
    // Estado que mantiene la información de las preguntas abiertas
    const [openFAQ, setOpenFAQ] = useState(null);

    const handleFAQToggle = (index) => {
        // Si la misma pregunta es clickeada, se cierra, sino se abre
        setOpenFAQ(openFAQ === index ? null : index);
    };

    return (
        <div className="faq-container">
            {/* Cada ítem de FAQ */}
            <div className="label-buttons">
                <button
                    className={`frame-427318843 ${openFAQ === 0 ? "open" : ""}`}
                    onClick={() => handleFAQToggle(0)}
                    aria-expanded={openFAQ === 0}
                >
                    Pregunta 1
                </button>
                {openFAQ === 0 && <div className="frame-427318844">Respuesta 1</div>}
            </div>

            <div className="label-buttons">
                <button
                    className={`frame-427318843 ${openFAQ === 1 ? "open" : ""}`}
                    onClick={() => handleFAQToggle(1)}
                    aria-expanded={openFAQ === 1}
                >
                    Pregunta 2
                </button>
                {openFAQ === 1 && <div className="frame-427318844">Respuesta 2</div>}
            </div>

            {/* Agregar más preguntas según sea necesario */}
        </div>
    );
};

export default FAQ;
