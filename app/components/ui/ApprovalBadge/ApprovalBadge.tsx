'use client';

import styles from './ApprovalBadge.module.css';

type ApprovalStatus = 'approved' | 'not_approved' | 'observations' | 'pending';

interface ApprovalBadgeProps {
  status: ApprovalStatus;
  className?: string;
}

const statusConfig: Record<ApprovalStatus, { label: string; tooltip: string; icon: JSX.Element }> = {
  approved: {
    label: 'Aprobado',
    tooltip: 'El vehículo pasó la inspección sin problemas',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
  },
  not_approved: {
    label: 'No aprobado',
    tooltip: 'Se encontraron problemas críticos en el vehículo',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
  },
  observations: {
    label: 'Observaciones',
    tooltip: 'El vehículo tiene observaciones menores a considerar',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
  pending: {
    label: 'Pendiente',
    tooltip: 'La inspección aún no se ha realizado',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
  },
};

export function ApprovalBadge({ status, className = '' }: ApprovalBadgeProps) {
  const config = statusConfig[status];

  return (
    <div
      className={`${styles.badge} ${styles[status]} ${className}`}
      data-tooltip={config.tooltip}
    >
      <span className={styles.icon}>{config.icon}</span>
      <span className={styles.label}>{config.label}</span>
    </div>
  );
}

// Helper para determinar el status basado en resultados de inspección
export function getApprovalStatus(
  hasDefects: boolean,
  hasObservations: boolean,
  isCompleted: boolean
): ApprovalStatus {
  if (!isCompleted) return 'pending';
  if (hasDefects) return 'not_approved';
  if (hasObservations) return 'observations';
  return 'approved';
}
