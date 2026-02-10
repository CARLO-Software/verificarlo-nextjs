"use client";

import { useState } from "react";
import { Modal } from "@/app/components/ui/Modal";

interface SuspendModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; name: string | null; status: "ACTIVE" | "SUSPENDED" };
  onConfirm: () => Promise<void>;
}

export function SuspendModal({
  isOpen,
  onClose,
  user,
  onConfirm,
}: SuspendModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSuspending = user.status === "ACTIVE";
  const title = isSuspending ? "Suspender usuario" : "Reactivar usuario";

  const handleConfirm = async () => {
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
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <p className="text-sm text-gray-600 mb-1">
        <span className="font-medium text-gray-900">{user.name ?? "Sin nombre"}</span>
      </p>
      <p className="text-sm text-gray-500 mb-4">
        {isSuspending
          ? "Este usuario no podrá acceder al sistema. Podrás reactivarlo en cualquier momento."
          : "El usuario recuperará el acceso al sistema con su rol actual."}
      </p>

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
          disabled={loading}
          className={`px-4 py-2 text-sm rounded-md text-white disabled:opacity-50 ${
            isSuspending
              ? "bg-amber-600 hover:bg-amber-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading
            ? isSuspending
              ? "Suspendiendo..."
              : "Reactivando..."
            : isSuspending
              ? "Suspender"
              : "Reactivar"}
        </button>
      </div>
    </Modal>
  );
}
