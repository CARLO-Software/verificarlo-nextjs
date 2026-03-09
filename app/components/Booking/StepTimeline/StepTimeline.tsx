// =============================================================================
// COMPONENTE: StepTimeline (Línea de Tiempo de Pasos)
// =============================================================================
// Este es un "componente presentacional" - solo muestra datos, no tiene lógica
// de negocio. Recibe props y renderiza la UI basándose en ellos.
//
// CONCEPTO: Los componentes presentacionales son fáciles de:
// - Testear (solo verificas que renderiza correctamente)
// - Reutilizar (no dependen de estado externo)
// - Mantener (cambios de UI en un solo lugar)
// =============================================================================

"use client";

import styles from "./StepTimeline.module.css";

// Los nombres de los 4 pasos del flujo de reserva
const STEPS = [
  { number: 1, label: "Elige tu plan" },
  { number: 2, label: "Tu vehículo" },
  { number: 3, label: "Agenda" },
  { number: 4, label: "Pago" },
];

interface StepTimelineProps {
  // currentStep puede ser 1, 2, 3 o 4
  // TypeScript nos ayuda a evitar errores pasando valores inválidos
  currentStep: 1 | 2 | 3 | 4;
}

export default function StepTimeline({ currentStep }: StepTimelineProps) {
  return (
    <div className={styles.timeline}>
      {STEPS.map((step, index) => {
        // Determinamos el estado de cada paso:
        // - "completed": pasos anteriores al actual
        // - "active": el paso actual
        // - "pending": pasos siguientes al actual
        const status =
          step.number < currentStep
            ? "completed"
            : step.number === currentStep
            ? "active"
            : "pending";

        return (
          <div key={step.number} className={styles.stepWrapper}>
            {/* El paso (círculo + texto) */}
            <div className={`${styles.step} ${styles[status]}`}>
              <div className={styles.circle}>
                {status === "completed" ? (
                  // Checkmark para pasos completados
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12l5 5 9-9" />
                  </svg>
                ) : (
                  // Número para pasos activos y pendientes
                  <span>{step.number}</span>
                )}
              </div>
              <span className={styles.label}>{step.label}</span>
            </div>

            {/* Línea conectora entre pasos (excepto el último) */}
            {index < STEPS.length - 1 && (
              <div
                className={`${styles.connector} ${
                  step.number < currentStep ? styles.connectorCompleted : ""
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
