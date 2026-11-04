'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  FileBarChart,
  Settings,
  FileText,
  PlayCircle,
  Mail,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import styles from './AdminSidebar.module.css';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/inspecciones', label: 'Inspecciones', icon: CalendarCheck },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
  { href: '/admin/reels', label: 'Reels', icon: PlayCircle },
  { href: '/admin/reportes', label: 'Reportes', icon: FileBarChart },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AdminSidebar({ isOpen, onClose, collapsed, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Overlay para mobile */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''} ${collapsed ? styles.sidebarCollapsed : ''}`}
        role="navigation"
        aria-label="Menú principal"
      >
        {/* Logo */}
        <Link href="/admin" className={styles.logo} onClick={onClose}>
          <div className={styles.logoIcon}>V</div>
          <div className={styles.logoTextContainer}>
            <div className={styles.logoText}>VerifiCARLO</div>
            <div className={styles.logoSub}>Panel Admin</div>
          </div>
        </Link>

        {/* Navegación */}
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                onClick={onClose}
                title={item.label}
              >
                <span className={styles.navIcon}>
                  <Icon size={20} />
                </span>
                <span className={styles.navLinkLabel}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Toggle collapse (solo visible en desktop) */}
        {onToggleCollapse && (
          <div className={styles.collapseToggle}>
            <button
              onClick={onToggleCollapse}
              className={styles.collapseBtn}
              title={collapsed ? 'Expandir menú' : 'Comprimir menú'}
            >
              {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            </button>
          </div>
        )}

      </aside>
    </>
  );
}
