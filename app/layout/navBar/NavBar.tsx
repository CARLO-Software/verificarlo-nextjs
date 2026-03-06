"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import styles from "./NavBar.module.css";

import { X } from "lucide-react";

export default function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Solo aplicar el tema transparente (texto blanco) en la página principal
  const isHeroPage = pathname === "/";

  //*Hace referencia a un elemento del DOM
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Estado para detectar cuando estamos en la sección de servicios
  const [isInServicesSection, setIsInServicesSection] = useState(false);

  // Detectar scroll para cambiar el estilo del navbar
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 50);
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Detectar cuando llegamos a la sección de servicios (solo en PC)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkServicesSection = () => {
      // Solo en PC (>= 992px)
      if (window.innerWidth < 992) {
        setIsInServicesSection(false);
        return;
      }

      const servicesSection = document.getElementById("planes");
      if (!servicesSection) return;

      // Obtener la posición de la sección relativa al viewport
      const rect = servicesSection.getBoundingClientRect();

      // Si el top de la sección está por encima de 100px del viewport
      // significa que hemos llegado o pasado la sección
      if (rect.top <= 100) {
        setIsInServicesSection(true);
      } else {
        setIsInServicesSection(false);
      }
    };

    // Verificar al cargar
    checkServicesSection();

    // Verificar en cada scroll
    window.addEventListener("scroll", checkServicesSection);
    window.addEventListener("resize", checkServicesSection);

    return () => {
      window.removeEventListener("scroll", checkServicesSection);
      window.removeEventListener("resize", checkServicesSection);
    };
  }, []);

  // Actualizar atributo en el documento para que otros componentes lo detecten
  useEffect(() => {
    if (isInServicesSection) {
      document.documentElement.setAttribute("data-in-services", "true");
    } else {
      document.documentElement.removeAttribute("data-in-services");
    }
  }, [isInServicesSection]);

  useEffect(() => {
    //Se ejecuta cada vez que haces click en cualquier parte del documento
    //* Si el dropdown exite y el click NO fue dentro del él, ciérralo.
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      const clickedHamburger = hamburgerRef.current?.contains(
        event.target as Node,
      );
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !clickedHamburger
      ) {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Bloquear scroll cuando el menú móvil está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const getInitial = () => {
    if (session?.user?.name) {
      return session.user.name.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    if (session?.user?.name) {
      return session.user.name.split(" ")[0];
    }
    return "Usuario";
  };

  return (
    <nav
      className={`${styles["navbar"]} ${isScrolled ? styles["navbarScrolled"] : ""} ${!isHeroPage ? styles["navbarSolid"] : ""} ${isInServicesSection ? styles["navbarServices"] : ""}`}
      role="navigation"
      aria-label="Navegacion principal"
    >
      <div
        className={`w-layout-blockcontainer container ${styles["nav-container"]} w-container`}
      >
        <div className={styles["div-block"]}>
          <Link
            href="/"
            aria-label="Ir al inicio"
            className={styles["logo-link"]}
          >
            <Image
              src="/assets/images/verificarlo-logo.png"
              alt="VerifiCARLO"
              width={200}
              height={60}
              priority
              className={styles["logo-image"]}
            />
          </Link>
        </div>

        <Link
          href="/login"
          className={styles["user-icon-button"]}
          aria-label="Iniciar sesión"
        >
          <img src="assets/icons/user.svg" alt="usuario" className={styles["sidebar-user-icon-img"]} />


        </Link>

        {/* Botón hamburguesa para móvil - se oculta cuando el menú está abierto */}
        {!isMobileMenuOpen && (
          <button
            ref={hamburgerRef}
            className={styles["hamburger-button"]}
            onClick={() => setIsMobileMenuOpen(true)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Abrir menú de navegación"
          >
            <img src="assets/icons/barritas.svg" alt="barras" />
          </button>
        )}

        {/* Overlay - solo visible en móvil cuando el menú está abierto */}
        {isMobileMenuOpen && (
          <div
            className={styles["overlay"]}
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        {/* navbar-box: en PC es horizontal, en móvil se convierte en menú lateral */}
        <div
          ref={mobileMenuRef}
          className={`${styles["navbar-box"]} ${isMobileMenuOpen ? styles["navbar-box-open"] : ""}`}
        >
          {/* Header del sidebar - Logo, Perfil, X */}
          <div className={styles["sidebar-header"]}>
            <Link href="/" className={styles["sidebar-logo-link"]}>
              <Image
                src="/assets/images/verificarlo-logo.png"
                alt="VerifiCARLO"
                width={140}
                height={42}
                className={styles["sidebar-logo"]}
              />
            </Link>
            <div className={styles["sidebar-header-actions"]}>
              <Link
                href="/login"
                className={styles["sidebar-user-icon"]}
                aria-label="Iniciar sesión"
              >
                <img src="assets/icons/user.svg" alt="usuario" className={styles["sidebar-user-icon-img"]} />
              </Link>
              <button
                className={styles["close-button"]}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Cerrar menú de navegación"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Título del menú */}
          <p className={styles["sidebar-title"]}>Menú</p>

          {/* Items del menú con navegación smooth */}
          <nav className={styles["sidebar-nav"]}>
            <a href="/#planes" className={styles["navbar-item"]} onClick={() => setIsMobileMenuOpen(false)}>
              <span className={styles["navbar-text"]}>Planes</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </a>
            <a href="/#proceso" className={styles["navbar-item"]} onClick={() => setIsMobileMenuOpen(false)}>
              <span className={styles["navbar-text"]}>Proceso</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </a>
            <a href="/#testimonios" className={styles["navbar-item"]} onClick={() => setIsMobileMenuOpen(false)}>
              <span className={styles["navbar-text"]}>Testimonios</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </a>
            <a href="/#blog" className={styles["navbar-item"]} onClick={() => setIsMobileMenuOpen(false)}>
              <span className={styles["navbar-text"]}>Blog</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </a>
            {/* <a href="/#faqs" className={styles["navbar-item"]} onClick={() => setIsMobileMenuOpen(false)}>
              <span className={styles["navbar-text"]}>FAQs</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </a> */}
          </nav>

          {/* Separador */}
          <div className={styles["sidebar-divider"]} />

          {/* OPTIMIZADO: Mostrar botones inmediatamente mientras carga
              La mayoría de visitantes no están logueados, así que mostramos
              los botones por defecto. Si hay sesión, cambiará al menú de usuario. */}
          {session ? (
            <div className={styles["user-menu"]} ref={dropdownRef}>
              <button
                className={styles["user-button"]}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <span className={styles["user-avatar"]}>
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className={styles["user-avatar-img"]}
                    />
                  ) : (
                    getInitial()
                  )}
                </span>
                <span className={styles["user-name"]}>{getDisplayName()}</span>
                <svg
                  className={`${styles["dropdown-arrow"]} ${isDropdownOpen ? styles["arrow-up"] : ""}`}
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M3 4.5L6 7.5L9 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {/*Si en caso ya está logueado */}
              {isDropdownOpen && (
                <div className={styles["dropdown-menu"]} role="menu">
                  <div className={styles["dropdown-header"]}>
                    <p className={styles["dropdown-email"]}>
                      {session.user?.email}
                    </p>
                  </div>
                  <Link
                    href="/perfil"
                    className={styles["dropdown-item"]}
                    role="menuitem"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle
                        cx="8"
                        cy="5"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M2 14c0-3 2.5-5 6-5s6 2 6 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    Mi Perfil
                  </Link>
                  <Link
                    href="/mis-inspecciones"
                    className={styles["dropdown-item"]}
                    role="menuitem"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect
                        x="2"
                        y="2"
                        width="12"
                        height="12"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M5 8l2 2 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Mis Inspecciones
                  </Link>
                  <div className={styles["dropdown-divider"]}></div>
                  <button
                    className={styles["dropdown-item-logout"]}
                    onClick={handleSignOut}
                    role="menuitem"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Cerrar sesion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles["menuMovil"]}>
              <Link
                href="/register"
                className={`${styles["secondary-cta"]} w-button`}
              >
                <img src="assets/icons/user.svg" alt="usuario" className={styles["sidebar-user-icon-img"]} />

                Iniciar/Registrarse
              </Link>
            </div>
          )}

          {/* Footer del sidebar - Redes sociales y CTA */}
          <div className={styles["sidebar-footer"]}>
            {/* Iconos sociales */}
            <div className={styles["social-icons"]}>
              <a
                href="https://www.facebook.com/verificarlo"
                target="_blank"
                rel="noopener noreferrer"
                className={styles["social-icon"]}
                aria-label="Facebook"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/verificarlo"
                target="_blank"
                rel="noopener noreferrer"
                className={styles["social-icon"]}
                aria-label="Instagram"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@verificarlo"
                target="_blank"
                rel="noopener noreferrer"
                className={styles["social-icon"]}
                aria-label="TikTok"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/verificarlo"
                target="_blank"
                rel="noopener noreferrer"
                className={styles["social-icon"]}
                aria-label="LinkedIn"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>

            {/* Botón CTA */}
            <a
              href="https://wa.me/51934140010?text=%C2%A1Hola!%20Quisiera%20agendar%20una%20inspecci%C3%B3n.%E2%9C%85%F0%9F%9A%98"
              target="_blank"
              className={styles["sidebar-cta"]}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>Agendar inspección ahora</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
