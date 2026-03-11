/**
 * PlatformHeader: Header principal del dashboard cliente.
 * Diseño minimalista SaaS con navegación horizontal (sin sidebar).
 * Incluye logo, navegación principal, CTA de agendar y menú de usuario.
 * En móvil, la navegación se oculta y se usa MobileBottomNav.
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Home, ClipboardList, Car } from 'lucide-react';
import { NavLink } from './NavLink';
import { UserMenu } from './UserMenu';

export function PlatformHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/app"
            className="flex items-center gap-2"
          >
            <Image
              src="/assets/images/verificarlo-logo.png"
              alt="VerifiCARLO"
              width={140}
              height={32}
              className="h-8 w-auto brightness-0"
              priority
            />
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/app" icon={Home}>
              Inicio
            </NavLink>
            <NavLink href="/inspecciones" icon={ClipboardList}>
              Inspecciones
            </NavLink>
            <NavLink href="/vehiculos" icon={Car}>
              Vehículos
            </NavLink>
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* CTA Agendar - Desktop */}
            <Link
              href="/agendar"
              className="
                hidden sm:inline-flex items-center gap-2
                bg-[#F5D849] hover:bg-[#e5c83a]
                text-gray-900 font-semibold text-sm
                px-4 py-2 rounded-lg
                transition-colors duration-200
              "
            >
              + Agendar
            </Link>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
