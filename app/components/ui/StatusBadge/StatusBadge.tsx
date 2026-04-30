'use client';

import { BookingStatus } from '@prisma/client';

type InspectionStatus = BookingStatus | 'CRITICAL';
type LegalStatus = 'BLOQUEADO' | 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO';

interface StatusBadgeProps {
  status: InspectionStatus;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

interface LegalStatusBadgeProps {
  status: LegalStatus | null | undefined;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, {
  label: string;
  bg: string;
  text: string;
  icon?: string;
}> = {
  PENDING_PAYMENT: {
    label: 'Pendiente de pago',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
  },
  PENDING_VERIFICATION: {
    label: 'Verificando pago',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
  },
  PAID: {
    label: 'Pagado',
    bg: 'bg-green-50',
    text: 'text-green-600',
  },
  COMPLETED: {
    label: 'Completada',
    bg: 'bg-green-50',
    text: 'text-green-600',
    icon: '✓',
  },
  CANCELLED: {
    label: 'Cancelada',
    bg: 'bg-gray-100',
    text: 'text-gray-500',
  },
  NO_SHOW: {
    label: 'No asistió',
    bg: 'bg-gray-100',
    text: 'text-gray-500',
  },
  EXPIRED: {
    label: 'Expirada',
    bg: 'bg-gray-100',
    text: 'text-gray-400',
  },
  CRITICAL: {
    label: 'Observaciones críticas',
    bg: 'bg-red-50',
    text: 'text-red-600',
    icon: '⚠',
  },
};

const legalStatusConfig: Record<LegalStatus, {
  label: string;
  bg: string;
  text: string;
  icon?: string;
  tooltip?: string;
}> = {
  BLOQUEADO: {
    label: 'Bloqueado',
    bg: 'bg-red-50',
    text: 'text-red-600',
    icon: '🔒',
    tooltip: 'El mecánico debe registrar la placa del vehículo para desbloquear la revisión legal',
  },
  PENDIENTE: {
    label: 'Pendiente',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
  },
  EN_PROCESO: {
    label: 'En proceso',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
  },
  COMPLETADO: {
    label: 'Completado',
    bg: 'bg-green-50',
    text: 'text-green-600',
    icon: '✓',
  },
};

const sizeClasses = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-3 py-1',
  lg: 'text-sm px-4 py-1.5',
};

export function StatusBadge({ status, size = 'md', pulse = false }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-semibold
        ${config.bg} ${config.text} ${sizeClasses[size]}
        ${pulse ? 'animate-pulse' : ''}
        transition-all duration-200
      `}
    >
      {config.icon && <span>{config.icon}</span>}
      {config.label}
    </span>
  );
}

/**
 * Badge específico para mostrar el estado de la revisión legal (para admin)
 * Este estado es independiente del estado del mecánico
 */
export function LegalStatusBadge({ status, size = 'md' }: LegalStatusBadgeProps) {
  if (!status) {
    return (
      <span
        className={`
          inline-flex items-center gap-1 rounded-full font-semibold
          bg-gray-100 text-gray-400 ${sizeClasses[size]}
        `}
      >
        Sin asignar
      </span>
    );
  }

  const config = legalStatusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-semibold
        ${config.bg} ${config.text} ${sizeClasses[size]}
        transition-all duration-200
        ${config.tooltip ? 'cursor-help' : ''}
      `}
      title={config.tooltip}
    >
      {config.icon && <span>{config.icon}</span>}
      {config.label}
    </span>
  );
}
