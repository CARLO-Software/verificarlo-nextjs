"use client";

import { useState } from "react";
import { Shield, Eye, EyeOff, Check, X, Loader2 } from "lucide-react";

interface ChangePasswordSectionProps {
  hasPassword: boolean;
}

export function ChangePasswordSection({ hasPassword }: ChangePasswordSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validaciones de contraseña
  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%&*]/.test(newPassword),
    match: newPassword === confirmPassword && confirmPassword.length > 0,
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!currentPassword) {
      setError("Ingresa tu contraseña actual");
      return;
    }

    if (!isPasswordValid) {
      setError("La contraseña no cumple con todos los requisitos");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al cambiar la contraseña");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Cerrar el formulario después de un momento
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setError("");
    setSuccess(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // Si el usuario usa Google (no tiene contraseña), mostrar mensaje informativo
  if (!hasPassword) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Seguridad</h3>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Shield size={20} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Inicio de sesión con Google</p>
            <p className="text-xs text-gray-500">
              Tu cuenta está vinculada a Google. No necesitas una contraseña.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Seguridad</h3>
      </div>

      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Shield size={20} className="text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Cambiar contraseña</p>
            <p className="text-xs text-gray-500">Actualiza tu contraseña de acceso</p>
          </div>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contraseña actual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña actual
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa tu nueva contraseña"
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Requisitos de contraseña */}
          {newPassword && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-medium text-gray-600 mb-2">Requisitos:</p>
              <PasswordCheck label="Mínimo 8 caracteres" passed={passwordChecks.length} />
              <PasswordCheck label="Al menos una mayúscula" passed={passwordChecks.uppercase} />
              <PasswordCheck label="Al menos una minúscula" passed={passwordChecks.lowercase} />
              <PasswordCheck label="Al menos un número" passed={passwordChecks.number} />
              <PasswordCheck label="Al menos un caracter especial (!@#$%&*)" passed={passwordChecks.special} />
            </div>
          )}

          {/* Confirmar contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu nueva contraseña"
                className={`
                  w-full px-3 py-2.5 pr-10 rounded-lg border text-sm
                  focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400
                  ${confirmPassword && !passwordChecks.match ? "border-red-300 bg-red-50" : "border-gray-200"}
                `}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && !passwordChecks.match && (
              <p className="text-xs text-red-600 mt-1">Las contraseñas no coinciden</p>
            )}
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Mensaje de éxito */}
          {success && (
            <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
              <Check size={16} />
              Contraseña actualizada correctamente
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="
                px-4 py-2 text-sm rounded-lg font-medium
                bg-gradient-to-r from-yellow-400 to-yellow-500
                hover:from-yellow-500 hover:to-yellow-600
                text-gray-900 disabled:opacity-50
                transition-all flex items-center gap-2
              "
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                "Cambiar contraseña"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function PasswordCheck({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {passed ? (
        <Check size={14} className="text-green-500" />
      ) : (
        <X size={14} className="text-gray-400" />
      )}
      <span className={passed ? "text-green-600" : "text-gray-500"}>{label}</span>
    </div>
  );
}
