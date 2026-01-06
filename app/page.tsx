import img from "next/image";


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
          <div className="process-slider splide " role="group" aria-label="Proceso de inspección">
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
          <div className="services-slider-div splide" role="group" aria-label="Servicios de inspección">
            <div className="splide__track">
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
      <section className="faq-section" aria-labelledby="faq-heading">
        <div className="faq-container">
          <div className="faq-inner-container">
            <h2 id="faq-heading" className="faq-heading">
              <strong>TENEMOS RESPUESTA<br /></strong>A TUS DUDAS
            </h2>
            <div className="faq-right" role="list">
              <div className="label-buttons">
                <div className="frame-427318843">
                  <p className="faq-item-header">&iquest;Qu&eacute; puntos revisan en la inspecci&oacute;n del auto usado que
                    quiero comprar?</p><a href="#" className="faq-dropdown-btn w-inline-block"><img
                      src="assets/images/image44.svg" loading="lazy" alt="" className="mynauichevron-up" /></a>
                </div>
                <div className="frame-427318844">
                  <p className="faq-item-description">Revisamos m&aacute;s de 200 puntos clave: motor, caja, carrocer&iacute;a,
                    pintura, chasis, llantas, luces, frenos, suspensi&oacute;n, niveles de fluidos, sistema el&eacute;ctrico
                    y mucho m&aacute;s. Todo lo que necesitas para tomar una decisi&oacute;n informada antes de comprar.</p>
                </div>
              </div>
              <div className="label-buttons">
                <div className="frame-427318843">
                  <p className="faq-item-header">&iquest;Incluyen revisi&oacute;n de motor y caja?</p><a href="#"
                    className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg" loading="lazy" alt=""
                      className="mynauichevron-up" /></a>
                </div>
                <div className="frame-427318844">
                  <p className="faq-item-description">S&iacute;, claro. Evaluamos el motor y la caja para ver si hay fugas,
                    ruidos
                    extra&ntilde;os o signos de desgaste. No los abrimos, pero evaluamos su estado general para darte una
                    buena idea de su estado.</p>
                </div>
              </div>
              <div className="label-buttons">
                <div className="frame-427318843">
                  <p className="faq-item-header">&iquest;La revisi&oacute;n es solo visual o tambi&eacute;n t&eacute;cnica?</p>
                  <a href="#" className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg" loading="lazy" alt=""
                    className="mynauichevron-up" /></a>
                </div>
                <div className="frame-427318844">
                  <p className="faq-item-description">Hacemos las dos cosas. Revisamos visualmente cada parte, y tambi&eacute;n
                    usamos herramientas para verificar componentes clave. As&iacute;, no se nos escapa ning&uacute;n detalle
                    importante.</p>
                </div>
              </div>
              <div className="label-buttons">
                <div className="frame-427318843">
                  <p className="faq-item-header">&iquest;Incluye prueba de manejo?</p><a href="#"
                    className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg" loading="lazy" alt=""
                      className="mynauichevron-up" /></a>
                </div>
                <div className="frame-427318844">
                  <p className="faq-item-description">S&iacute;, si el due&ntilde;o del auto lo permite. Una vuelta
                    r&aacute;pida
                    nos ayuda a detectar cosas que a veces no se ven parados: fallos en la direcci&oacute;n, frenos,
                    suspensi&oacute;n, etc.</p>
                </div>
              </div>
              <div className="label-buttons">
                <div className="frame-427318843">
                  <p className="faq-item-header">&iquest;Pueden verificar si el auto ha tenido accidentes?</p><a href="#"
                    className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg" loading="lazy" alt=""
                      className="mynauichevron-up" /></a>
                </div>
                <div className="frame-427318844">
                  <p className="faq-item-description">S&iacute;. Buscamos se&ntilde;ales de reparaciones, repintados o piezas
                    cambiadas que podr&iacute;an indicar un choque. Tambi&eacute;n revisamos si la carrocer&iacute;a y el
                    chasis est&aacute;n alineados como deber&iacute;an.</p>
                </div>
              </div>
              <div className="label-buttons">
                <div className="frame-427318843">
                  <p className="faq-item-header">&iquest;Cu&aacute;nto tiempo demora la inspecci&oacute;n?</p><a href="#"
                    className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg" loading="lazy" alt=""
                      className="mynauichevron-up" /></a>
                </div>
                <div className="frame-427318844">
                  <p className="faq-item-description">Entre 45 minutos y una hora. Nos tomamos el tiempo justo para hacer un
                    buen
                    trabajo sin hacerte esperar de m&aacute;s.</p>
                </div>
              </div>
              <div className="label-buttons">
                <div className="frame-427318843">
                  <p className="faq-item-header">&iquest;C&oacute;mo agendo una inspecci&oacute;n?</p><a href="#"
                    className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg" loading="lazy" alt=""
                      className="mynauichevron-up" /></a>
                </div>
                <div className="frame-427318844">
                  <p className="faq-item-description">S&uacute;per f&aacute;cil. Puedes escribirnos por WhatsApp o llenar el
                    formulario en nuestra web. Coordinamos contigo el d&iacute;a, la hora y d&oacute;nde est&aacute; el
                    auto.
                  </p>
                </div>
              </div>
              {/* FAQ Fade and Show More Button */}
              <div className="faq-fade-container">
                <div className="faq-fade-overlay"></div>
                <div className="faq-show-more-container">
                  <button className="secondary-cta faq-show-more-btn">Ver más</button>
                </div>
              </div>

              <div className="label-buttons faq-hidden">
                <div className="frame-427318843">
                  <p className="faq-item-header">&iquest;Pueden ir a cualquier parte de Lima? &iquest;Cobran extra por zonas
                    lejanas?</p><a href="#" className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg"
                      loading="lazy" alt="" className="mynauichevron-up" /></a>
                </div>
                <div className="frame-427318844">
                  <p className="faq-item-description">S&iacute;, cubrimos toda Lima. No cobramos extra por la distancia, pero si
                    est&aacute;s fuera de Lima Moderna, coordinamos contigo con anticipaci&oacute;n.</p>
                </div>
              </div>
              <div className="label-buttons faq-hidden">
                <div className="frame-427318843">
                  <p className="faq-item-header">&iquest;Puedo pagar con Yape/Plin o tarjeta?</p><a href="#"
                    className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg" loading="lazy" alt=""
                      className="mynauichevron-up" /></a>
                </div>
                <div className="frame-427318844">
                  <p className="faq-item-description">S&iacute;, aceptamos Yape, Plin, tarjeta y transferencias. Lo que sea
                    m&aacute;s c&oacute;modo.</p>
                </div>
              </div>
              <div className="label-buttons faq-hidden">
                <div className="frame-427318843">
                  <p className="faq-item-header">&iquest;Debo pagar por adelantado o despu&eacute;s del servicio?</p><a href="#"
                    className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg" loading="lazy" alt=""
                      className="mynauichevron-up" /></a>
                </div>
                <div className="frame-427318844">
                  <p className="faq-item-description">Solo pedimos el pago antes de entregar el informe. Puedes hacerlo
                    despu&eacute;s de la inspecci&oacute;n, cuando ya hayas recibido la confirmaci&oacute;n de que fue
                    realizada.</p>
                </div>
              </div>
              <div className="label-buttons faq-hidden">
                <div className="frame-427318843">
                  <p className="faq-item-header">&iquest;Yo tengo que estar presente durante la inspecci&oacute;n?</p><a href="#"
                    className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg" loading="lazy" alt=""
                      className="mynauichevron-up" /></a>
                </div>
                <div className="frame-427318844">
                  <p className="faq-item-description">No hace falta. Podemos coordinar todo con el due&ntilde;o del auto y
                    t&uacute; sigues con tu d&iacute;a. Te avisamos apenas terminamos.</p>
                </div>
              </div>
              <div className="label-buttons faq-hidden">
                <div className="frame-427318843">
                  <p className="faq-item-header">&iquest;Qu&eacute; incluye el informe que me entregan?</p><a href="#"
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
              <div className="label-buttons faq-hidden">
                <div className="frame-427318843">
                  <p className="faq-item-header">&iquest;En cu&aacute;nto tiempo me env&iacute;an el informe?</p><a href="#"
                    className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg" loading="lazy" alt=""
                      className="mynauichevron-up" /></a>
                </div>
                <div className="frame-427318844">
                  <p className="faq-item-description">Vas a poder ver el informe a tiempo real a traves de un enlace que te
                    vamos
                    a compartir.</p>
                </div>
              </div>
              <div className="label-buttons faq-hidden">
                <div className="frame-427318843">
                  <p className="faq-item-header">&iquest;Me dicen si vale la pena o no comprar el auto?</p><a href="#"
                    className="faq-dropdown-btn w-inline-block"><img src="assets/images/image44.svg" loading="lazy" alt=""
                      className="mynauichevron-up" /></a>
                </div>
                <div className="frame-427318844">
                  <p className="faq-item-description">S&iacute;. Al final del informe te damos nuestra opini&oacute;n
                    profesional. Si es una buena compra, si tiene riesgos o si es mejor buscar otra opci&oacute;n.</p>
                </div>
              </div>
              <div className="label-buttons faq-hidden">
                <div className="frame-427318843">
                  <p className="faq-item-header">&iquest;Qui&eacute;n hace la inspecci&oacute;n? &iquest;Son mec&aacute;nicos
                    certificados?</p><a href="#" className="faq-dropdown-btn w-inline-block"><img
                      src="assets/images/image44.svg" loading="lazy" alt="" className="mynauichevron-up" /></a>
                </div>
                <div className="frame-427318844">
                  <p className="faq-item-description">S&iacute;. Nuestro equipo est&aacute; formado por t&eacute;cnicos con
                    experiencia en concesionaria. Revisan el auto como si fuera para ellos, y te explican todo de forma
                    sencilla y honesta.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer className="section primary-background">
        <div className="div-block-4">
          <div className="w-layout-blockcontainer container footer-container w-container">
            <div className="footer-row-1">
              <div className="footer-left">
                <div className="div-block-6"><img src="assets/images/image63.svg" loading="lazy" alt="" className="image-12" /></div>
                <div className="footer-box-inner-1">
                  <div className="footer-item">
                    <div className="icon"><img src="assets/images/image64.svg" loading="lazy" alt="" /></div>
                    <p className="footer-text">Cerro Azul 421, Santiago de
                      Surco, Lima</p>
                  </div>
                  <div className="footer-item">
                    <div className="icon"><img src="assets/images/image65.svg" loading="lazy" alt="" /></div>
                    <div className="w-layout-vflex">
                      <p className="footer-text"><a href="tel:+51934140010" className="link">+51 934 140 010</a></p>
                    </div>
                  </div>
                  <div className="footer-item">
                    <div className="icon"><img src="assets/images/image66.svg" loading="lazy" alt="" className="material-symbols-lightmail-outline" />
                    </div>
                    <div className="w-layout-vflex">
                      <p className="footer-text"><a href="mailto:verificarlo@carlo.pe?subject=Hola"
                        className="link">verificarlo@carlo.pe</a></p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="footer-right">
                <div className="footer-box-inner-2">
                  <h4 className="footer-heading">Tu seguridad empieza con una buena decisi&oacute;n.</h4>
                  <p className="footer-description">Verifica el auto usado que quieres comprar con profesionales expertos.</p>
                </div>
                <a href="https://wa.link/64579s" target="_blank" className="primary-cta w-button"
                  aria-label="Agendar inspección por WhatsApp">
                  Agendar inspecci&oacute;n
                </a>

              </div>
            </div>
            <div className="footer-row-2">
              <p className="_2025-todos-los-derechos-reservados">
                &copy; 2025 Todos los derechos reservados.
              </p>
              <div className="list">
                <a href="https://www.facebook.com/profile.php?id=61577445755386" target="_blank" className="w-inline-block">
                  <img src="assets/images/image67.svg" loading="lazy" alt="Facebook" />
                </a>
                <a href="https://www.instagram.com/verificarlo.peru?igsh=NzllN2JrbWI5MXVm&amp;utm_source=qr" target="_blank"
                  className="w-inline-block">
                  <img src="assets/images/image68.svg" loading="lazy" alt="Instagram" />
                </a>
                <a href="https://www.tiktok.com/@verificarlo.peru?_t=ZM-8xHtDLk63fy&amp;_r=1" target="_blank" className="w-inline-block">
                  <img src="assets/images/image69.svg" loading="lazy" alt="TikTok" />
                </a>
                <a href="https://www.linkedin.com/company/107714281/admin/dashboard" target="_blank" className="w-inline-block">
                  <img src="assets/images/image70.svg" loading="lazy" alt="LinkedIn" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      {/* Botón flotante de WhatsApp */}
      <div className="floating-container">
        <div className="floating-wrapper">
          <img data-w-id="f030f15b-81fd-0f05-9d10-5bcf9253e105" loading="lazy" alt="" src="assets/images/image71.svg"
            className="floating-shape-1" />
          <img data-w-id="f030f15b-81fd-0f05-9d10-5bcf9253e106" loading="lazy" alt="" src="assets/images/image72.svg"
            className="floating-shape-2" />
          <a href="https://wa.link/64579s" target="_blank" className="floating-button w-inline-block"
            aria-label="Agendar inspección por WhatsApp">
            <div className="icoutline-whatsapp">
              <img loading="lazy" src="assets/images/image73.svg" alt="WhatsApp" className="icoutline-whatsapp" />
            </div>
          </a>
        </div>
      </div>
    </>
  );
}
