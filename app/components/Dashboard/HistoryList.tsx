/**
 * HistoryList: Lista de inspecciones pasadas, colapsable.
 * Información secundaria, no distrae de la decisión principal.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Inspection {
  id: number;
  vehicle: string;
  date: string;
  status: 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
}

interface HistoryListProps {
  inspections: Inspection[];
}

export function HistoryList({ inspections }: HistoryListProps) {
  const [expanded, setExpanded] = useState(false);

  if (inspections.length === 0) return null;

  const displayedInspections = expanded ? inspections : inspections.slice(0, 3);

  return (
    <div className="border-t border-gray-100 pt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4 group"
      >
        <span className="text-sm font-medium text-gray-500">
          Historial
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 group-hover:text-gray-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <div className="space-y-2">
        {displayedInspections.map((inspection) => (
          <HistoryItem key={inspection.id} inspection={inspection} />
        ))}
      </div>

      {!expanded && inspections.length > 3 && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Ver {inspections.length - 3} más
        </button>
      )}
    </div>
  );
}

function HistoryItem({ inspection }: { inspection: Inspection }) {
  const statusConfig = {
    COMPLETED: { icon: CheckCircle, color: 'text-emerald-500' },
    CANCELLED: { icon: XCircle, color: 'text-gray-400' },
    NO_SHOW: { icon: Clock, color: 'text-amber-500' },
  };

  const config = statusConfig[inspection.status];
  const Icon = config.icon;

  return (
    <Link
      href={`/inspecciones/${inspection.id}`}
      className="flex items-center gap-3 py-2 px-3 -mx-3 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <Icon size={16} className={config.color} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 truncate">{inspection.vehicle}</p>
      </div>
      <span className="text-xs text-gray-500">{inspection.date}</span>
    </Link>
  );
}
