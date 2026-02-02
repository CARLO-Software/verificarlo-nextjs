'use client';

import { useState, useCallback } from 'react';
import { updateProfile } from './actions';
import type { UserProfile, UpdateProfileData } from '@/types/profile';

// ============================================
// useProfile: Hook para manejar el formulario de perfil
//
// Encapsula:
// - Estado del formulario
// - Validaciones en cliente
// - Llamada al Server Action
// - Manejo de loading/errores
// ============================================

interface UseProfileReturn {
  formData: UpdateProfileData;
  errors: Record<string, string>;
  isLoading: boolean;
  isDirty: boolean;  // true si hay cambios sin guardar

  // Funciones
  handleChange: (field: keyof UpdateProfileData, value: string | Record<string, string[]>) => void;
  handleSubmit: () => Promise<boolean>;
  resetForm: () => void;
}

export function useProfile(initialData: UserProfile): UseProfileReturn {
  // Estado del formulario (solo campos editables)
  const [formData, setFormData] = useState<UpdateProfileData>({
    name: initialData.name,
    phone: initialData.phone || '',
    image: initialData.image || '',
    availability: initialData.availability || {},
    address: initialData.address || '',
    district: initialData.district || '',
  });

  // Estado de errores por campo
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Loading mientras se guarda
  const [isLoading, setIsLoading] = useState(false);

  // Detecta si hay cambios sin guardar
  const [isDirty, setIsDirty] = useState(false);

  // Handler para cambios en inputs
  const handleChange = useCallback(
    (field: keyof UpdateProfileData, value: string | Record<string, string[]>) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);

      // Limpiar error del campo cuando el usuario escribe
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Validación en cliente (antes de enviar)
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Nombre obligatorio
    if (!formData.name?.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    // Teléfono (opcional pero si lo pone, debe ser válido)
    if (formData.phone?.trim()) {
      const phoneClean = formData.phone.replace(/\s/g, '');
      if (!/^9\d{8}$/.test(phoneClean)) {
        newErrors.phone = 'Formato: 9XXXXXXXX (9 dígitos)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handler para submit
  const handleSubmit = useCallback(async (): Promise<boolean> => {
    // 1. Validar en cliente primero
    if (!validateForm()) {
      return false;
    }

    setIsLoading(true);

    try {
      // 2. Llamar al Server Action
      const result = await updateProfile(formData);

      if (!result.success) {
        // Mostrar error del servidor
        setErrors({ _server: result.error || 'Error al guardar' });
        return false;
      }

      // 3. Éxito: limpiar estado dirty
      setIsDirty(false);
      return true;
    } catch (error) {
      console.error('Error al guardar:', error);
      setErrors({ _server: 'Error de conexión. Intenta de nuevo.' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm]);

  // Resetear formulario a valores iniciales
  const resetForm = useCallback(() => {
    setFormData({
      name: initialData.name,
      phone: initialData.phone || '',
      image: initialData.image || '',
      availability: initialData.availability || {},
      address: initialData.address || '',
      district: initialData.district || '',
    });
    setErrors({});
    setIsDirty(false);
  }, [initialData]);

  return {
    formData,
    errors,
    isLoading,
    isDirty,
    handleChange,
    handleSubmit,
    resetForm,
  };
}
