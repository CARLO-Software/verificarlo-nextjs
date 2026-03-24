'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './NotificationBell.module.css';

interface Notification {
  id: number;
  type: 'NUEVA_INSPECCION' | 'LEGAL_DESBLOQUEADO' | 'MECANICO_ASIGNADO' | 'INSPECCION_COMPLETADA';
  title: string;
  message: string;
  inspectionId: number | null;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// Tipos que requieren atención de inspección legal
const LEGAL_NOTIFICATION_TYPES = ['NUEVA_INSPECCION', 'LEGAL_DESBLOQUEADO'];

export function NotificationBell() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notificaciones
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=20');
      if (res.ok) {
        const data: NotificationsResponse = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Marcar como montado y empezar polling
  useEffect(() => {
    setMounted(true);
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Marcar una notificación como leída
  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications/all/read', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navegar a la inspección
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.inspectionId) {
      window.location.href = `/admin/vehicle-inspections/${notification.inspectionId}`;
    }
    setIsOpen(false);
  };

  const isLegalNotification = (type: string) => LEGAL_NOTIFICATION_TYPES.includes(type);

  // Evitar errores de hidratación: renderizar badge solo después de montar
  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {mounted && unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3 className={styles.title}>Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                className={styles.markAllBtn}
                onClick={markAllAsRead}
                disabled={loading}
              >
                <CheckCheck size={16} />
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>
                <Bell size={32} strokeWidth={1.5} />
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`
                    ${styles.item}
                    ${!notification.read ? styles.unread : ''}
                    ${isLegalNotification(notification.type) ? styles.legalItem : ''}
                  `}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={styles.itemContent}>
                    {isLegalNotification(notification.type) && (
                      <span className={styles.legalBadge}>
                        Inspección Legal
                      </span>
                    )}
                    <span className={styles.itemTitle}>{notification.title}</span>
                    <span className={styles.itemMessage}>{notification.message}</span>
                    <span className={styles.itemTime}>
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                  {!notification.read && (
                    <span className={styles.unreadDot} />
                  )}
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className={styles.footer}>
              <a href="/admin/notificaciones" className={styles.viewAll}>
                Ver todas las notificaciones
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
