"use client";

import { useState } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Copy, Check, Key } from "lucide-react";

type Role = "CLIENT" | "INSPECTOR" | "ADMIN";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: Role;
    status: "ACTIVE";
    createdAt: string;
  }) => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  role: Role | "";
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface CreatedUser {
  name: string;
  email: string;
  temporaryPassword: string;
}

export function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    role: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Estado para mostrar la contraseña generada
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [copied, setCopied] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (formData.phone && !/^\d{9}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Debe tener 9 dígitos";
    }

    if (!formData.role) {
      newErrors.role = "Selecciona un rol";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
          role: formData.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error || "Error al crear usuario");
        return;
      }

      // Guardar la información del usuario creado con su contraseña temporal
      setCreatedUser({
        name: data.name,
        email: data.email,
        temporaryPassword: data.temporaryPassword,
      });

      // Notificar éxito (sin cerrar el modal aún)
      onSuccess(data);
    } catch {
      setApiError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "",
    });
    setErrors({});
    setApiError("");
    setCreatedUser(null);
    setCopied(false);
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const copyToClipboard = async () => {
    if (!createdUser) return;

    const text = `Email: ${createdUser.email}\nContraseña: ${createdUser.temporaryPassword}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback para navegadores que no soportan clipboard API
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

  // Si el usuario fue creado, mostrar la contraseña generada
  if (createdUser) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Usuario creado">
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <Key size={20} />
              <span className="font-medium">Credenciales de acceso</span>
            </div>
            <p className="text-sm text-green-600 mb-3">
              Comparte estas credenciales con <strong>{createdUser.name}</strong> para que pueda acceder al sistema.
              El usuario podrá cambiar su contraseña desde su perfil.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Email
              </label>
              <p className="text-sm font-mono bg-white px-3 py-2 rounded border border-gray-200">
                {createdUser.email}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Contraseña temporal
              </label>
              <p className="text-sm font-mono bg-white px-3 py-2 rounded border border-gray-200 break-all">
                {createdUser.temporaryPassword}
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Agregar usuario">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Juan Pérez"
            className={`
              w-full px-3 py-2.5 rounded-lg border text-sm
              focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400
              ${errors.name ? "border-red-400 bg-red-50" : "border-gray-200"}
            `}
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="juan@ejemplo.com"
            className={`
              w-full px-3 py-2.5 rounded-lg border text-sm
              focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400
              ${errors.email ? "border-red-400 bg-red-50" : "border-gray-200"}
            `}
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Celular
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="987654321"
            maxLength={9}
            className={`
              w-full px-3 py-2.5 rounded-lg border text-sm
              focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400
              ${errors.phone ? "border-red-400 bg-red-50" : "border-gray-200"}
            `}
          />
          {errors.phone && (
            <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Rol */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rol <span className="text-red-500">*</span>
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={`
              w-full px-3 py-2.5 rounded-lg border text-sm
              focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400
              ${errors.role ? "border-red-400 bg-red-50" : "border-gray-200"}
            `}
          >
            <option value="">Seleccionar rol...</option>
            <option value="CLIENT">Cliente</option>
            <option value="INSPECTOR">Inspector</option>
            <option value="ADMIN">Administrador</option>
          </select>
          {errors.role && (
            <p className="text-xs text-red-600 mt-1">{errors.role}</p>
          )}
        </div>

        {/* Info sobre contraseña */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>Nota:</strong> Se generará automáticamente una contraseña segura
            que podrás compartir con el usuario. El usuario podrá cambiarla después.
          </p>
        </div>

        {/* Error de API */}
        {apiError && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">
            {apiError}
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="
              px-4 py-2 text-sm rounded-lg font-medium
              bg-gradient-to-r from-yellow-400 to-yellow-500
              hover:from-yellow-500 hover:to-yellow-600
              text-gray-900 disabled:opacity-50
              transition-all
            "
          >
            {loading ? "Creando..." : "Crear usuario"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
