"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/app/components/ui/Modal";

interface BookingStats {
  total: number;
  PENDING_PAYMENT: number;
  PENDING_VERIFICATION: number;
  PAID: number;
  COMPLETED: number;
  CANCELLED: number;
  NO_SHOW: number;
  EXPIRED: number;
}

interface InspectionDetail {
  id: number;
  status: string;
  date: string;
  vehicle: {
    plate: string | null;
    model: { name: string; brand: { name: string } };
    year: number;
  };
  inspectionPlan: { title: string; price: number };
  payment: { status: string; amount: number; paidAt: string | null } | null;
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; name: string | null; email: string };
  onConfirm: () => Promise<void>;
}

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
    inspections: InspectionDetail[];
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

      {/* Mostrar inspecciones asociadas */}
      {loadingStats ? (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-500">Cargando inspecciones asociadas...</p>
        </div>
      ) : stats?.inspections && stats.inspections.length > 0 ? (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm font-medium text-amber-800 mb-2">
            Inspecciones asociadas ({stats.inspections.length}):
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stats.inspections.map((insp) => {
              const paid = insp.payment?.paidAt != null;
              return (
                <div key={insp.id} className="text-xs bg-white rounded p-2 border border-amber-100">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {insp.vehicle.model.brand.name} {insp.vehicle.model.name} {insp.vehicle.year}
                        {insp.vehicle.plate && ` — ${insp.vehicle.plate}`}
                      </p>
                      <p className="text-gray-500">{insp.inspectionPlan.title}</p>
                    </div>
                    <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      paid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {paid ? "Pagado" : "No pagado"}
                    </span>
                  </div>
                  {paid && insp.payment && (
                    <p className="text-gray-500 mt-0.5">
                      S/ {(insp.payment.amount / 100).toFixed(2)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : stats ? (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">
            Este usuario no tiene inspecciones asociadas.
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
