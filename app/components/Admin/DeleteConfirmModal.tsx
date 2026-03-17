"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/app/components/ui/Modal";

interface BookingStats {
  total: number;
  PENDING_PAYMENT: number;
  PENDING_VERIFICATION: number;
  PAID: number;
  CONFIRMED: number;
  COMPLETED: number;
  CANCELLED: number;
  NO_SHOW: number;
  EXPIRED: number;
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; name: string | null; email: string };
  onConfirm: () => Promise<void>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pendientes de pago",
  PENDING_VERIFICATION: "Pendientes de verificación",
  PAID: "Pagadas",
  CONFIRMED: "Confirmadas",
  COMPLETED: "Completadas",
  CANCELLED: "Canceladas",
  NO_SHOW: "No presentados",
  EXPIRED: "Expiradas",
};

export function DeleteConfirmModal({
  isOpen,
  onClose,
  user,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<{
    asClient: BookingStats;
    asInspector: BookingStats;
  } | null>(null);

  const isConfirmed = confirmText.toLowerCase() === "eliminar";

  // Cargar estadísticas al abrir
  useEffect(() => {
    if (isOpen && user.id) {
      setLoadingStats(true);
      fetch(`/api/admin/users/${user.id}/bookings-stats`)
        .then((res) => res.json())
        .then((data) => {
          setStats(data);
        })
        .catch((err) => {
          console.error("Error cargando stats:", err);
        })
        .finally(() => {
          setLoadingStats(false);
        });
    }
  }, [isOpen, user.id]);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setConfirmText("");
      setError("");
      setStats(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!isConfirmed) return;
    setLoading(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  // Renderizar estadísticas de reservas
  const renderBookingStats = (bookingStats: BookingStats, title: string) => {
    if (bookingStats.total === 0) return null;

    const statuses = Object.entries(bookingStats).filter(
      ([key, value]) => key !== "total" && value > 0
    );

    return (
      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700 mb-1">{title}: {bookingStats.total}</p>
        <ul className="text-xs text-gray-600 ml-4 space-y-0.5">
          {statuses.map(([status, count]) => (
            <li key={status}>
              • {STATUS_LABELS[status] || status}: <span className="font-medium">{count}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const hasBookings = stats && (stats.asClient.total > 0 || stats.asInspector.total > 0);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Eliminar usuario">
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-1">
          Estás a punto de eliminar a:
        </p>
        <p className="text-sm font-medium text-gray-900">
          {user.name ?? "Sin nombre"}
        </p>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>

      {/* Mostrar estadísticas de reservas */}
      {loadingStats ? (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-500">Cargando reservas asociadas...</p>
        </div>
      ) : hasBookings ? (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm font-medium text-amber-800 mb-2">
            Se eliminarán las siguientes reservas:
          </p>
          {stats && renderBookingStats(stats.asClient, "Como cliente")}
          {stats && renderBookingStats(stats.asInspector, "Como inspector")}
        </div>
      ) : stats ? (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">
            Este usuario no tiene reservas asociadas.
          </p>
        </div>
      ) : null}

      <p className="text-sm text-red-600 mb-3">
        Esta acción es irreversible. Escribe{" "}
        <span className="font-bold">eliminar</span> para confirmar.
      </p>

      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder='Escribe "eliminar"'
        className="w-full border rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-400"
        disabled={loading}
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={handleClose}
          disabled={loading}
          className="px-4 py-2 text-sm rounded-md border hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isConfirmed || loading}
          className={`px-4 py-2 text-sm rounded-md text-white bg-red-600 hover:bg-red-700 ${
            !isConfirmed || loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Eliminando..." : "Eliminar"}
        </button>
      </div>
    </Modal>
  );
}
