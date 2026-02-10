"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/app/components/ui/Modal";

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
  const [error, setError] = useState("");

  const isConfirmed = confirmText.toLowerCase() === "eliminar";

  // Reset al abrir/cerrar
  useEffect(() => {
    if (!isOpen) {
      setConfirmText("");
      setError("");
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
