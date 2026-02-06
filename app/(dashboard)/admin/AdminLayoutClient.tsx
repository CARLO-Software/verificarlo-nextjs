'use client';

import { useState } from 'react';
import { AdminSidebar } from './components/AdminSidebar/AdminSidebar';
import { AdminHeader } from './components/AdminHeader/AdminHeader';
import styles from './AdminLayout.module.css';

interface AdminLayoutClientProps {
  userName: string;
  children: React.ReactNode;
}

export function AdminLayoutClient({ userName, children }: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
