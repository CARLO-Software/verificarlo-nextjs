/**
 * LayoutShell: Controla qué elementos de layout mostrar según la ruta y sesión.
 *
 * - Cliente logueado en páginas públicas: Layout simple con header mínimo
 * - Admin (/admin): Solo children (tiene su propio layout)
 * - Inspector (/inspector): Solo children (tiene su propio layout)
 * - Visitante (sin sesión): NavBar + Footer + WhatsApp + Banner (landing)
 */
'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import NavBar from './navBar/NavBar';
import Footer from './footer/Footer';
import WhatsappFlotante from './whatsappFlotante/WhatsappFlotante';
import PromotionalBanner from './promotionalBanner/PromotionalBanner';
import { MinimalHeader } from '@/app/components/Dashboard';

// Rutas que tienen su propio layout completo (admin/inspector)
const ADMIN_INSPECTOR_ROUTES = ['/admin', '/inspector'];

// Rutas de la plataforma cliente (ya tienen layout en route group)
const CLIENT_PLATFORM_ROUTES = ['/app', '/inspecciones', '/vehiculos', '/perfil', '/configuraciones'];

// Rutas legales (tienen su propio layout simple sin NavBar/Footer)
const LEGAL_ROUTES = [
  '/terminos-y-condiciones',
  '/politica-de-privacidad',
  '/politica-de-cambios-y-devoluciones',
];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Rutas de admin/inspector usan su propio layout
  const isAdminInspectorRoute = ADMIN_INSPECTOR_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAdminInspectorRoute) {
    return <>{children}</>;
  }

  // Rutas legales usan su propio layout simple (sin NavBar/Footer)
  const isLegalRoute = LEGAL_ROUTES.some((route) => pathname === route);

  if (isLegalRoute) {
    return <>{children}</>;
  }

  // Rutas de plataforma cliente ya tienen el layout aplicado
  const isClientPlatformRoute = CLIENT_PLATFORM_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isClientPlatformRoute) {
    return <>{children}</>;
  }

  // Si el usuario es cliente logueado, mostrar layout minimalista en páginas públicas
  const isClientLoggedIn =
    status === 'authenticated' && session?.user?.role === 'CLIENT';

  if (isClientLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MinimalHeader />
        <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
      </div>
    );
  }

  // Visitantes: Landing y páginas públicas
  return (
    <>
      <PromotionalBanner />
      <NavBar />
      {children}
      <Footer />
      <WhatsappFlotante />
    </>
  );
}
