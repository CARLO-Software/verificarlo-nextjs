import styles from './WhatsappFlotante.module.css';

export default function WhatsappFlotante() {

    return (
        <div className={styles['floating-container']}>
            <div className={styles['floating-wrapper']}>
                <img data-w-id="f030f15b-81fd-0f05-9d10-5bcf9253e105" loading="lazy" alt="" src="assets/images/image71.svg"
                    className={styles['floating-shape-1']} />
                <img data-w-id="f030f15b-81fd-0f05-9d10-5bcf9253e106" loading="lazy" alt="" src="assets/images/image72.svg"
                    className={styles['floating-shape-2']} />
                <a href="https://wa.link/64579s" target="_blank" className={`${styles['floating-button']} w-inline-block`}
                    aria-label="Agendar inspección por WhatsApp">
                    <div className={styles['ico-outline-whatsapp']}>
                        <img loading="lazy" src="assets/images/image73.svg" alt="WhatsApp" className={styles['ico-outline-whatsapp']} />
                    </div>
                </a>
            </div>
        </div>
    )
}