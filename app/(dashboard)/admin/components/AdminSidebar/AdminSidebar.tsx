'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  FileBarChart,
  Settings,
  LogOut,
  FileText,
} from 'lucide-react';
import styles from './AdminSidebar.module.css';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/inspecciones', label: 'Inspecciones', icon: CalendarCheck, badgeKey: 'legalReviews' },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/reportes', label: 'Reportes', icon: FileBarChart },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [legalReviewsCount, setLegalReviewsCount] = useState(0);

  // Fetch count of pending legal reviews
  const fetchLegalReviewsCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/legal-reviews/count');
      if (res.ok) {
        const data = await res.json();
        setLegalReviewsCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching legal reviews count:', error);
    }
  }, []);

  useEffect(() => {
    fetchLegalReviewsCount();
    // Polling cada 30 segundos
    const interval = setInterval(fetchLegalReviewsCount, 30000);
    return () => clearInterval(interval);
  }, [fetchLegalReviewsCount]);

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
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
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
            const badgeCount = item.badgeKey === 'legalReviews' ? legalReviewsCount : 0;

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
                  {badgeCount > 0 && (
                    <span className={styles.badge}>
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </span>
                {/* Badge flotante para modo colapsado (tablet) */}
                {badgeCount > 0 && (
                  <span className={`${styles.badge} ${styles.badgeCollapsed}`}>
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer con logout */}
        <div className={styles.footer}>
          <button
            className={styles.logoutBtn}
            onClick={() => signOut({ callbackUrl: '/' })}
            title="Cerrar sesión"
          >
            <span className={styles.navIcon}>
              <LogOut size={20} />
            </span>
            <span className={styles.logoutText}>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
