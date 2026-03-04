"use client";

import { useState, useCallback } from "react";
import type { UserProfile, UpdateProfileData } from "@/types/profile";

interface UseProfileReturn {
  formData: UpdateProfileData;
  errors: Record<string, string>;
  isLoading: boolean;
  isDirty: boolean;
  handleChange: (field: keyof UpdateProfileData, value: string) => void;
  handleSubmit: () => Promise<{ success: boolean; error?: string }>;
  resetForm: () => void;
}

export function useProfile(user: UserProfile): UseProfileReturn {
  const [formData, setFormData] = useState<UpdateProfileData>({
    name: user.name || "",
    phone: user.phone || "",
    address: user.address || "",
    district: user.district || "",
  });

  const [initialData] = useState(formData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  const handleChange = useCallback(
    (field: keyof UpdateProfileData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error when field changes
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

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Error al actualizar" };
      }

      return { success: true };
    } catch {
      return { success: false, error: "Error de conexión" };
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
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
