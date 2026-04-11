/**
 * UpcomingCard: Card de próxima inspección confirmada.
 * Muestra fecha, hora y acciones de gestión.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { RescheduleModal } from './RescheduleModal';

interface UpcomingCardProps {
  inspection: {
    id: number;
    vehicle: string;
    date: string;
    time: string;
    location: string | null;
    plan: string;
    canReschedule?: boolean; // true si faltan más de 24h
  };
}

export function UpcomingCard({ inspection }: UpcomingCardProps) {
  const [showReschedule, setShowReschedule] = useState(false);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        {/* Header */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">Próxima inspección</p>
          <h2 className="text-lg font-semibold text-gray-900">{inspection.vehicle}</h2>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={14} className="text-gray-400" />
            <span>{inspection.date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={14} className="text-gray-400" />
            <span>{inspection.time}</span>
          </div>
          {inspection.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={14} className="text-gray-400" />
              <span>{inspection.location}</span>
            </div>
          )}
        </div>

        {/* Plan tag */}
        <div className="mb-5">
          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
            {inspection.plan}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href={`/inspecciones/${inspection.id}`}
            className="flex-1 py-2.5 px-4 text-center text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Ver detalles
          </Link>
          {inspection.canReschedule && (
            <button
              onClick={() => setShowReschedule(true)}
              className="py-2.5 px-4 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Reprogramar
            </button>
          )}
        </div>
      </div>

      {/* Modal de reprogramación */}
      {showReschedule && (
        <RescheduleModal
          bookingId={inspection.id}
          currentDate={inspection.date}
          currentTime={inspection.time}
          onClose={() => setShowReschedule(false)}
        />
      )}
    </>
  );
}
