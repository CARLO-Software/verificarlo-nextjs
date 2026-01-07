export default function NavBar() {

    return (
        <nav className="navbar" role="navigation" aria-label="Navegación principal">
            <div className="w-layout-blockcontainer container nav-container w-container">
                <div className="div-block">
                    <img loading="lazy" src="assets/images/image6.svg" alt="Logo VerifiCARLO" className="image-9" />
                </div>
                <div className="navbar-box">
                    <div className="navbar-item">
                        <div className="icon" aria-hidden="true">
                            <img loading="lazy" src="assets/images/image7.svg" alt="" />
                        </div>
                        <p className="navbar-text">Cerro Azul 421, Santiago de Surco, Lima</p>
                    </div>
                    <div className="navbar-item">
                        <div className="icon" aria-hidden="true">
                            <img loading="lazy" src="assets/images/image8.svg" alt="" />
                        </div>
                        <p className="navbar-text">Teléfono +51 934 140 010</p>
                    </div>
                    <a href="https://wa.link/64579s" target="_blank" className="secondary-cta w-button"
                        aria-label="Agendar inspección por WhatsApp">
                        Agendar inspección
                    </a>
                </div>
            </div>
        </nav>
    )
}