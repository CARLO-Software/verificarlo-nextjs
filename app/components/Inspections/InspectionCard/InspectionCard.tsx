'use client';

import { StatusBadge } from '@/app/components/ui/StatusBadge/StatusBadge';
import { ProgressBar } from '@/app/components/ui/ProgressBar/ProgressBar';
import { ResultIndicator } from '@/app/components/ui/ResultIndicator/ResultIndicator';
import { formatearFechaLima } from '@/app/domain/datetime';
import { BookingStatus } from '@prisma/client';

interface InspectionCardProps {
  inspection: {
    id: number;
    code: string;
    status: BookingStatus;
    date: Date | string;
    vehicle: {
      brand: string;
      model: string;
      year: number;
      plate: string | null;
    };
    location?: string;
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
  };
  onClick?: () => void;
  onViewReport?: () => void;
  onDownloadPdf?: () => void;
}

const statusBorderColors: Record<string, string> = {
  PENDING_PAYMENT: 'border-l-gray-400',
  PAID: 'border-l-blue-400',
  CONFIRMED: 'border-l-[#FFE14C]',
  COMPLETED: 'border-l-green-500',
  CANCELLED: 'border-l-gray-300',
  NO_SHOW: 'border-l-gray-300',
  EXPIRED: 'border-l-gray-300',
  CRITICAL: 'border-l-red-500',
};

export function InspectionCard({
  inspection,
  onClick,
  onViewReport,
  onDownloadPdf,
}: InspectionCardProps) {
  const isCompleted = inspection.status === 'COMPLETED';
  const isInProgress = inspection.status === 'CONFIRMED' || inspection.status === 'PAID';
  const displayStatus = inspection.hasCriticalObservations ? 'CRITICAL' : inspection.status;
  const borderColor = statusBorderColors[displayStatus];

  const progressPercent = inspection.progress
    ? (inspection.progress.current / inspection.progress.total) * 100
    : 0;

  return (
    <div
      onClick={onClick}
      className={`
        bg-white border border-gray-200 rounded-xl
        border-l-[3px] ${borderColor}
        p-6 cursor-pointer
        hover:-translate-y-1 hover:shadow-md
        transition-all duration-300 ease-out
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <StatusBadge
          status={displayStatus}
          pulse={isInProgress}
        />
        <span className="text-xs font-mono text-gray-400">
          {inspection.code}
        </span>
      </div>

      {/* Vehicle info */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-[#2D2D2D]">
          {inspection.vehicle.brand} {inspection.vehicle.model} {inspection.vehicle.year}
        </h3>
        {inspection.vehicle.plate && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <span>{inspection.vehicle.plate}</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatearFechaLima(inspection.date)}</span>
        </div>
        {inspection.location && (
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{inspection.location}</span>
          </div>
        )}
      </div>

      {/* Results (only if completed) */}
      {isCompleted && inspection.results && (
        <div className="mb-4">
          <ResultIndicator
            results={[
              { category: 'Legal', status: inspection.results.legal },
              { category: 'Mecánica', status: inspection.results.mechanical },
              { category: 'Carrocería', status: inspection.results.body },
            ]}
          />
        </div>
      )}

      {/* Progress bar (only if in progress) */}
      {isInProgress && inspection.progress && (
        <div className="mb-4">
          <ProgressBar
            progress={progressPercent}
            currentStep={inspection.progress.current}
            totalSteps={inspection.progress.total}
            stepLabel={inspection.progress.label}
          />
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-100 my-4" />

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewReport?.();
          }}
          className="
            text-sm font-semibold text-[#2D2D2D]
            hover:text-[#FFE14C]
            transition-colors duration-200
            flex items-center gap-1
          "
        >
          Ver informe
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {isCompleted && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownloadPdf?.();
            }}
            className="
              text-sm text-gray-500
              hover:text-[#2D2D2D]
              transition-colors duration-200
              flex items-center gap-1
            "
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descargar PDF
          </button>
        )}
      </div>
    </div>
  );
}
