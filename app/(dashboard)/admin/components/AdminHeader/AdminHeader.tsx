'use client';

import { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { NotificationBell } from '@/app/components/NotificationBell/NotificationBell';
import styles from './AdminHeader.module.css';

interface AdminHeaderProps {
  userName: string;
  onToggleSidebar: () => void;
  sidebarOpen?: boolean;
}

export function AdminHeader({ userName, onToggleSidebar, sidebarOpen }: AdminHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button
          className={styles.hamburger}
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <h1 className={styles.pageTitle}>Administración</h1>
      </div>

      <div className={styles.rightSection}>
        <NotificationBell />

        <div className={styles.userMenuWrapper}>
          <button
            className={styles.userInfo}
            onClick={() => setShowMenu((prev) => !prev)}
          >
            <div className={styles.avatar}>{initials}</div>
            <span className={styles.userName}>{userName}</span>
          </button>
          {showMenu && (
            <>
              <div className={styles.menuBackdrop} onClick={() => setShowMenu(false)} />
              <div className={styles.userMenu}>
                <button
                  className={styles.menuItem}
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
