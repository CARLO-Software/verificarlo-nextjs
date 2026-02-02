'use client';

import { BookingStatus } from '@prisma/client';

type InspectionStatus = BookingStatus | 'CRITICAL';

interface StatusBadgeProps {
  status: InspectionStatus;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
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
  PAID: {
    label: 'Pagado',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
  },
  CONFIRMED: {
    label: 'Confirmada',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
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
