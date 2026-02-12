/**
 * StatusLegend - Leyenda contextual que explica los estados de inspección.
 * Se muestra de forma discreta encima de la lista de ítems.
 */
import styles from "./StatusLegend.module.css";

interface StatusLegendProps {
  compact?: boolean;
}

const LEGEND_ITEMS = [
  {
    color: "green",
    label: "OK",
    description: "Funciona correctamente / presente / sin observaciones",
  },
  {
    color: "yellow",
    label: "Observación",
    description: "Presenta detalle leve o desgaste normal",
  },
  {
    color: "red",
    label: "Defecto",
    description: "Requiere reparación o presenta falla",
  },
  {
    color: "gray",
    label: "No aplica",
    description: "No corresponde al vehículo inspeccionado",
  },
];

export function StatusLegend({ compact = false }: StatusLegendProps) {
  if (compact) {
    return (
      <div className={styles.legendCompact}>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.color} className={styles.legendItemCompact}>
            <span className={`${styles.dot} ${styles[`dot--${item.color}`]}`} />
            <span className={styles.labelCompact}>{item.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.legend}>
      <div className={styles.legendHeader}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={styles.legendIcon}
        >
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M8 7v3.5M8 5.5v.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span className={styles.legendTitle}>Guía de estados</span>
      </div>
      <div className={styles.legendGrid}>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.color} className={styles.legendItem}>
            <span className={`${styles.dot} ${styles[`dot--${item.color}`]}`} />
            <div className={styles.legendText}>
              <span className={styles.legendLabel}>{item.label}</span>
              <span className={styles.legendDescription}>{item.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
