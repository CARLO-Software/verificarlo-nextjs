"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import styles from "./NavBar.module.css";

export default function NavBar() {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  //*Hace referencia a un elemento del DOM
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Detectar scroll para cambiar el estilo del navbar
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 50);
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      className={`${styles["navbar"]} ${isScrolled ? styles["navbarScrolled"] : ""}`}
      role="navigation"
      aria-label="Navegacion principal"
    >
      <div
        className={`w-layout-blockcontainer container ${styles["nav-container"]} w-container`}
      >
        <div className={styles["div-block"]}>
          <Link href="/" aria-label="Ir al inicio">
            <img
              loading="lazy"
              src="assets/images/image6.svg"
              alt="Logo VerifiCARLO"
              className="image-9"
            />
          </Link>
        </div>

        {/* Botón hamburguesa para móvil - se oculta cuando el menú está abierto */}
        {!isMobileMenuOpen && (
          <button
            ref={hamburgerRef}
            className={styles["hamburger-button"]}
            onClick={() => setIsMobileMenuOpen(true)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Abrir menú de navegación"
          >
            <span className={styles["hamburger-line"]}></span>
            <span className={styles["hamburger-line"]}></span>
            <span className={styles["hamburger-line"]}></span>
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
          <div className={styles["navbar-item"]}>
            <div className={styles["icon"]} aria-hidden="true">
              <img loading="lazy" src="assets/images/image7.svg" alt="" />
            </div>
            <p className={styles["navbar-text"]}>
              Cerro Azul 421, Santiago de Surco, Lima
            </p>
          </div>
          <div className={styles["navbar-item"]}>
            <div className={styles["icon"]} aria-hidden="true">
              <img loading="lazy" src="assets/images/image8.svg" alt="" />
            </div>
            <p className={styles["navbar-text"]}>Telefono +51 934 140 010</p>
          </div>

          {/* Botón cerrar (X) - solo visible dentro del panel móvil */}
          <button
            className={styles["close-button"]}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menú de navegación"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <Link
            href="/vehiculo"
            className={`${styles["primary-cta"]} w-button`}
            aria-label="Agendar inspeccion"
          >
            Agendar inspeccion
          </Link>

          {status === "loading" ? (
            <div className={styles["auth-loading"]}>
              <span className={styles["loading-spinner"]}></span>
            </div>
          ) : session ? (
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
                href="/login"
                className={`${styles["auth-button"]} ${styles["login-button"]}`}
              >
                Iniciar sesion
              </Link>
              <Link
                href="/register"
                className={`${styles["secondary-cta"]} w-button`}
              >
                Registrarse
              </Link>
              <div className={styles["navbar-item"]}>
                <div className={styles["icon"]} aria-hidden="true">
                  <img loading="lazy" src="assets/images/image7.svg" alt="" />
                </div>
                <p className={styles["navbar-text"]}>
                  Cerro Azul 421, Santiago de Surco, Lima
                </p>
              </div>
              <div className={styles["navbar-item"]}>
                <div className={styles["icon"]} aria-hidden="true">
                  <img loading="lazy" src="assets/images/image8.svg" alt="" />
                </div>
                <p className={styles["navbar-text"]}>
                  Telefono +51 934 140 010
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
