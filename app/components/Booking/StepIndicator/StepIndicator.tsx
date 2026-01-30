"use client";

import styles from "./StepIndicator.module.css";

export type BookingStep = "servicio" | "vehiculo" | "fecha" | "pago" | "confirmado";

interface StepIndicatorProps {
  currentStep: BookingStep;
}

const steps: { key: BookingStep; label: string; number: number }[] = [
  { key: "servicio", label: "Servicio", number: 1 },
  { key: "vehiculo", label: "Vehículo", number: 2 },
  { key: "fecha", label: "Fecha y Hora", number: 3 },
  { key: "pago", label: "Pago", number: 4 },
];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  // Si está confirmado, todos los pasos están completados
  const isConfirmed = currentStep === "confirmado";

  return (
    <div className={styles.container}>
      <div className={styles.steps}>
        {steps.map((step, index) => {
          const isCompleted = isConfirmed || index < currentIndex;
          const isCurrent = !isConfirmed && index === currentIndex;

          return (
            <div key={step.key} className={styles.stepWrapper}>
              {/* Línea conectora */}
              {index > 0 && (
                <div
                  className={`${styles.connector} ${
                    isCompleted || isCurrent ? styles.connectorActive : ""
                  }`}
                />
              )}

              {/* Círculo del paso */}
              <div
                className={`${styles.step} ${
                  isCompleted
                    ? styles.stepCompleted
                    : isCurrent
                    ? styles.stepCurrent
                    : styles.stepPending
                }`}
              >
                {isCompleted ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M3 8L6.5 11.5L13 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span>{step.number}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={`${styles.label} ${
                  isCompleted
                    ? styles.labelCompleted
                    : isCurrent
                    ? styles.labelCurrent
                    : styles.labelPending
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
