import FAQ from "./components/FAQ";
import WhatsappFlotante from "./components/WhatsappFlotante";
import Footer from "./components/Footer";
import { Slider } from "./services/Slider";

export default function Home() {
  return (
    <>

      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>

      {/* Promotional banner */}
      <div className="ticker-container" role="banner" aria-label="Oferta promocional">
        <div data-w-id="94ba9fbc-8785-3683-0f40-b6b8ba5d1ff8" className="ticker-content">
          <div className="ticker-item">
            <img src="assets/images/image1.svg" loading="lazy" alt="Icono de oferta" className="image-14 w-full" />
            <p className="banner-text">
              Aprovecha nuestro paquete <span className="text-span-9">4x3 en la inspección completa</span> y compra seguro
            </p>
          </div>
          <div className="ticker-item">
            <img src="assets/images/image1.svg" loading="lazy" alt="Icono de oferta" className="image-14 w-full" />
            <p className="banner-text">
              Aprovecha nuestro paquete <span className="text-span-9">4x3 en la inspección completa</span> y compra seguro
            </p>
          </div>
          <div className="ticker-item">
            <img src="assets/images/image1.svg" loading="lazy" alt="Icono de oferta" className="image-14 w-full" />
            <p className="banner-text">
              Aprovecha nuestro paquete <span className="text-span-9">4x3 en la inspección completa</span> y compra seguro
            </p>
          </div>
          <div className="ticker-item">
            <img src="assets/images/image1.svg" loading="lazy" alt="Icono de oferta" className="image-14 w-full" />
            <p className="banner-text">
              Aprovecha nuestro paquete <span className="text-span-9">4x3 en la inspección completa</span> y compra seguro
            </p>
          </div>
          <div className="ticker-item">
            <img src="assets/images/image1.svg" loading="lazy" alt="Icono de oferta" className="image-14 w-full" />
            <p className="banner-text">
              Aprovecha nuestro paquete <span className="text-span-9">4x3 en la inspección completa</span> y compra seguro
            </p>
          </div>
        </div>
      </div>

      {/* Main navigation */}
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

      {/*Hero section */}
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
      {/* Process section */}
      <section className="section process-section" aria-labelledby="process-heading">
        <div className="w-layout-blockcontainer container process-container w-container">
          <h2 id="process-heading" className="heading-3">
            <strong>Nuestro</strong> proceso
          </h2>
          <Slider metodoSlider={"proceso-inspeccion"}>
            <div className="process-slider" role="group" aria-label="Proceso de inspección">
              <div className="splide__track">
                <ul className="splide__list">
                  <li className="splide__slide">
                    <div className="process-card">
                      <img src="assets/images/image13.webp" alt="Técnico verificando más de 200 puntos clave del vehículo"
                        className="process-image" />
                      <div className="process-box">
                        <div className="process-box-container">
                          <div className="process-box-flex">
                            <div className="process-card-label" aria-label="Paso número 1">#1</div>
                            <h3 className="process-card-heading">Verificamos +200 puntos clave</h3>
                          </div>
                          <p className="process-card-text">
                            Comprende una revisión mecánica, estética y legal del auto usado que quieres comprar.
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className="splide__slide">
                    <div className="process-card">
                      <img src="assets/images/image14.webp" alt="Entrega de informe detallado de inspección" className="process-image" />
                      <div className="process-box">
                        <div className="process-box-container">
                          <div className="process-box-flex">
                            <div className="process-card-label" aria-label="Paso número 2">#2</div>
                            <h3 className="process-card-heading">Te entregamos un informe detallado</h3>
                          </div>
                          <p className="process-card-text">
                            Que incluye: motor, caja, carrocería, pintura, chasis, suspensión, frenos, y otros.
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className="splide__slide">
                    <div className="process-card">
                      <img src="assets/images/image15.webp" alt="Profesional dando opciones y presupuesto de reparaciones"
                        className="process-image" />
                      <div className="process-box">
                        <div className="process-box-container">
                          <div className="process-box-flex">
                            <div className="process-card-label" aria-label="Paso número 3">#3</div>
                            <h3 className="process-card-heading">Te damos opciones y presupuesto</h3>
                          </div>
                          <p className="process-card-text">
                            Si encontramos problemas, te brindamos soluciones y costos estimados para su reparación.
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className="splide__slide">
                    <div className="process-card">
                      <img src="assets/images/image16.webp" alt="Procurador notarial asistiendo con la gestión de documentos"
                        className="process-image" />
                      <div className="process-box">
                        <div className="process-box-container">
                          <div className="process-box-flex">
                            <div className="process-card-label" aria-label="Paso número 4">#4</div>
                            <h3 className="process-card-heading">Te ayudamos con la gestión notarial</h3>
                          </div>
                          <p className="process-card-text">
                            En 1 hora un procurador de la notaría va a tu domicilio a tomarte las firmas.
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </Slider>
        </div>
      </section>
      {/* Services section */}
      <section className="section-background services-section" aria-labelledby="services-heading">
        <div className="w-layout-blockcontainer container services-container w-container">
          <div className="services-div">
            <h2 id="services-heading" className="heading-2">
              <strong>Elige la inspección para tu</strong> próximo auto seminuevo
            </h2>
          </div>
          <Slider metodoSlider="servicios">
            <div className="services-slider-div" role="group" aria-label="Servicios de inspección">
              <div className="splide__track" style={{ paddingLeft: "20px", paddingRight: "20px" }}>
                <ul className="splide__list" style={{ alignItems: "center" }}>


                  <li className="splide__slide">
                    <article className="services-card services-card-first">
                      <div className="services-box">
                        <header className="card-header">
                          <h3 className="header-title">Inspección Legal</h3>
                          <p className="card-description">
                            Ideal para quienes saben de mecánica y quieren complementar con la verificación legal.
                          </p>
                        </header>
                        <p className="card-price" aria-label="Precio 49 soles">S/ 49</p>
                        <div className="feature-container">
                          <h4 className="feature-header">Incluye:</h4>
                          <ul className="feature-items-container" role="list">
                            <li className="feature-item" role="listitem">
                              <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className="icons" aria-hidden="true" />
                              <span className="feature-item-text">Siniestros reportados</span>
                            </li>
                            <li className="feature-item" role="listitem">
                              <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className="icons" aria-hidden="true" />
                              <span className="feature-item-text">Revisión de Gravámenes y Papeletas</span>
                            </li>
                            <li className="feature-item" role="listitem">
                              <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className="icons" aria-hidden="true" />
                              <span className="feature-item-text">Historial de propietarios</span>
                            </li>
                            <li className="feature-item" role="listitem">
                              <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className="icons" aria-hidden="true" />
                              <span className="feature-item-text">Boleta informativa</span>
                            </li>
                            <li className="feature-item" role="listitem">
                              <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className="icons" aria-hidden="true" />
                              <span className="feature-item-text">Otros puntos</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <a href="https://wa.me/51934140010?text=%C2%A1Hola!%20Deseo%20coordinar%20la%20Inspecci%C3%B3n%20Legal.%20Quisiera%20agendar%20y%20recibir%20informaci%C3%B3n.%E2%9C%85%F0%9F%9A%98"
                        target="_blank" className="primary-cta _w-full w-button" aria-label="Solicitar inspección legal">
                        Solicitar inspección legal
                      </a>
                    </article>
                  </li>
                  <li className="splide__slide">
                    <article className="services-card services-card-middle">
                      <div className="services-box">
                        <header className="card-header">
                          <h3 className="header-title">Inspección BÁSICA</h3>
                          <p className="card-description">
                            Revisamos los puntos clave en la mecánica, estética y legal del carro que quieres comprar.
                          </p>
                        </header>
                        <p className="card-price s-27900" aria-label="Precio 249 soles">S/ 249</p>
                        <div className="feature-container">
                          <h4 className="feature-header">Incluye:</h4>
                          <ul className="feature-items-container" role="list">
                            <li className="feature-item" role="listitem">
                              <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className="icons" aria-hidden="true" />
                              <span className="feature-item-text">
                                Todo sobre <span className="text-span">revisión legal</span>
                              </span>
                            </li>
                            <li className="feature-item" role="listitem">
                              <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className="icons" aria-hidden="true" />
                              <span className="feature-item-text">
                                Revisión mecánica (200+ puntos de verificación)
                              </span>
                            </li>
                            <li className="feature-item" role="listitem">
                              <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className="icons" aria-hidden="true" />
                              <span className="feature-item-text">
                                Escáner Profesional (motor, caja, airbags, ABS, módulos)
                              </span>
                            </li>
                            <li className="feature-item" role="listitem">
                              <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className="icons" aria-hidden="true" />
                              <span className="feature-item-text">
                                Escaneo de pintura y carrocería (choques)
                              </span>
                            </li>
                            <li className="feature-item" role="listitem">
                              <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className="icons" aria-hidden="true" />
                              <span className="feature-item-text">
                                Aprobación o desaprobación verbal
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <a href="https://wa.me/51934140010?text=%C2%A1Hola!%20Deseo%20coordinar%20la%20Inspecci%C3%B3n%20B%C3%A1sica.%20Quisiera%20agendar%20y%20recibir%20informaci%C3%B3n.%E2%9C%85%F0%9F%9A%98"
                        target="_blank" className="primary-cta _w-full w-button" aria-label="Elegir inspección básica">
                        Elegir inspección básica
                      </a>
                    </article>
                  </li>
                  <li className="splide__slide">
                    <article className="services-card services-card-last">
                      <div className="services-box">
                        <header className="card-header">
                          <h3 className="header-title">Inspección COMPLETA</h3>
                          <p className="card-description">
                            Para quienes buscan verificar hasta el alma del carro. Incluye soporte en el trámite notarial.
                          </p>
                        </header>


                        <div className="price-container" style={{
                          display: 'flex',
                          justifyContent: "space-between",
                          alignItems: "center", width: "100%"
                        }} >
                          <p className="card-price s-27900" aria-label="Precio 299 soles">S/ 299</p>
                          <span className="badge-popular" aria-label="Más popular">POPULAR</span>
                        </div>
                        <div className="feature-container">
                          <h4 className="feature-header">Incluye:</h4>
                          <ul className="feature-items-container" role="list">
                            <li className="feature-item" role="listitem">
                              <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className="icons" aria-hidden="true" />
                              <span className="feature-item-text">
                                Toda la <span className="text-span">inspección básica</span>
                              </span>
                            </li>
                            <li className="feature-item" role="listitem">
                              <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className="icons" aria-hidden="true" />
                              <span className="feature-item-text">
                                Videoscopía completa del motor y zonas críticas
                              </span>
                            </li>
                            <li className="feature-item" role="listitem">
                              <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className="icons" aria-hidden="true" />
                              <span className="feature-item-text">
                                Asesoría en presupuesto de reparación
                              </span>
                            </li>
                            <li className="feature-item" role="listitem">
                              <img src="assets/images/image20.svg" loading="lazy" alt="Icono de verificación" className="icons" aria-hidden="true" />
                              <span className="feature-item-text">
                                Informe técnico y legal documentado
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <a href="https://wa.me/51934140010?text=%C2%A1Hola!%20Deseo%20coordinar%20la%20Inspecci%C3%B3n%20Completa.%20Quisiera%20agendar%20y%20recibir%20informaci%C3%B3n.%E2%9C%85%F0%9F%9A%98"
                        target="_blank" className="primary-cta _w-full w-button" aria-label="Elegir inspección completa">
                        Elegir inspección completa
                      </a>
                    </article>
                  </li>
                </ul>
              </div>
            </div>
          </Slider>
        </div>
      </section >
      {/*Benefits section */}
      < section className="section benefits-section" aria-labelledby="benefits-heading" >
        <div className="container benefits-container">
          <h2 id="benefits-heading" className="sr-only">Beneficios de nuestro servicio</h2>
          <article className="benefits-card">
            <div className="call-to-action-container">
              <img src="assets/images/image31.svg" loading="lazy" alt="Icono de seguridad garantizada" className="benefits-icon" />
              <div className="frame-427318944">
                <h3 className="benefits-header">Seguridad garantizada</h3>
                <p className="benefits-description">
                  Revisamos que el auto que quieres comprar esté en buenas condiciones para que manejes con tranquilidad.
                </p>
              </div>
            </div>
            <img src="assets/images/image32.webp" alt="Mecánico inspeccionando vehículo para garantizar seguridad"
              className="rectangle-1757-mobile" />
            <img src="assets/images/image33.webp" alt="Mecánico inspeccionando vehículo para garantizar seguridad"
              className="rectangle-1757-desktop" />
          </article>
          <article className="benefits-card">
            <div className="frame-427326988">
              <img src="assets/images/image34.svg" loading="lazy" alt="Icono de detección de fallas" className="benefits-icon" />
              <div className="frame-427318944">
                <h3 className="benefits-header">Fallas detectadas</h3>
                <p className="benefits-description">
                  Inspeccionamos ruidos, fugas y niveles críticos para alertarte de problemas que podrían pasar
                  desapercibidos al
                  comprar.
                </p>
              </div>
            </div>
            <img src="assets/images/image35.webp" alt="Técnico detectando fallas en motor de vehículo"
              className="rectangle-1757-mobile" />
            <img src="assets/images/image36.webp" alt="Técnico detectando fallas en motor de vehículo"
              className="rectangle-1757-desktop" />
          </article>
        </div>
      </section >
      <section className="section-background-yellow">
        <div className="cta-container">
          <h2 className="call-to-action-header"><strong>Nosotros inspeccionamos</strong>, t&uacute; eliges tranquilo </h2>
          <img src="assets/images/image37.webp" loading="lazy" alt="" className="call-to-action-mobile" />
          <img src="assets/images/image38.svg" loading="lazy" alt="" className="call-to-action-desktop" />
          <div className="div-block-5"><a href="https://wa.link/64579s" target="_blank" className="secondary-cta w-button">Agendar
            inspecci&oacute;n</a>
            <div className="frame-427327043"> <img src="assets/images/image39.webp" loading="lazy" alt="" className="image-11" /> <img
              src="assets/images/image40.webp" loading="lazy" alt="" className="image12" /></div>
          </div>
          <div className="div-block-3"><img src="assets/images/image41.svg" loading="lazy" alt="" className="image-3" /></div>
        </div>
        <div className="cta-container-background"></div>
      </section>
      <section className="section inspection-section">
        <div className="container inspection-centers-container"><img src="assets/images/image42.webp" loading="lazy" alt=""
          className="image-8" />
          <div className="inspection-centers-right">
            <div className="inspection-centers-row-1">
              <div className="centros-de-inspeccin">
                <h3 className="inspection-centers-heading"><strong>CENTROS DE</strong>
                  inspecci&oacute;n</h3>
              </div>
              <p className="inspection-centers-heading-description">Puedes traer el auto a nuestro centro de inspecci&oacute;n o
                puedes solicitar el servicio a domicilio.</p>
            </div>
            <div className="inspection-centers-row-2"><iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15602.704337933057!2d-76.97677!3d-12.134301!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105b870bbe0b5ff%3A0xe4471c42bb0f0ea4!2sCARLO!5e0!3m2!1ses-419!2spe!4v1750120561359!5m2!1ses-419!2spe"
              referrerPolicy="no-referrer-when-downgrade" allowFullScreen loading="lazy"
              className="iframe">location</iframe>
              <div className="inspection-centers-inner-row-1">
                <div className="frame-427327002">
                  <p className="inspection-centers-header">Ubicaci&oacute;n</p>
                  <p className="inspection-centers-description">Cerro Azul 421, Santiago de Surco, Lima</p>
                </div><a
                  href="https://www.google.com/maps/place/CARLO/@-12.101253,-77.0652674,13z/data=!4m20!1m13!4m12!1m4!2m2!1d-77.0572288!2d-12.0651776!4e1!1m6!1m2!1s0x9105b870bb99dcd7:0x7e8402627f47c57a!2sJr.Cerro+Azul+421,+Santiago+de+Surco+15803!2m2!1d-76.9767699!2d-12.1343011!3m5!1s0x9105b870bbe0b5ff:0xe4471c42bb0f0ea4!8m2!3d-12.1344002!4d-76.9769077!16s%2Fg%2F11vbz21cvl?entry=ttu&amp;g_ep=EgoyMDI1MDYxNS4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank" className="btn-map w-inline-block">
                  <p className="text-primary">Ir con Maps</p><img src="assets/images/image43.svg" loading="lazy" width="13" alt=""
                    className="logosgoogle-maps" />
                </a>
              </div>
            </div>
            <div className="inspection-centers-row-3">
              <p className="horarios-de-atencin">Horarios de atenci&oacute;n</p>
              <div className="lunes-a-viernes-900-am-600-pm-sbados-900-am-200-pm">
                <p className="lunes-a-viernes-900-am-600-pm-sbados-900-am-200-pm-2">Lunes a Viernes: &nbsp;<span
                  className="text-span-3">9:00 a.m. &ndash; 6:00 p.m.</span></p>
                <p className="lunes-a-viernes-900-am-600-pm-sbados-900-am-200-pm-2">S&aacute;bados: &nbsp;<span
                  className="text-span-4">9:00 a.m. &ndash; 2:00 p.m.</span></p>
              </div>
            </div>
            <div className="inspection-centers-row-4">
              <p className="contctanos">Cont&aacute;ctanos</p>
              <div className="telfono-whatsapp-51-934-140-010-correo-electrnico-verificarlocarlope">
                <p className="telfono-whatsapp-51-934-140-010-correo-electrnico-verificarlocarlope-2">Tel&eacute;fono /
                  WhatsApp: &nbsp;<span className="text-span-5">+51 934 140 010</span></p>
                <p className="telfono-whatsapp-51-934-140-010-correo-electrnico-verificarlocarlope-2">Correo electr&oacute;nico:
                  &nbsp;<span className="text-span-6">verificarlo@carlo.pe</span></p>
              </div>
            </div><a href="https://wa.link/64579s" target="_blank" className="primary-cta w-button">Agendar
              inspecci&oacute;n</a>
          </div>
        </div>
      </section>

      {/* FAQ section */}
      <FAQ />


      {/*FOOTER */}
      <Footer />

      {/* Botón flotante de WhatsApp */}
      <WhatsappFlotante />
    </>
  );
}
