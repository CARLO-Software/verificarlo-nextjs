'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, Clock, Loader2, AlertCircle, Info } from 'lucide-react';
import { format, addDays, startOfToday, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface RescheduleModalProps {
  bookingId: number;
  currentDate: string;
  currentTime: string;
  onClose: () => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export function RescheduleModal({
  bookingId,
  currentDate,
  currentTime,
  onClose,
}: RescheduleModalProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generar próximos 7 días disponibles (sin domingos)
  const availableDates: { value: string; label: string }[] = [];
  let daysAdded = 0;
  let dayOffset = 1;

  while (daysAdded < 7 && dayOffset <= 14) {
    const date = addDays(startOfToday(), dayOffset);
    const dayOfWeek = getDay(date); // 0 = domingo

    if (dayOfWeek !== 0) { // Excluir domingos
      availableDates.push({
        value: format(date, 'yyyy-MM-dd'),
        label: format(date, "EEE d 'de' MMM", { locale: es }),
      });
      daysAdded++;
    }
    dayOffset++;
  }

  // Cargar slots cuando cambia la fecha
  useEffect(() => {
    if (!selectedDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSlots([]);
      setSelectedSlot(null);

      try {
        const res = await fetch(`/api/availability?date=${selectedDate}`);
        const data = await res.json();

        if (res.ok && data.slots) {
          setSlots(data.slots);
        } else {
          setSlots([]);
        }
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate]);

  const handleSubmit = async () => {
    if (!selectedDate || !selectedSlot) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDate: selectedDate,
          newTimeSlot: selectedSlot,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al reprogramar');
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSubmitting(false);
    }
  };

  const availableSlots = slots.filter((s) => s.available);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Reprogramar cita</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info */}
        <div className="px-4 pt-4">
          <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs">
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            <p>Puedes reprogramar 1 vez sin costo. Solo disponible hasta 24h antes de tu cita.</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Info actual */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Cita actual</p>
            <p className="text-sm text-gray-900">{currentDate} a las {currentTime}</p>
          </div>

          {/* Selector de fecha */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar size={14} />
              Nueva fecha
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {availableDates.map((date) => (
                <button
                  key={date.value}
                  onClick={() => setSelectedDate(date.value)}
                  className={`
                    p-2 text-left text-sm rounded-lg border transition-colors
                    ${selectedDate === date.value
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="capitalize">{date.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selector de hora */}
          {selectedDate && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Clock size={14} />
                Nueva hora
              </label>

              {loadingSlots ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay horarios disponibles para esta fecha
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`
                        py-2 px-3 text-sm rounded-lg border transition-colors
                        ${selectedSlot === slot.time
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedSlot || submitting}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Reprogramando...
              </>
            ) : (
              'Confirmar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
