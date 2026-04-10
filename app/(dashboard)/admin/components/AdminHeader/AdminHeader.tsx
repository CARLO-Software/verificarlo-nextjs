'use client';

import { Menu, X } from 'lucide-react';
import { NotificationBell } from '@/app/components/NotificationBell/NotificationBell';
import styles from './AdminHeader.module.css';

interface AdminHeaderProps {
  userName: string;
  onToggleSidebar: () => void;
  sidebarOpen?: boolean;
}

export function AdminHeader({ userName, onToggleSidebar, sidebarOpen }: AdminHeaderProps) {
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

        <div className={styles.userInfo}>
          <div className={styles.avatar}>{initials}</div>
          <span className={styles.userName}>{userName}</span>
        </div>
      </div>
    </header>
  );
}
