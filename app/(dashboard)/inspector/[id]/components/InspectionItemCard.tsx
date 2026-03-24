/**
 * InspectionItemCard - Componente de tarjeta para cada ítem de inspección.
 * Permite al inspector marcar el estado (OK, Observación, Defecto, No aplica)
 * y agregar comentarios opcionales para observaciones o defectos.
 * Incluye captura de fotos para hallazgos (OBSERVACION o DEFECTO).
 */
"use client";

import { useState } from "react";
import type { InspectionStatus } from "../inspectionData";
import { ItemPhotoCapture, type Photo } from "./ItemPhotoCapture";
import { VoiceButton } from "@/app/components/VoiceButton";
import styles from "./InspectionItemCard.module.css";

interface InspectionItemCardProps {
  id: string;
  label: string;
  status: InspectionStatus;
  comment?: string;
  disabled?: boolean;
  onStatusChange: (id: string, status: InspectionStatus, comment?: string) => void;
  // Props para fotos
  reportId?: number;
  photos?: Photo[];
  onPhotoAdded?: (photo: Photo) => void;
  onPhotoDeleted?: (photoId: number) => void;
  // Categoría para filtrar opciones (legal solo tiene OK/No aplica)
  categoryId?: string;
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

// Comentarios predefinidos por tipo de estado
const PREDEFINED_COMMENTS: Record<"OBSERVACION" | "DEFECTO", string[]> = {
  OBSERVACION: [
    "Desgaste normal",
    "Requiere atención pronto",
    "Suciedad visible",
    "Ligero ruido",
    "Pequeña fuga",
    "Revisión recomendada",
  ],
  DEFECTO: [
    "Requiere cambio inmediato",
    "No funciona",
    "Daño estructural",
    "Fuga severa",
    "Riesgo de seguridad",
    "Reparación mayor requerida",
  ],
};

export function InspectionItemCard({
  id,
  label,
  status,
  comment = "",
  disabled = false,
  onStatusChange,
  // Props para fotos
  reportId,
  photos = [],
  onPhotoAdded,
  onPhotoDeleted,
  categoryId,
}: InspectionItemCardProps) {
  const [localComment, setLocalComment] = useState(comment);
  const [isCommentOpen, setIsCommentOpen] = useState(!!comment);

  // Filtrar opciones de estado según categoría
  const availableOptions = categoryId === "legal"
    ? STATUS_OPTIONS.filter((opt) => opt.value === "OK" || opt.value === "NO_APLICA")
    : STATUS_OPTIONS;

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
          {availableOptions.map((option) => (
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
          {/* Chips de comentarios predefinidos */}
          {(status === "OBSERVACION" || status === "DEFECTO") && !disabled && (
            <div className={styles.predefinedComments}>
              {PREDEFINED_COMMENTS[status].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className={`${styles.commentChip} ${
                    localComment.includes(suggestion) ? styles.commentChipActive : ""
                  }`}
                  onClick={() => {
                    // Toggle: agregar o quitar del comentario
                    if (localComment.includes(suggestion)) {
                      const newComment = localComment
                        .replace(suggestion, "")
                        .replace(/,\s*,/g, ",")
                        .replace(/^,\s*|,\s*$/g, "")
                        .trim();
                      handleCommentChange(newComment);
                    } else {
                      const newComment = localComment
                        ? `${localComment}, ${suggestion}`
                        : suggestion;
                      handleCommentChange(newComment);
                    }
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          <div className={styles.commentInputWrapper}>
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
            {!disabled && (
              <VoiceButton
                onTranscript={(text) => {
                  // Agregar texto dictado al comentario existente
                  const newComment = localComment
                    ? `${localComment} ${text}`
                    : text;
                  handleCommentChange(newComment);
                }}
                disabled={disabled}
                className={styles.voiceButton}
              />
            )}
          </div>
        </div>
      )}

      {/* Sección de fotos para hallazgos */}
      {showCommentSection && reportId && onPhotoAdded && onPhotoDeleted && (
        <ItemPhotoCapture
          reportId={reportId}
          checklistItemId={id}
          itemLabel={label}
          photos={photos}
          onPhotoAdded={onPhotoAdded}
          onPhotoDeleted={onPhotoDeleted}
          disabled={disabled}
        />
      )}
    </div>
  );
}
