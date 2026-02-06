'use client';

import { usePathname } from 'next/navigation';
import NavBar from './navBar/NavBar';
import Footer from './footer/Footer';
import WhatsappFlotante from './whatsappFlotante/WhatsappFlotante';
import PromotionalBanner from './promotionalBanner/PromotionalBanner';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

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
