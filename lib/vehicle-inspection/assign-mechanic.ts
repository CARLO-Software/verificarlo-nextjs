/**
 * Selección automática de mecánico para una nueva inspección.
 *
 * Criterios (en orden):
 *  1. role = INSPECTOR, status = ACTIVE, isInspectorAvailable = true
 *  2. Menor cantidad de inspecciones activas (PENDIENTE + EN_PROCESO)
 *  3. Empate → selección aleatoria (evita sesgo al primer registro)
 *
 * Este servicio NO modifica la BD. Solo retorna el ID seleccionado.
 * La escritura la hace quien llama (API route o servicio superior).
 */

import { db } from "@/lib/db";

// ============================================
// TIPOS DE RETORNO
// ============================================

export type SelectMechanicResult =
  | { success: true; mechanicId: string; mechanicName: string }
  | { success: false; error: string };

// ============================================
// SELECCIÓN
// ============================================

export async function selectAvailableMechanic(): Promise<SelectMechanicResult> {
  // 1. Mecánicos activos y disponibles
  const mechanics = await db.user.findMany({
    where: {
      role: "INSPECTOR",
      status: "ACTIVE",
      isInspectorAvailable: true,
    },
    select: { id: true, name: true },
  });

  if (mechanics.length === 0) {
    return { success: false, error: "No hay mecánicos disponibles" };
  }

  // 2. Carga activa por mecánico (casos que aún no terminan)
  const withWorkload = await Promise.all(
    mechanics.map(async (m) => {
      const activeCount = await db.vehicleInspection.count({
        where: {
          assignedMechanicId: m.id,
          mechanicalStatus: { in: ["PENDIENTE", "EN_PROCESO"] },
        },
      });
      return { ...m, activeCount };
    })
  );

  // 3. Mínima carga → candidatos → aleatorio
  const minLoad = Math.min(...withWorkload.map((m) => m.activeCount));
  const candidates = withWorkload.filter((m) => m.activeCount === minLoad);
  const selected = candidates[Math.floor(Math.random() * candidates.length)];

  return {
    success: true,
    mechanicId: selected.id,
    mechanicName: selected.name,
  };
}
