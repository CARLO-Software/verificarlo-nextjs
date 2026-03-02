import React from "react";
import styles from "./MetricasSection.module.css";

export default function MetricasSection() {
  interface Metric {
    icon: string;
    description: string;
    value: string;
  }

  const Metric = [
    {
      icon: "assets/icons/mecanico.svg",
      description: "Inspecciones realizadas",
      value: "+500",
    },
    {
      icon: "assets/icons/alcancia.svg",
      description: "Ahorro promedio por cliente",
      value: "S/8,500",
    },
    {
      icon: "assets/icons/auto-falla.svg",
      description: 'Autos "perfectos" que ocultaban fallas',
      value: "82%",
    },
  ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h2 className={styles.title}>
          Los números no mienten.
          <span className={styles.highlight}>Los vendedores sí.</span>
        </h2>
        <div className={styles.metricsContainer}>
          {Metric.map((item, index) => (
            <div key={index} className={styles.metric}>
              <div className={styles.iconContainer}>
                <img src={item.icon} alt="iconito" />
              </div>
              <div className={styles.metricInfo}>
                <h4 className={styles.subtitle}>{item.description}</h4>
                <span className={styles.metricValue}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
