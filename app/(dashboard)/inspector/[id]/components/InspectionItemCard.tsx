/**
 * InspectionItemCard - Componente de tarjeta para cada ítem de inspección.
 * Permite al inspector marcar el estado (OK, Observación, Defecto, No aplica)
 * y agregar comentarios opcionales para observaciones o defectos.
 */
"use client";

import { useState } from "react";
import type { InspectionStatus } from "../inspectionData";
import styles from "./InspectionItemCard.module.css";

interface InspectionItemCardProps {
  id: string;
  label: string;
  status: InspectionStatus;
  comment?: string;
  disabled?: boolean;
  onStatusChange: (id: string, status: InspectionStatus, comment?: string) => void;
}

const STATUS_OPTIONS: {
  value: InspectionStatus;
  label: string;
  shortLabel: string;
  color: string;
}[] = [
  { value: "OK", label: "OK", shortLabel: "OK", color: "green" },
  { value: "OBSERVACION", label: "Observación", shortLabel: "Obs", color: "yellow" },
  { value: "DEFECTO", label: "Defecto", shortLabel: "Def", color: "red" },
  { value: "NO_APLICA", label: "No aplica", shortLabel: "N/A", color: "gray" },
];

export function InspectionItemCard({
  id,
  label,
  status,
  comment = "",
  disabled = false,
  onStatusChange,
}: InspectionItemCardProps) {
  const [localComment, setLocalComment] = useState(comment);
  const [isCommentOpen, setIsCommentOpen] = useState(!!comment);

  const handleStatusClick = (newStatus: InspectionStatus) => {
    if (disabled) return;

    if (status === newStatus) {
      // Si hace clic en el mismo estado, lo deselecciona
      onStatusChange(id, null, "");
      setIsCommentOpen(false);
      setLocalComment("");
    } else {
      onStatusChange(id, newStatus, localComment);
      // Abrir comentario automáticamente si es OBSERVACION o DEFECTO
      if (newStatus === "OBSERVACION" || newStatus === "DEFECTO") {
        setIsCommentOpen(true);
      }
    }
  };

  const handleCommentChange = (value: string) => {
    setLocalComment(value);
    if (status) {
      onStatusChange(id, status, value);
    }
  };

  const toggleComment = () => {
    if (!disabled) {
      setIsCommentOpen(!isCommentOpen);
    }
  };

  const showCommentSection = status === "OBSERVACION" || status === "DEFECTO";

  return (
    <div className={`${styles.card} ${disabled ? styles.cardDisabled : ""}`}>
      <div className={styles.cardContent}>
        <span className={styles.label}>{label}</span>

        <div className={styles.statusButtons}>
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.statusButton} ${styles[`statusButton--${option.color}`]} ${
                status === option.value ? styles.statusButtonActive : ""
              }`}
              onClick={() => handleStatusClick(option.value)}
              disabled={disabled}
              title={option.label}
            >
              <span className={styles.statusLabel}>{option.label}</span>
              <span className={styles.statusLabelShort}>{option.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Botón para agregar comentario (solo si hay estado seleccionado) */}
      {status && !showCommentSection && (
        <button
          type="button"
          className={styles.addCommentButton}
          onClick={toggleComment}
          disabled={disabled}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1v12M1 7h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {isCommentOpen ? "Ocultar comentario" : "Agregar comentario"}
        </button>
      )}

      {/* Área de comentario */}
      {(showCommentSection || isCommentOpen) && status && (
        <div className={styles.commentSection}>
          <textarea
            className={styles.commentInput}
            placeholder={
              status === "DEFECTO"
                ? "Describe el defecto encontrado..."
                : status === "OBSERVACION"
                ? "Describe la observación..."
                : "Comentario adicional (opcional)..."
            }
            value={localComment}
            onChange={(e) => handleCommentChange(e.target.value)}
            disabled={disabled}
            rows={2}
          />
        </div>
      )}
    </div>
  );
}
