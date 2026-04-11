/**
 * ResultCard: Card de resultado de inspección.
 * Muestra score y acceso al informe.
 */
import Link from 'next/link';
import { FileText, Download, CheckCircle, AlertTriangle } from 'lucide-react';

interface ResultCardProps {
  inspection: {
    id: number;
    vehicle: string;
    completedAt: string;
    score: number | null;
    status: 'GOOD' | 'WARNING' | 'CRITICAL' | null;
    hasReport: boolean;
  };
}

export function ResultCard({ inspection }: ResultCardProps) {
  const statusConfig = {
    GOOD: { label: 'Buen estado', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
    WARNING: { label: 'Atención', color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertTriangle },
    CRITICAL: { label: 'Crítico', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
  };

  const config = inspection.status ? statusConfig[inspection.status] : null;
  const StatusIcon = config?.icon || CheckCircle;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Inspección completada</p>
          <h2 className="text-lg font-semibold text-gray-900">{inspection.vehicle}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{inspection.completedAt}</p>
        </div>

        {/* Score badge */}
        {inspection.score !== null && config && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded ${config.bg}`}>
            <StatusIcon size={14} className={config.color} />
            <span className={`text-sm font-medium ${config.color}`}>
              {inspection.score}/100
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href={`/inspecciones/${inspection.id}`}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <FileText size={16} />
          Ver informe
        </Link>

        {inspection.hasReport && (
          <Link
            href={`/api/reports/${inspection.id}/download`}
            className="flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            PDF
          </Link>
        )}
      </div>
    </div>
  );
}
