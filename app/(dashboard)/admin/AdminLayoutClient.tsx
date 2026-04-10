'use client';

import { useState, useEffect } from 'react';
import { AdminSidebar } from './components/AdminSidebar/AdminSidebar';
import { AdminHeader } from './components/AdminHeader/AdminHeader';
import styles from './AdminLayout.module.css';

interface AdminLayoutClientProps {
  userName: string;
  children: React.ReactNode;
}

export function AdminLayoutClient({ userName, children }: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cerrar sidebar al cambiar el tamaño de ventana a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cerrar sidebar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  return (
    <div className={styles.container}>
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className={styles.mainArea}>
        <AdminHeader
          userName={userName}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          sidebarOpen={sidebarOpen}
        />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
