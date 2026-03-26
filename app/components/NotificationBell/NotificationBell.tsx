'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, CheckCheck, Trash2, Clock, Calendar, History } from 'lucide-react';
import { formatDistanceToNow, isToday, isThisWeek, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './NotificationBell.module.css';

interface Notification {
  id: number;
  type: 'NUEVA_INSPECCION' | 'LEGAL_DESBLOQUEADO' | 'MECANICO_ASIGNADO' | 'INSPECCION_COMPLETADA';
  title: string;
  message: string;
  inspectionId: number | null;  // VehicleInspection.id (para admins)
  bookingId: number | null;      // Booking.id (para inspectors/clients)
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

interface GroupedNotifications {
  nextHour: Notification[];
  today: Notification[];
  thisWeek: Notification[];
  older: Notification[];
}

// Tipos que requieren atencion de inspeccion legal
const LEGAL_NOTIFICATION_TYPES = ['NUEVA_INSPECCION', 'LEGAL_DESBLOQUEADO'];

export function NotificationBell() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userRole = session?.user?.role || 'CLIENT';

  // Fetch notificaciones
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=50');
      if (res.ok) {
        const data: NotificationsResponse = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Montar y polling
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

  // Agrupar notificaciones por tiempo
  const groupNotifications = (notifs: Notification[]): GroupedNotifications => {
    const now = new Date();
    const groups: GroupedNotifications = {
      nextHour: [],
      today: [],
      thisWeek: [],
      older: [],
    };

    notifs.forEach((n) => {
      const createdAt = new Date(n.createdAt);
      const minutesAgo = differenceInMinutes(now, createdAt);

      if (minutesAgo <= 60) {
        groups.nextHour.push(n);
      } else if (isToday(createdAt)) {
        groups.today.push(n);
      } else if (isThisWeek(createdAt, { weekStartsOn: 1 })) {
        groups.thisWeek.push(n);
      } else {
        groups.older.push(n);
      }
    });

    return groups;
  };

  // Marcar una notificacion como leida
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

  // Marcar todas como leidas
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

  // Eliminar notificacion
  const deleteNotification = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const wasUnread = notifications.find((n) => n.id === id)?.read === false;
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (wasUnread) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setDeletingId(null);
    }
  };

  // Navegar a la inspeccion segun rol
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Determinar qué ID usar según el rol:
    // - ADMIN: usa VehicleInspection.id (inspectionId) → /admin/vehicle-inspections/[id]
    // - INSPECTOR/CLIENT: usa Booking.id (bookingId) → /inspector/[id] o /mis-inspecciones/[id]
    let targetId: number | null = null;
    let baseRoute: string;

    if (userRole === 'ADMIN') {
      targetId = notification.inspectionId;
      baseRoute = '/admin/vehicle-inspections';
    } else if (userRole === 'INSPECTOR') {
      targetId = notification.bookingId;
      baseRoute = '/inspector';
    } else {
      targetId = notification.bookingId;
      baseRoute = '/mis-inspecciones';
    }

    if (targetId) {
      window.location.href = `${baseRoute}/${targetId}`;
    } else {
      // Si no hay ID, ir a la lista principal
      window.location.href = baseRoute;
    }

    setIsOpen(false);
  };

  const isLegalNotification = (type: string) => LEGAL_NOTIFICATION_TYPES.includes(type);

  const grouped = groupNotifications(notifications);
  const hasNotifications = notifications.length > 0;

  // Renderizar grupo de notificaciones
  const renderGroup = (
    title: string,
    icon: React.ReactNode,
    items: Notification[],
    colorClass: string
  ) => {
    if (items.length === 0) return null;

    return (
      <div className={styles.group}>
        <div className={`${styles.groupHeader} ${styles[colorClass]}`}>
          {icon}
          <span>{title}</span>
          <span className={styles.groupCount}>{items.length}</span>
        </div>
        {items.map((notification) => (
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
                <span className={styles.legalBadge}>Inspeccion Legal</span>
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
            <div className={styles.itemActions}>
              {!notification.read && <span className={styles.unreadDot} />}
              <button
                className={styles.deleteBtn}
                onClick={(e) => deleteNotification(e, notification.id)}
                disabled={deletingId === notification.id}
                aria-label="Eliminar notificacion"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </button>
        ))}
      </div>
    );
  };

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
                Marcar todas
              </button>
            )}
          </div>

          <div className={styles.list}>
            {!hasNotifications ? (
              <div className={styles.empty}>
                <Bell size={32} strokeWidth={1.5} />
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              <>
                {renderGroup(
                  'En la proxima hora',
                  <Clock size={14} />,
                  grouped.nextHour,
                  'groupUrgent'
                )}
                {renderGroup(
                  'Hoy',
                  <Calendar size={14} />,
                  grouped.today,
                  'groupToday'
                )}
                {renderGroup(
                  'Esta semana',
                  <Calendar size={14} />,
                  grouped.thisWeek,
                  'groupWeek'
                )}
                {renderGroup(
                  'Anteriores',
                  <History size={14} />,
                  grouped.older,
                  'groupOlder'
                )}
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
