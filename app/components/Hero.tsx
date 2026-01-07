export default function Hero() {
    return (
        <header className="section hero-section" id="main-content">
            <div className="w-layout-blockcontainer container hero-container w-container">
                <div className="hero-left">
                    <div className="hero-row-1">
                        <h1 className="hero-heading">
                            <strong>¿Estás por comprar un auto</strong> de segunda mano?
                        </h1>
                        <p className="hero-description">
                            ¡Verifícalo antes de comprarlo! revisamos más de 200 puntos en la mecánica, estética y legal.
                        </p>
                    </div>
                    <div className="hero-row-2">
                        <p className="hero-label">Verifícalo desde</p>
                        <p className="hero-price" aria-label="Precio desde 249 soles">S/249</p>
                    </div>
                    <a href="https://wa.link/64579s" target="_blank" className="primary-cta w-button hero-cta"
                        aria-label="Agendar inspección por WhatsApp">
                        Agendar inspección
                    </a>
                </div>
                <div className="hero-mobile" aria-hidden="true">
                    <img src="assets/images/image9.webp" alt="Auto siendo inspeccionado" className="image-hero-car" />
                    <img src="assets/images/image10.webp" alt="" className="image-hero-shape" />
                    <img src="assets/images/image11.webp" alt="Logos de certificación" className="image-hero-logos" />
                </div>
                <div className="hero-desktop" aria-hidden="true">
                    <img src="assets/images/image12.webp" alt="Auto siendo inspeccionado" className="image-7" />
                </div>
            </div>
        </header>
    );
}