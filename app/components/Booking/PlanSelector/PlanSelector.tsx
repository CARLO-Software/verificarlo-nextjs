// =============================================================================
// COMPONENTE: PlanSelector (Selección de Plan - Paso 1)
// =============================================================================
// Muestra los 3 planes de inspección como opciones de radio button.
// El plan Premium tiene un badge especial indicando popularidad.
//
// CONCEPTO: "Lifting State Up" (Elevar el Estado)
// El estado (selectedPlanId) vive en el componente padre (AgendarForm).
// Este componente solo notifica al padre cuando el usuario selecciona,
// usando la función callback onSelectPlan.
//
// ¿Por qué? Porque el padre necesita saber qué plan se seleccionó para:
// - Validar si puede pasar al siguiente paso
// - Enviar el plan seleccionado al backend
// - Mostrar el precio en el resumen
// =============================================================================

"use client";

import styles from "./PlanSelector.module.css";

// Tipo para los planes de inspección
interface InspectionPlan {
  id: number;
  type: string;
  title: string;
  description: string;
  landingDescription?: string;
  price: number;
  items?: { id: number; label: string }[];
}

interface PlanSelectorProps {
  plans: InspectionPlan[];
  selectedPlanId: number | null;
  onSelectPlan: (plan: InspectionPlan) => void;
}

export default function PlanSelector({
  plans,
  selectedPlanId,
  onSelectPlan,
}: PlanSelectorProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Elige tu plan de inspección</h2>
      <p className={styles.subtitle}>
        Selecciona el nivel de revisión que necesitas para tu próxima compra
      </p>

      <div className={styles.plansList}>
        {plans.map((plan) => {
          // Determinamos si es el plan Premium (el más caro = índice 2 o type "completa")
          const isPremium = plan.type === "completa" || plan.id === 3;
          const isSelected = selectedPlanId === plan.id;

          return (
            <div
              key={plan.id}
              className={`${styles.planCard} ${isSelected ? styles.planCardSelected : ""} ${isPremium ? styles.planCardPremium : ""}`}
              onClick={() => onSelectPlan(plan)}
              // Accesibilidad: permite seleccionar con teclado
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPlan(plan);
                }
              }}
            >
              {/* Badge de popularidad solo para Premium */}
              {isPremium && (
                <div className={styles.popularBadge}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>9 de cada 10 eligen esta</span>
                </div>
              )}

              {/* Radio button circular */}
              <div className={styles.radioWrapper}>
                <div
                  className={`${styles.radioCircle} ${isSelected ? styles.radioCircleSelected : ""}`}
                >
                  {isSelected && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12l5 5 9-9" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Información del plan */}
              <div className={styles.planInfo}>
                <h3 className={styles.planTitle}>{plan.title}</h3>
                <p className={styles.planDescription}>
                  {plan.landingDescription || plan.description}
                </p>

                {/* Lista de items incluidos (máximo 4 visibles) */}
                {plan.items && plan.items.length > 0 && (
                  <ul className={styles.planItems}>
                    {plan.items.slice(0, 4).map((item) => (
                      <li key={item.id}>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#6cb545"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12l5 5 9-9" />
                        </svg>
                        <span>{item.label}</span>
                      </li>
                    ))}
                    {plan.items.length > 4 && (
                      <li className={styles.moreItems}>
                        +{plan.items.length - 4} más incluidos
                      </li>
                    )}
                  </ul>
                )}
              </div>

              {/* Precio */}
              <div className={styles.priceWrapper}>
                <span className={styles.priceLabel}>Precio</span>
                <span className={styles.priceValue}>S/ {plan.price}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
