'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, MapPin, Loader2, Check } from 'lucide-react';

interface ProfileFormProps {
  initialData: {
    name: string;
    phone: string;
    address: string;
    district: string;
  };
  email: string;
}

export function ProfileForm({ initialData, email }: ProfileFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar');
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges =
    formData.name !== initialData.name ||
    formData.phone !== initialData.phone ||
    formData.address !== initialData.address ||
    formData.district !== initialData.district;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {/* Nombre */}
        <div className="p-4">
          <label className="flex items-center gap-3">
            <User size={16} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Nombre</p>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-sm text-gray-900 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none"
                placeholder="Tu nombre completo"
              />
            </div>
          </label>
        </div>

        {/* Email (no editable) */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="text-sm text-gray-500">{email}</p>
            </div>
          </div>
        </div>

        {/* Teléfono */}
        <div className="p-4">
          <label className="flex items-center gap-3">
            <Phone size={16} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Teléfono</p>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-sm text-gray-900 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none"
                placeholder="Tu número de teléfono"
              />
            </div>
          </label>
        </div>

        {/* Dirección */}
        <div className="p-4">
          <label className="flex items-center gap-3">
            <MapPin size={16} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Dirección</p>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-sm text-gray-900 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none"
                placeholder="Tu dirección"
              />
            </div>
          </label>
        </div>

        {/* Distrito */}
        <div className="p-4">
          <label className="flex items-center gap-3">
            <MapPin size={16} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Distrito</p>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full text-sm text-gray-900 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none"
                placeholder="Tu distrito"
              />
            </div>
          </label>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      {/* Botón guardar */}
      {hasChanges && (
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Guardando...
            </>
          ) : success ? (
            <>
              <Check size={16} />
              Guardado
            </>
          ) : (
            'Guardar cambios'
          )}
        </button>
      )}
    </form>
  );
}
