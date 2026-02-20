"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import styles from "./NavBar.module.css";

import { Menu, X, User } from "lucide-react";

export default function NavBar() {
  const { data: session, status } = useSession();
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
      className={`${styles["navbar"]} ${isScrolled ? styles["navbarScrolled"] : ""} ${!isHeroPage ? styles["navbarSolid"] : ""}`}
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
                <User size={16} stroke="white" fill="white" />
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
            <Menu size={17}></Menu>
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
          {/* Botón cerrar (X) */}
          <button
            className={styles["close-button"]}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menú de navegación"
          >
            <X size={20} strokeWidth={2} />
          </button>

          {/* Título del menú */}
          <p className={styles["sidebar-title"]}>Menú</p>

          {/* Items del menú con navegación smooth */}
          <nav className={styles["sidebar-nav"]}>
            <a href="/#planes" className={styles["navbar-item"]} onClick={() => setIsMobileMenuOpen(false)}>
              <span className={styles["navbar-text"]}>Planes</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
            <a href="/#proceso" className={styles["navbar-item"]} onClick={() => setIsMobileMenuOpen(false)}>
              <span className={styles["navbar-text"]}>Proceso</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
            <a href="/#testimonios" className={styles["navbar-item"]} onClick={() => setIsMobileMenuOpen(false)}>
              <span className={styles["navbar-text"]}>Testimonios</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
            <a href="/#blog" className={styles["navbar-item"]} onClick={() => setIsMobileMenuOpen(false)}>
              <span className={styles["navbar-text"]}>Blog</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
            <a href="/#faqs" className={styles["navbar-item"]} onClick={() => setIsMobileMenuOpen(false)}>
              <span className={styles["navbar-text"]}>FAQs</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
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
                <User size={18} stroke="black" fill="black" />
                Iniciar/Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
