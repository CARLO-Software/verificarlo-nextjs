'use server';

// ============================================
// Server Actions para el Perfil de Usuario
//
// ¿Por qué Server Actions en lugar de API Routes?
// 1. Más simples: no hay que manejar req/res manualmente
// 2. Type-safe: TypeScript end-to-end
// 3. Pueden llamarse directamente desde el cliente
// 4. Next.js las optimiza automáticamente
// ============================================

import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { UpdateProfileData, ActionResponse, UserProfile } from '@/types/profile';

// ============================================
// OBTENER PERFIL
// ============================================
export async function getProfile(): Promise<ActionResponse<UserProfile>> {
  try {
    // 1. Obtener sesión del usuario autenticado
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return { success: false, error: 'No autenticado' };
    }

    // 2. Buscar usuario en BD
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        isInspectorAvailable: true,
        status: true,
        createdAt: true,
        availability: true,
        address: true,
        district: true,
      },
    });

    if (!user) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // 3. Transformar availability de JSON a objeto tipado
    return {
      success: true,
      data: {
        ...user,
        availability: user.availability as Record<string, string[]> | null,
      },
    };
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return { success: false, error: 'Error al cargar el perfil' };
  }
}

// ============================================
// ACTUALIZAR PERFIL
// ============================================
export async function updateProfile(
  data: UpdateProfileData
): Promise<ActionResponse<UserProfile>> {
  try {
    // 1. Obtener sesión
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return { success: false, error: 'No autenticado' };
    }

    // 2. Obtener usuario actual para verificar rol
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // 3. Filtrar campos según el rol (SEGURIDAD EN BACKEND)
    // Solo permite actualizar campos que corresponden al rol
    const allowedData = filterDataByRole(data, currentUser.role);

    // 4. Validar datos
    const validation = validateProfileData(allowedData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 5. Actualizar en BD
    const updatedUser = await db.user.update({
      where: { id: currentUser.id },
      data: {
        ...allowedData,
        // Convertir availability a JSON si existe
        availability: allowedData.availability
          ? JSON.parse(JSON.stringify(allowedData.availability))
          : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        isInspectorAvailable: true,
        status: true,
        createdAt: true,
        availability: true,
        address: true,
        district: true,
      },
    });

    // 6. Revalidar la página del perfil (actualiza el caché)
    revalidatePath('/perfil');

    return {
      success: true,
      data: {
        ...updatedUser,
        availability: updatedUser.availability as Record<string, string[]> | null,
      },
    };
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return { success: false, error: 'Error al actualizar el perfil' };
  }
}

// ============================================
// HELPERS PRIVADOS
// ============================================

/**
 * Filtra los datos según el rol del usuario
 * IMPORTANTE: Esta es la capa de seguridad real
 */
function filterDataByRole(
  data: UpdateProfileData,
  role: string
): UpdateProfileData {
  // Campos comunes que todos pueden editar
  const baseFields: UpdateProfileData = {
    name: data.name,
    phone: data.phone,
    image: data.image,
  };

  switch (role) {
    case 'ADMIN':
      // Admin puede editar todo
      return data;

    case 'INSPECTOR':
      // Inspector: campos comunes + zona y disponibilidad
      return {
        ...baseFields,
        availability: data.availability,
      };

    case 'CLIENT':
      // Cliente: campos comunes + dirección
      return {
        ...baseFields,
        address: data.address,
        district: data.district,
      };

    default:
      return baseFields;
  }
}

/**
 * Valida los datos del perfil
 */
function validateProfileData(
  data: UpdateProfileData
): { valid: boolean; error?: string } {
  // Validar nombre (mínimo 2 caracteres)
  if (data.name !== undefined && data.name.trim().length < 2) {
    return { valid: false, error: 'El nombre debe tener al menos 2 caracteres' };
  }

  // Validar teléfono (formato peruano: 9 dígitos)
  if (data.phone !== undefined && data.phone.trim()) {
    const phoneRegex = /^9\d{8}$/;
    if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
      return { valid: false, error: 'El teléfono debe tener 9 dígitos y empezar con 9' };
    }
  }

  return { valid: true };
}
