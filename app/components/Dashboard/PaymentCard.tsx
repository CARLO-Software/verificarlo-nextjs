/**
 * PaymentCard: Card de pago pendiente.
 * Prioridad máxima - requiere acción inmediata.
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';

interface PaymentCardProps {
  inspection: {
    id: number;
    vehicle: string;
    plan: string;
    price: number;
    expiresAt: Date;
  };
}

export function PaymentCard({ inspection }: PaymentCardProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    function updateTimer() {
      const now = new Date();
      const expires = new Date(inspection.expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expirado');
        setIsUrgent(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }

      setIsUrgent(diff < 1000 * 60 * 10); // < 10 min
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [inspection.expiresAt]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Pago pendiente</p>
          <h2 className="text-lg font-semibold text-gray-900">{inspection.vehicle}</h2>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
          isUrgent ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
        }`}>
          <Clock size={12} />
          {timeLeft}
        </div>
      </div>

      {/* Details */}
      <div className="flex items-baseline justify-between mb-5">
        <span className="text-sm text-gray-500">{inspection.plan}</span>
        <span className="text-xl font-semibold text-gray-900">S/ {inspection.price}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href={`/inspecciones/${inspection.id}`}
          className="flex-1 py-2.5 px-4 text-center text-sm font-medium text-gray-900 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Pagar ahora
        </Link>
        <Link
          href={`/inspecciones/${inspection.id}`}
          className="py-2.5 px-4 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Ver detalles
        </Link>
      </div>
    </div>
  );
}
