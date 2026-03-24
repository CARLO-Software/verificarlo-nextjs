'use client';

import { Menu } from 'lucide-react';
import { NotificationBell } from '@/app/components/NotificationBell/NotificationBell';
import styles from './AdminHeader.module.css';

interface AdminHeaderProps {
  userName: string;
  onToggleSidebar: () => void;
}

export function AdminHeader({ userName, onToggleSidebar }: AdminHeaderProps) {
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className={styles.header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className={styles.hamburger}
          onClick={onToggleSidebar}
          aria-label="Abrir menú"
        >
          <Menu size={24} />
        </button>
        <span className={styles.pageTitle}>Administración</span>
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
