/**
Paso 2: FAQ Show More funcionalidad
Este bloque de código es para mostrar más preguntas cuando el usuario hace clic en el botón "Mostrar más".
 */
"use client"
import { useState } from "react";

type FAQShowMoreProps = {
    openFAQ: number | null;
    handleFAQToggle: (index: number) => void;
};


const FAQShowMore = ({ openFAQ, handleFAQToggle }: FAQShowMoreProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleShowMoreClick = () => {
        setIsExpanded(true); // Expande las preguntas
    };

    return (
        <>
            {/* Las preguntas y respuestas */}
            {!isExpanded && (
                <div className="faq-fade-container">
                    <div className="faq-fade-overlay"></div>
                    <div className="faq-show-more-container">
                        <button className="secondary-cta faq-show-more-btn" onClick={handleShowMoreClick}>Ver más</button>
                    </div>
                </div>
            )}
            
            {isExpanded && (
                
                <>
                    <div className="label-buttons">
                        <div className={`frame-427318843 ${openFAQ === 7 ? "open" : ""}`}>
                            <p className="faq-item-header">&iquest;Pueden ir a cualquier parte de Lima? &iquest;Cobran extra por zonas
                                lejanas?</p><a onClick={() => handleFAQToggle(7)} className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg"
                                    loading="lazy" alt="" className="mynauichevron-up" /></a>
                        </div>
                        <div className="frame-427318844">
                            <p className="faq-item-description">S&iacute;, cubrimos toda Lima. No cobramos extra por la distancia, pero si
                                est&aacute;s fuera de Lima Moderna, coordinamos contigo con anticipaci&oacute;n.</p>
                        </div>
                    </div>
                    <div className="label-buttons">
                        <div className={`frame-427318843 ${openFAQ === 8 ? "open" : ""}`}>
                            <p className="faq-item-header">&iquest;Puedo pagar con Yape/Plin o tarjeta?</p><a onClick={() => handleFAQToggle(8)}
                                className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg" loading="lazy" alt=""
                                    className="mynauichevron-up" /></a>
                        </div>
                        <div className="frame-427318844">
                            <p className="faq-item-description">S&iacute;, aceptamos Yape, Plin, tarjeta y transferencias. Lo que sea
                                m&aacute;s c&oacute;modo.</p>
                        </div>
                    </div>
                    <div className="label-buttons">
                        <div className={`frame-427318843 ${openFAQ === 9 ? "open" : ""}`}>
                            <p className="faq-item-header">&iquest;Debo pagar por adelantado o despu&eacute;s del servicio?</p><a onClick={() => handleFAQToggle(9)}
                                className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg" loading="lazy" alt=""
                                    className="mynauichevron-up" /></a>
                        </div>
                        <div className="frame-427318844">
                            <p className="faq-item-description">Solo pedimos el pago antes de entregar el informe. Puedes hacerlo
                                despu&eacute;s de la inspecci&oacute;n, cuando ya hayas recibido la confirmaci&oacute;n de que fue
                                realizada.</p>
                        </div>
                    </div>
                    <div className="label-buttons">
                        <div className={`frame-427318843 ${openFAQ === 10 ? "open" : ""}`}>
                            <p className="faq-item-header">&iquest;Yo tengo que estar presente durante la inspecci&oacute;n?</p><a onClick={() => handleFAQToggle(10)}
                                className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg" loading="lazy" alt=""
                                    className="mynauichevron-up" /></a>
                        </div>
                        <div className="frame-427318844">
                            <p className="faq-item-description">No hace falta. Podemos coordinar todo con el due&ntilde;o del auto y
                                t&uacute; sigues con tu d&iacute;a. Te avisamos apenas terminamos.</p>
                        </div>
                    </div>
                    <div className="label-buttons">
                        <div className={`frame-427318843 ${openFAQ === 11 ? "open" : ""}`}>
                            <p className="faq-item-header">&iquest;Qu&eacute; incluye el informe que me entregan?</p><a onClick={() => handleFAQToggle(11)}
                                className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg" loading="lazy" alt=""
                                    className="mynauichevron-up" /></a>
                        </div>
                        <div className="frame-427318844">
                            <p className="faq-item-description">Recibir&aacute;s un informe digital detallado con fotos, observaciones
                                t&eacute;cnicas, alertas importantes y una conclusi&oacute;n general sobre el estado del
                                veh&iacute;culo.
                            </p>
                        </div>
                    </div>
                    <div className="label-buttons">
                        <div className={`frame-427318843 ${openFAQ === 12 ? "open" : ""}`}>
                            <p className="faq-item-header">&iquest;En cu&aacute;nto tiempo me env&iacute;an el informe?</p><a onClick={() => handleFAQToggle(12)}
                                className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg" loading="lazy" alt=""
                                    className="mynauichevron-up" /></a>
                        </div>
                        <div className="frame-427318844">
                            <p className="faq-item-description">Vas a poder ver el informe a tiempo real a traves de un enlace que te
                                vamos
                                a compartir.</p>
                        </div>
                    </div>
                    <div className="label-buttons">
                        <div className={`frame-427318843 ${openFAQ === 13 ? "open" : ""}`}>
                            <p className="faq-item-header">&iquest;Me dicen si vale la pena o no comprar el auto?</p><a onClick={() => handleFAQToggle(13)}
                                className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg" loading="lazy" alt=""
                                    className="mynauichevron-up" /></a>
                        </div>
                        <div className="frame-427318844">
                            <p className="faq-item-description">S&iacute;. Al final del informe te damos nuestra opini&oacute;n
                                profesional. Si es una buena compra, si tiene riesgos o si es mejor buscar otra opci&oacute;n.</p>
                        </div>
                    </div>
                    <div className="label-buttons">
                        <div className={`frame-427318843 ${openFAQ === 14 ? "open" : ""}`}>
                            <p className="faq-item-header">&iquest;Qui&eacute;n hace la inspecci&oacute;n? &iquest;Son mec&aacute;nicos
                                certificados?</p><a onClick={() => handleFAQToggle(14)} className="faq-dropdown-btn w-inline-block"><img
                                    src="assets/images/image44.svg" loading="lazy" alt="" className="mynauichevron-up" /></a>
                        </div>
                        <div className="frame-427318844">
                            <p className="faq-item-description">S&iacute;. Nuestro equipo est&aacute; formado por t&eacute;cnicos con
                                experiencia en concesionaria. Revisan el auto como si fuera para ellos, y te explican todo de forma
                                sencilla y honesta.</p>
                        </div>
                    </div>
                </>
            )
            }
        </>

    )
};

export default FAQShowMore;

// Explicación:

// useState: isExpanded se utiliza para manejar si las preguntas han sido expandidas.
//     handleShowMoreClick: Este manejador cambia el estado para expandir la lista de preguntas.
// Condicional de renderizado: Si isExpanded es false, el botón "Mostrar más" se renderiza.Cuando se hace clic, se llama a handleShowMoreClick, lo que cambia el estado y elimina el botón.