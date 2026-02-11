/**
 * MobileBottomNav: Navegación inferior fija para móviles.
 * Patrón de UX nativo (como apps iOS/Android) que reemplaza
 * la navegación horizontal en pantallas pequeñas (<768px).
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, Car, User } from 'lucide-react';

const navItems = [
  { href: '/app', icon: Home, label: 'Inicio' },
  { href: '/inspecciones', icon: ClipboardList, label: 'Inspecciones' },
  { href: '/vehiculos', icon: Car, label: 'Vehículos' },
  { href: '/perfil', icon: User, label: 'Perfil' },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/app'
            ? pathname === '/app'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-lg
                transition-colors duration-200
                ${isActive
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
                }
              `}
            >
              <div className={`
                relative p-1.5 rounded-lg transition-colors
                ${isActive ? 'bg-[#F5D849]/30' : ''}
              `}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-gray-900' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  );
}
