// =============================================================================
// COMPONENTE: StepTimeline (Línea de Tiempo Minimalista)
// =============================================================================

"use client";

import styles from "./StepTimeline.module.css";

const STEPS = [
  { number: 1, label: "Plan" },
  { number: 2, label: "Vehículo" },
  { number: 3, label: "Agenda" },
  { number: 4, label: "Pago" },
];

interface StepTimelineProps {
  currentStep: 1 | 2 | 3 | 4;
}

export default function StepTimeline({ currentStep }: StepTimelineProps) {
  // Calcular el progreso (0% a 100%)
  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className={styles.timeline}>
      {/* Barra de progreso */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Labels debajo */}
      <div className={styles.labels}>
        {STEPS.map((step) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;

          return (
            <span
              key={step.number}
              className={`${styles.label} ${isActive ? styles.labelActive : ""} ${isCompleted ? styles.labelCompleted : ""}`}
            >
              {step.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
