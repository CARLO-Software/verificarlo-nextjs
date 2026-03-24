/**
 * Reglas de transición de estado para inspecciones de vehículos.
 *
 * Los dos procesos son INDEPENDIENTES:
 *   - legalStatus:      BLOQUEADO → PENDIENTE → EN_PROCESO → COMPLETADO
 *   - mechanicalStatus: PENDIENTE → EN_PROCESO → COMPLETADO
 *
 * Este módulo es lógica pura (sin DB). Los servicios y rutas lo importan.
 */

import { LegalStatus, MechanicalStatus } from "@prisma/client";

// ============================================
// TRANSICIONES PERMITIDAS
// ============================================

const LEGAL_TRANSITIONS: Record<LegalStatus, LegalStatus[]> = {
  BLOQUEADO:  ["PENDIENTE"],   // Se desbloquea al agregar placa
  PENDIENTE:  ["EN_PROCESO"],  // Admin toma el caso
  EN_PROCESO: ["COMPLETADO"],  // Admin completa revisión
  COMPLETADO: [],              // Estado terminal
};

const MECHANICAL_TRANSITIONS: Record<MechanicalStatus, MechanicalStatus[]> = {
  PENDIENTE:  ["EN_PROCESO"],  // Mecánico inicia inspección
  EN_PROCESO: ["COMPLETADO"],  // Mecánico completa inspección
  COMPLETADO: [],              // Estado terminal
};

// ============================================
// VALIDACIÓN
// ============================================

export function canTransitionLegal(
  current: LegalStatus,
  next: LegalStatus
): boolean {
  return LEGAL_TRANSITIONS[current]?.includes(next) ?? false;
}

export function canTransitionMechanical(
  current: MechanicalStatus,
  next: MechanicalStatus
): boolean {
  return MECHANICAL_TRANSITIONS[current]?.includes(next) ?? false;
}

export function assertLegalTransition(
  current: LegalStatus,
  next: LegalStatus
): void {
  if (!canTransitionLegal(current, next)) {
    throw new InvalidTransitionError("legal", current, next);
  }
}

export function assertMechanicalTransition(
  current: MechanicalStatus,
  next: MechanicalStatus
): void {
  if (!canTransitionMechanical(current, next)) {
    throw new InvalidTransitionError("mechanical", current, next);
  }
}

// ============================================
// ERROR TIPADO
// ============================================

export class InvalidTransitionError extends Error {
  constructor(
    public readonly process: "legal" | "mechanical",
    public readonly current: string,
    public readonly next: string
  ) {
    super(
      `Transición inválida en ${process}: ${current} → ${next}`
    );
    this.name = "InvalidTransitionError";
  }
}

// ============================================
// HELPERS DE TIMESTAMP
// ============================================

/**
 * Retorna el campo de timestamp que debe setearse
 * junto a cada transición de estado.
 */
export function getLegalTimestamp(next: LegalStatus): Record<string, Date> {
  const now = new Date();
  const map: Partial<Record<LegalStatus, Record<string, Date>>> = {
    PENDIENTE:  { legalUnlockedAt: now },   // Solo si venía de BLOQUEADO
    EN_PROCESO: { legalStartedAt: now },
    COMPLETADO: { legalCompletedAt: now },
  };
  return map[next] ?? {};
}

export function getMechanicalTimestamp(
  next: MechanicalStatus
): Record<string, Date> {
  const now = new Date();
  const map: Partial<Record<MechanicalStatus, Record<string, Date>>> = {
    EN_PROCESO: { mechanicStartedAt: now },
    COMPLETADO: { mechanicCompletedAt: now },
  };
  return map[next] ?? {};
}
