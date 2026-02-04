import { Slider } from "@/utils/Slider";
import styles from './ServicesSection.module.css';
import { inspectionPlans, inspectionPlanItems } from "@/prisma/data/inspections";

export default function ServicesSection() {

    return (
        <section className={`${styles["section-background"]} ${styles['services-section']}`} aria-labelledby="services-heading">
            <div className={`w-layout-blockcontainer ${styles["container"]} ${styles['services-container']} w-container`}>
                <div className={styles['services-div']}>
                    <h2 id="services-heading" className={styles['heading-2']}>
                        <strong>Elige la inspección para tu</strong> próximo auto seminuevo
                    </h2>
                </div>
                <Slider metodoSlider="servicios">
                    <div className={styles['services-slider-div']} role="group" aria-label="Servicios de inspección">
                        <div className="splide__track" style={{ paddingLeft: "20px", paddingRight: "20px" }}>
                            <ul className="splide__list" style={{ alignItems: "center" }}>

                                {inspectionPlans.map((inspection, inspectionIndex) => {
                                    // Obtener los labels correspondientes a esta inspección
                                    const itemsForInspection = inspectionPlanItems.find(
                                        ii => ii.inspectionPlanId === inspectionIndex + 1
                                    );
                                    
                                    return (
                                        <li key={inspection.type} className="splide__slide">
                                            <article className={`${styles['services-card']} ${styles['services-card-' + inspection.classType]}`}>
                                                <div className={styles['services-box']}>
                                                    <header className={styles['card-header']}>
                                                        <h3 className={styles['header-title']}>{inspection.title}</h3>
                                                        <p className={styles['card-description']}>
                                                            {inspection.landingDescription}
                                                        </p>
                                                    </header>
                                                    <div className="flex justify-between items-center w-full">
                                                        <p className={styles['card-price']} aria-label={`Precio ${inspection.price} soles`}>S/ {inspection.price}</p>
                                                        {inspection.classType === "last" &&
                                                            <span className={styles['badge-popular']} aria-label="Más popular">POPULAR</span>
                                                        }
                                                    </div>
                                                    <div className={styles['feature-container']}>
                                                        <h4 className={styles['feature-header']}>Incluye:</h4>
                                                        <ul className={styles['feature-items-container']} role="list">
                                                            {itemsForInspection?.label.map((label, labelIndex) => (
                                                                <li key={labelIndex} className={styles['feature-item']} role="listitem">
                                                                    <img src="assets/images/image20.svg" loading="lazy" alt="" className={styles['icons']} aria-hidden="true" />
                                                                    <span className={styles['feature-item-text']}>{label}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                                <a href={`https://wa.me/51934140010?text=%C2%A1Hola!%20Deseo%20coordinar%20la%20${encodeURIComponent(inspection.title)}.%20Quisiera%20agendar%20y%20recibir%20informaci%C3%B3n.%E2%9C%85%F0%9F%9A%98`}
                                                    target="_blank" className={`${styles['primary-cta']} ${styles['_w-full']}`} aria-label={`Solicitar ${inspection.title}`}>
                                                    Solicitar {inspection.title}
                                                </a>
                                            </article>
                                        </li>
                                    );
                                })}

                            </ul>
                        </div>
                    </div>
                </Slider>
            </div>
        </section >
    );
}

