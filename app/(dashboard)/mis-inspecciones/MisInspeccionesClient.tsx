'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { BookingStatus } from '@prisma/client';
import { formatearFechaLima } from '@/app/domain/datetime';
import { ApprovalBadge, getApprovalStatus } from '@/app/components/ui/ApprovalBadge/ApprovalBadge';
import { GradeStars } from '@/app/components/ui/GradeStars/GradeStars';
import styles from './MisInspecciones.module.css';

type FilterStatus = 'all' | 'progress' | 'completed' | 'cancelled';

interface FormattedInspection {
  id: number;
  code: string;
  status: BookingStatus;
  date: Date;
  expiresAt?: Date | string | null;
  vehicle: {
    brand: string;
    brandLogo?: string;
    model: string;
    year: number;
    plate: string | null;
  };
  location?: string;
  inspectionType: string; // 'LEGAL' | 'BASIC' | 'PREMIUM'
  grade?: number | null; // 1-4
  progress?: {
    current: number;
    total: number;
    label?: string;
  };
  results?: {
    legal: 'ok' | 'warning' | 'critical' | 'pending';
    mechanical: 'ok' | 'warning' | 'critical' | 'pending';
    body: 'ok' | 'warning' | 'critical' | 'pending';
  };
  hasCriticalObservations?: boolean;
  hasObservations?: boolean;
}

interface MisInspeccionesClientProps {
  inspections: FormattedInspection[];
}

const filterOptions: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'progress', label: 'En proceso' },
  { value: 'completed', label: 'Completadas' },
  { value: 'cancelled', label: 'Canceladas' },
];

// Mapeo de tipos de inspección a labels
const inspectionTypeLabels: Record<string, string> = {
  'LEGAL': 'Legal Express',
  'BASIC': 'Básica',
  'PREMIUM': 'Premium',
};

export function MisInspeccionesClient({ inspections: initialInspections }: MisInspeccionesClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [inspections, setInspections] = useState<FormattedInspection[]>(initialInspections);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [_cancelingId, setCancelingId] = useState<number | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Click outside handler para cerrar el menú de usuario
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Obtener iniciales del usuario
  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (session?.user?.email) {
      return session.user.email[0].toUpperCase();
    }
    return 'U';
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = inspections.length;
    const progress = inspections.filter(i =>
      ['PENDING_PAYMENT', 'PENDING_VERIFICATION', 'PAID'].includes(i.status)
    ).length;
    const completed = inspections.filter(i => i.status === 'COMPLETED').length;
    const cancelled = inspections.filter(i =>
      ['CANCELLED', 'NO_SHOW', 'EXPIRED'].includes(i.status)
    ).length;

    return { total, progress, completed, cancelled };
  }, [inspections]);

  // Filtrar inspecciones
  const filteredInspections = useMemo(() => {
    return inspections.filter((inspection) => {
      // Filtro por estado
      if (statusFilter !== 'all') {
        if (statusFilter === 'progress') {
          if (!['PENDING_PAYMENT', 'PENDING_VERIFICATION', 'PAID'].includes(inspection.status)) {
            return false;
          }
        } else if (statusFilter === 'completed') {
          if (inspection.status !== 'COMPLETED') return false;
        } else if (statusFilter === 'cancelled') {
          if (!['CANCELLED', 'NO_SHOW', 'EXPIRED'].includes(inspection.status)) return false;
        }
      }

      // Filtro por búsqueda
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesVehicle =
          inspection.vehicle.brand.toLowerCase().includes(query) ||
          inspection.vehicle.model.toLowerCase().includes(query) ||
          (inspection.vehicle.plate?.toLowerCase().includes(query) ?? false);
        const matchesCode = inspection.code.toLowerCase().includes(query);

        if (!matchesVehicle && !matchesCode) return false;
      }

      return true;
    });
  }, [inspections, statusFilter, searchQuery]);

  const handleViewReport = (id: number) => {
    router.push(`/mis-inspecciones/${id}`);
  };

  const handleCancel = useCallback(async (id: number) => {
    const confirmCancel = window.confirm(
      '¿Estás seguro de que deseas cancelar esta inspección? Esta acción no se puede deshacer.'
    );

    if (!confirmCancel) return;

    setCancelingId(id);

    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Error al cancelar la inspección');
        return;
      }

      setInspections((prev) =>
        prev.map((inspection) =>
          inspection.id === id
            ? { ...inspection, status: 'CANCELLED' as const }
            : inspection
        )
      );

      alert('Inspección cancelada exitosamente');
    } catch (error) {
      console.error('Error al cancelar:', error);
      alert('Error de conexión. Intenta nuevamente.');
    } finally {
      setCancelingId(null);
    }
  }, []);

  // Determinar clase de estado para la card
  const getStatusClass = (status: BookingStatus) => {
    if (status === 'COMPLETED') return styles.statusCompleted;
    if (['PENDING_PAYMENT', 'PENDING_VERIFICATION', 'PAID'].includes(status)) return styles.statusProgress;
    if (['CANCELLED', 'NO_SHOW', 'EXPIRED'].includes(status)) return styles.statusCancelled;
    return styles.statusPending;
  };

  // Determinar tipo de badge de inspección
  const getTypeBadgeClass = (type: string) => {
    if (type === 'LEGAL') return styles.legal;
    if (type === 'BASIC') return styles.basic;
    if (type === 'PREMIUM') return styles.premium;
    return '';
  };

  return (
    <div className={styles.dashboard}>
      {/* ================================================================
          SECCIÓN OSCURA: Navbar + Header + Stats
          ================================================================ */}
      <section className={styles.darkSection}>
        <div className={styles.darkContainer}>
          {/* Navbar */}
          <nav className={styles.navbar}>
            <div className={styles.navbarBrand}>
              <div className={styles.navbarLogo}>V</div>
              <span className={styles.navbarTitle}>VerifiCARLO</span>
            </div>

            <div className={styles.navbarLinks}>
              <Link href="/mis-inspecciones" className={`${styles.navbarLink} ${styles.active}`}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                Inspecciones
              </Link>
              <Link href="/mis-beneficios" className={styles.navbarLink}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                Beneficios
              </Link>
            </div>

            <div className={styles.navbarActions}>
              <button className={styles.navbarIconBtn} title="Notificaciones">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </button>

              {/* User Menu Dropdown */}
              <div className={styles.userMenuWrapper} ref={userMenuRef}>
                {session?.user?.image ? (
                  <div
                    className={styles.userAvatar}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <img src={session.user.image} alt={session.user.name || 'Usuario'} />
                  </div>
                ) : (
                  <div
                    className={styles.userAvatarPlaceholder}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    {getUserInitials()}
                  </div>
                )}

                {userMenuOpen && (
                  <div className={styles.userDropdown}>
                    <div className={styles.dropdownHeader}>
                      <p className={styles.dropdownUserName}>
                        {session?.user?.name || 'Usuario'}
                      </p>
                      <p className={styles.dropdownUserEmail}>
                        {session?.user?.email || ''}
                      </p>
                    </div>

                    <div className={styles.dropdownMenu}>
                      <Link
                        href="/perfil"
                        className={styles.dropdownItem}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        Mi Perfil
                      </Link>

                      <Link
                        href="/configuraciones"
                        className={styles.dropdownItem}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Configuración
                      </Link>

                      <div className={styles.dropdownDivider} />

                      <button
                        className={`${styles.dropdownItem} ${styles.dropdownItemLogout}`}
                        onClick={handleLogout}
                      >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1>Mis Inspecciones</h1>
              <p>Consulta el estado y resultados de tus inspecciones</p>
            </div>
            <Link href="/agendar" className={styles.newInspectionBtn}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nueva inspección
            </Link>
          </div>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.total}`}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>{stats.total}</div>
                <div className={styles.statLabel}>Total</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.progress}`}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>{stats.progress}</div>
                <div className={styles.statLabel}>En proceso</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.completed}`}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>{stats.completed}</div>
                <div className={styles.statLabel}>Completadas</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.cancelled}`}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>{stats.cancelled}</div>
                <div className={styles.statLabel}>Canceladas</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SECCIÓN BLANCA: Filtros + Cards
          ================================================================ */}
      <section className={styles.lightSection}>
        <div className={styles.lightContainer}>
          {/* Filters & Search */}
          <div className={styles.filtersSection}>
            <div className={styles.filterPills}>
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`${styles.filterPill} ${statusFilter === option.value ? styles.active : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className={styles.searchWrapper}>
              <svg className={styles.searchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por vehículo o código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* Content */}
        {filteredInspections.length === 0 ? (
          inspections.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <h3>Aún no tienes inspecciones</h3>
              <p>Aquí verás todos los autos que verifiques</p>
              <Link href="/agendar">
                Agendar inspección
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3>No hay resultados</h3>
              <p>No encontramos inspecciones que coincidan con tu búsqueda</p>
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                style={{ background: 'var(--accent-gold)', cursor: 'pointer', border: 'none' }}
              >
                Limpiar filtros
              </button>
            </div>
          )
        ) : (
          <div className={styles.inspectionsGrid}>
            {filteredInspections.map((inspection, index) => {
              const isCompleted = inspection.status === 'COMPLETED';
              const hasDefects = inspection.hasCriticalObservations ?? false;
              const hasObservations = inspection.hasObservations ?? false;
              const approvalStatus = getApprovalStatus(hasDefects, hasObservations, isCompleted);
              const showGrade = ['BASIC', 'PREMIUM'].includes(inspection.inspectionType) && inspection.grade;

              return (
                <div
                  key={inspection.id}
                  className={`${styles.inspectionCard} ${getStatusClass(inspection.status)} ${styles.animateFadeIn}`}
                  style={{ animationDelay: `${index * 60}ms` }}
                  onClick={() => handleViewReport(inspection.id)}
                >
                  {/* Card Header */}
                  <div className={styles.cardHeader}>
                    <ApprovalBadge status={approvalStatus} />
                    <span className={styles.cardCode}>{inspection.code}</span>
                  </div>

                  {/* Vehicle Info */}
                  <div className={styles.vehicleInfo}>
                    <div className={`${styles.brandLogo} ${!inspection.vehicle.brandLogo ? styles.placeholder : ''}`}>
                      {inspection.vehicle.brandLogo ? (
                        <Image
                          src={inspection.vehicle.brandLogo}
                          alt={inspection.vehicle.brand}
                          width={32}
                          height={32}
                        />
                      ) : (
                        inspection.vehicle.brand.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className={styles.vehicleDetails}>
                      <h3>{inspection.vehicle.brand} {inspection.vehicle.model} {inspection.vehicle.year}</h3>
                      {inspection.vehicle.plate && (
                        <span className={styles.plateNumber}>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21" />
                          </svg>
                          {inspection.vehicle.plate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className={styles.metaInfo}>
                    <span className={styles.metaItem}>
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      {formatearFechaLima(inspection.date)}
                    </span>
                    {inspection.location && (
                      <span className={styles.metaItem}>
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        {inspection.location}
                      </span>
                    )}
                  </div>

                  {/* Badges Row */}
                  <div className={styles.badgesRow}>
                    <span className={`${styles.typeBadge} ${getTypeBadgeClass(inspection.inspectionType)}`}>
                      {inspectionTypeLabels[inspection.inspectionType] || inspection.inspectionType}
                    </span>
                    {showGrade && (
                      <GradeStars grade={inspection.grade} size="sm" />
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className={styles.cardFooter}>
                    <button
                      className={styles.viewReportBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewReport(inspection.id);
                      }}
                    >
                      Ver informe
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>

                    {isCompleted && (
                      <button
                        className={styles.downloadBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implementar descarga PDF
                          console.log('Descargar PDF:', inspection.id);
                        }}
                      >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
