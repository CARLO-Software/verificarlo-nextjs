"use client";

import { useState } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Copy, Check, Key, Loader2, AlertTriangle } from "lucide-react";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
}

interface ResetResult {
  success: boolean;
  temporaryPassword?: string;
  error?: string;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
}: ResetPasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResetResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "resetPassword",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ success: false, error: data.error || "Error al resetear la contraseña" });
        return;
      }

      setResult({
        success: true,
        temporaryPassword: data.temporaryPassword,
      });
    } catch {
      setResult({ success: false, error: "Error de conexión. Intenta nuevamente." });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setCopied(false);
    onClose();
  };

  const copyToClipboard = async () => {
    if (!result?.temporaryPassword) return;

    const text = `Email: ${userEmail}\nContraseña: ${result.temporaryPassword}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Vista de confirmación inicial
  if (!result) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Resetear contraseña">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Confirmar acción</p>
                <p className="text-sm text-amber-700 mt-1">
                  Esto generará una nueva contraseña para <strong>{userName}</strong> ({userEmail}).
                  La contraseña actual dejará de funcionar.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="
                px-4 py-2 text-sm rounded-lg font-medium
                bg-blue-600 hover:bg-blue-700
                text-white disabled:opacity-50
                transition-all flex items-center gap-2
              "
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Reseteando...
                </>
              ) : (
                <>
                  <Key size={16} />
                  Resetear contraseña
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Vista de error
  if (!result.success) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Error">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{result.error}</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Vista de éxito con la nueva contraseña
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Contraseña reseteada">
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700 mb-2">
            <Key size={20} />
            <span className="font-medium">Nueva contraseña generada</span>
          </div>
          <p className="text-sm text-green-600">
            Comparte estas credenciales con <strong>{userName}</strong>.
            El usuario podrá cambiar su contraseña desde su perfil.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Email
            </label>
            <p className="text-sm font-mono bg-white px-3 py-2 rounded border border-gray-200">
              {userEmail}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Nueva contraseña
            </label>
            <p className="text-sm font-mono bg-white px-3 py-2 rounded border border-gray-200 break-all">
              {result.temporaryPassword}
            </p>
          </div>
        </div>

        <button
          onClick={copyToClipboard}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
            font-medium text-sm transition-all
            ${copied
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }
          `}
        >
          {copied ? (
            <>
              <Check size={18} />
              Copiado al portapapeles
            </>
          ) : (
            <>
              <Copy size={18} />
              Copiar credenciales
            </>
          )}
        </button>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-700">
            <strong>Importante:</strong> Esta es la única vez que se mostrará la contraseña.
            Asegúrate de copiarla antes de cerrar esta ventana.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleClose}
            className="
              px-4 py-2 text-sm rounded-lg font-medium
              bg-gradient-to-r from-yellow-400 to-yellow-500
              hover:from-yellow-500 hover:to-yellow-600
              text-gray-900 transition-all
            "
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
