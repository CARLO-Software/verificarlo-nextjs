"use client";

import { useState } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Eye, EyeOff } from "lucide-react";

type Role = "CLIENT" | "INSPECTOR";

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
  password: string;
  confirmPassword: string;
  role: Role | "";
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
}

export function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    if (!formData.password) {
      newErrors.password = "La contraseña es obligatoria";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
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
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error || "Error al crear usuario");
        return;
      }

      onSuccess(data);
      handleClose();
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
      password: "",
      confirmPassword: "",
      role: "",
    });
    setErrors({});
    setApiError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
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
          </select>
          {errors.role && (
            <p className="text-xs text-red-600 mt-1">{errors.role}</p>
          )}
        </div>

        {/* Contraseña */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              className={`
                w-full px-3 py-2.5 pr-10 rounded-lg border text-sm
                focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400
                ${errors.password ? "border-red-400 bg-red-50" : "border-gray-200"}
              `}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600 mt-1">{errors.password}</p>
          )}
        </div>

        {/* Confirmar contraseña */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar contraseña <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repite la contraseña"
              className={`
                w-full px-3 py-2.5 pr-10 rounded-lg border text-sm
                focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400
                ${errors.confirmPassword ? "border-red-400 bg-red-50" : "border-gray-200"}
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
          {errors.confirmPassword && (
            <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
          )}
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
