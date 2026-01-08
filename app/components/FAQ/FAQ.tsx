"use client"
import { useState } from "react";
import FAQShowMore from "./FAQShowMore";
import { useEscape } from "../../hooks/useEscape";
import styles from './FAQ.module.css';

// Componente FAQ
const FAQ = () => {
    // Estado que mantiene la información de las preguntas abiertas
    const [openFAQ, setOpenFAQ] = useState<number | null>(null);

    const handleFAQToggle = (index: number) => {
        // Si la misma pregunta es clickeada, se cierra, sino se abre
        setOpenFAQ(openFAQ === index ? null : index);
    };

    //Cuando presionas escape ejecutas ese metodo -> setOpenFAQ
    useEscape(() => {
        if (openFAQ !== null) {
            setOpenFAQ(null);
        }
    })

    return (
        <>
            <section className={styles['faq-section']} aria-labelledby="faq-heading">
                <div className={styles['faq-container']}>
                    <div className={styles['faq-inner-container']}>
                        <h2 id="faq-heading" className={styles['faq-heading']}>
                            <strong>TENEMOS RESPUESTA<br /></strong>A TUS DUDAS
                        </h2>
                        <div className={styles['faq-right']} role="list">
                            <div className={styles['label-buttons']}>
                                <div className={`${styles['frame-427318843']} ${openFAQ === 0 ? styles.open : ""}`} onClick={() => handleFAQToggle(0)}>
                                    <p className={styles['faq-item-header']}>&iquest;Qu&eacute; puntos revisan en la inspecci&oacute;n del auto usado que
                                        quiero comprar?</p><a className={`${styles['faq-dropdown-btn']} w-inline-block`} ><img
                                            src="assets/images/image44.svg" loading="lazy" alt="" className={styles['mynauichevron-up']} /></a>
                                </div>

                                <div className={styles['frame-427318844']}>
                                    <p className={styles['faq-item-description']}>Revisamos m&aacute;s de 200 puntos clave: motor, caja, carrocer&iacute;a,
                                        pintura, chasis, llantas, luces, frenos, suspensi&oacute;n, niveles de fluidos, sistema el&eacute;ctrico
                                        y mucho m&aacute;s. Todo lo que necesitas para tomar una decisi&oacute;n informada antes de comprar.</p>
                                </div>
                            </div>

                            <div className={styles['label-buttons']}>
                                <div className={`${styles['frame-427318843']} ${openFAQ === 1 ? styles.open : ""}`} onClick={() => handleFAQToggle(1)}>
                                    <p className={styles['faq-item-header']}>&iquest;Incluyen revisi&oacute;n de motor y caja?</p><a
                                        className={`${styles['faq-dropdown-btn']} w-inline-block`}><img src="assets/images/image44.svg" loading="lazy" alt=""
                                            className={styles['mynauichevron-up']} /></a>
                                </div>
                                <div className={styles['frame-427318844']}>
                                    <p className={styles['faq-item-description']}>S&iacute;, claro. Evaluamos el motor y la caja para ver si hay fugas,
                                        ruidos
                                        extra&ntilde;os o signos de desgaste. No los abrimos, pero evaluamos su estado general para darte una
                                        buena idea de su estado.</p>
                                </div>
                            </div>

                            <div className={styles['label-buttons']}>
                                <div className={`${styles['frame-427318843']} ${openFAQ === 2 ? styles.open : ""}`} onClick={() => handleFAQToggle(2)}>
                                    <p className={styles['faq-item-header']}>&iquest;La revisi&oacute;n es solo visual o tambi&eacute;n t&eacute;cnica?</p>
                                    <a className={`${styles['faq-dropdown-btn']} w-inline-block`}><img src="assets/images/image44.svg" loading="lazy" alt=""
                                        className={styles['mynauichevron-up']} /></a>
                                </div>
                                <div className={styles['frame-427318844']}>
                                    <p className={styles['faq-item-description']}>Hacemos las dos cosas. Revisamos visualmente cada parte, y tambi&eacute;n
                                        usamos herramientas para verificar componentes clave. As&iacute;, no se nos escapa ning&uacute;n detalle
                                        importante.</p>
                                </div>
                            </div>
                            <div className={styles['label-buttons']}>
                                <div className={`${styles['frame-427318843']} ${openFAQ === 3 ? styles.open : ""}`} onClick={() => handleFAQToggle(3)}>
                                    <p className={styles['faq-item-header']}>&iquest;Incluye prueba de manejo?</p><a
                                        className={`${styles['faq-dropdown-btn']} w-inline-block`}><img src="assets/images/image44.svg" loading="lazy" alt=""
                                            className={styles['mynauichevron-up']} /></a>
                                </div>
                                <div className={styles['frame-427318844']}>
                                    <p className={styles['faq-item-description']}>S&iacute;, si el due&ntilde;o del auto lo permite. Una vuelta
                                        r&aacute;pida
                                        nos ayuda a detectar cosas que a veces no se ven parados: fallos en la direcci&oacute;n, frenos,
                                        suspensi&oacute;n, etc.</p>
                                </div>
                            </div>
                            <div className={styles['label-buttons']}>
                                <div className={`${styles['frame-427318843']} ${openFAQ === 4 ? styles.open : ""}`} onClick={() => handleFAQToggle(4)}>
                                    <p className={styles['faq-item-header']}>&iquest;Pueden verificar si el auto ha tenido accidentes?</p><a
                                        className={`${styles['faq-dropdown-btn']} w-inline-block`}><img src="assets/images/image44.svg" loading="lazy" alt=""
                                            className={styles['mynauichevron-up']} /></a>
                                </div>
                                <div className={styles['frame-427318844']}>
                                    <p className={styles['faq-item-description']}>S&iacute;. Buscamos se&ntilde;ales de reparaciones, repintados o piezas
                                        cambiadas que podr&iacute;an indicar un choque. Tambi&eacute;n revisamos si la carrocer&iacute;a y el
                                        chasis est&aacute;n alineados como deber&iacute;an.</p>
                                </div>
                            </div>
                            <div className={styles['label-buttons']}>
                                <div className={`${styles['frame-427318843']} ${openFAQ === 5 ? styles.open : ""}`} onClick={() => handleFAQToggle(5)}>
                                    <p className={styles['faq-item-header']}>&iquest;Cu&aacute;nto tiempo demora la inspecci&oacute;n?</p><a
                                        className={`${styles['faq-dropdown-btn']} w-inline-block`}><img src="assets/images/image44.svg" loading="lazy" alt=""
                                            className={styles['mynauichevron-up']} /></a>
                                </div>
                                <div className={styles['frame-427318844']}>
                                    <p className={styles['faq-item-description']}>Entre 45 minutos y una hora. Nos tomamos el tiempo justo para hacer un
                                        buen
                                        trabajo sin hacerte esperar de m&aacute;s.</p>
                                </div>
                            </div>
                            <div className={styles['label-buttons']}>
                                <div className={`${styles['frame-427318843']} ${openFAQ === 6 ? styles.open : ""}`} onClick={() => handleFAQToggle(6)}>
                                    <p className={styles['faq-item-header']}>&iquest;C&oacute;mo agendo una inspecci&oacute;n?</p><a
                                        className={`${styles['faq-dropdown-btn']} w-inline-block`}><img src="assets/images/image44.svg" loading="lazy" alt=""
                                            className={styles['mynauichevron-up']} /></a>
                                </div>
                                <div className={styles['frame-427318844']}>
                                    <p className={styles['faq-item-description']}>S&uacute;per f&aacute;cil. Puedes escribirnos por WhatsApp o llenar el
                                        formulario en nuestra web. Coordinamos contigo el d&iacute;a, la hora y d&oacute;nde est&aacute; el
                                        auto.
                                    </p>
                                </div>
                            </div>

                            {/* FAQ Fade and Show More Button */}
                            <FAQShowMore openFAQ={openFAQ} handleFAQToggle={handleFAQToggle}></FAQShowMore>

                        </div>
                    </div>
                </div>
            </section>

        </>
    );
};

export default FAQ;