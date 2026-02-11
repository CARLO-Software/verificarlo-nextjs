/**
 * NavLink: Enlace de navegación con estado activo visual.
 * Se usa en el header horizontal del dashboard cliente para indicar
 * la sección actual mediante fondo amarillo y texto destacado.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';

interface NavLinkProps {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function NavLink({ href, icon: Icon, children }: NavLinkProps) {
  const pathname = usePathname();

  // Check if current path matches (exact for /app, startsWith for others)
  const isActive = href === '/app'
    ? pathname === '/app'
    : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
        transition-all duration-200
        ${isActive
          ? 'bg-[#F5D849]/20 text-gray-900'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }
      `}
    >
      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
      <span>{children}</span>
    </Link>
  );
}
