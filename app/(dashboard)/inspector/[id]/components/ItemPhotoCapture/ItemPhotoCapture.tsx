/**
 * ItemPhotoCapture - Componente para capturar y mostrar fotos de hallazgos.
 * Se integra en InspectionItemCard cuando el item tiene OBSERVACION o DEFECTO.
 */
"use client";

import { useState, useRef } from "react";
import styles from "./ItemPhotoCapture.module.css";

export interface Photo {
  id: number;
  url: string;
  thumbnailUrl: string | null;
  checklistItemId: string | null;
  label: string | null;
  category?: string;
}

interface ItemPhotoCaptureProps {
  reportId: number;
  checklistItemId: string;
  itemLabel: string;
  photos: Photo[];
  onPhotoAdded: (photo: Photo) => void;
  onPhotoDeleted: (photoId: number) => void;
  disabled?: boolean;
  maxPhotos?: number;
}

export function ItemPhotoCapture({
  reportId,
  checklistItemId,
  itemLabel,
  photos,
  onPhotoAdded,
  onPhotoDeleted,
  disabled = false,
  maxPhotos = 5,
}: ItemPhotoCaptureProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limpiar input para permitir seleccionar la misma foto
    e.target.value = "";

    // Validar que sea imagen
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes");
      return;
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen no debe superar 10MB");
      return;
    }

    // Validar máximo de fotos
    if (photos.length >= maxPhotos) {
      setError(`Máximo ${maxPhotos} fotos por item`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("checklistItemId", checklistItemId);
      formData.append("label", itemLabel);

      const res = await fetch(`/api/reports/${reportId}/photos/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al subir la imagen");
      }

      onPhotoAdded(data.photo);
    } catch (err: any) {
      setError(err.message || "Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (disabled) return;

    // Confirmación simple
    if (!confirm("¿Eliminar esta foto?")) return;

    try {
      const res = await fetch(`/api/photos/${photoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar");
      }

      onPhotoDeleted(photoId);
    } catch (err: any) {
      setError(err.message || "Error al eliminar la foto");
    }
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className={styles.container}>
      {/* Input oculto para captura */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className={styles.hiddenInput}
        disabled={disabled || uploading}
      />

      {/* Grid de fotos */}
      <div className={styles.photoGrid}>
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={styles.photoItem}
            onClick={() => setViewingPhoto(photo)}
            title="Click para ver en grande"
          >
            <img
              src={photo.thumbnailUrl || photo.url}
              alt={photo.label || "Foto de hallazgo"}
              className={styles.photoImage}
            />
            {!disabled && (
              <button
                type="button"
                className={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePhoto(photo.id);
                }}
                title="Eliminar foto"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 2l8 8M10 2l-8 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}

        {/* Botón para agregar foto */}
        {canAddMore && !disabled && (
          <button
            type="button"
            className={`${styles.addPhotoButton} ${uploading ? styles.uploading : ""}`}
            onClick={handleCameraClick}
            disabled={uploading}
          >
            {uploading ? (
              <span className={styles.spinner} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect
                  x="2"
                  y="4"
                  width="16"
                  height="12"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="15" cy="6" r="1" fill="currentColor" />
              </svg>
            )}
            <span>{uploading ? "Subiendo..." : "Foto"}</span>
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M1 1l8 8M9 1l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Contador */}
      {photos.length > 0 && (
        <div className={styles.counter}>
          {photos.length}/{maxPhotos} fotos
        </div>
      )}

      {/* Modal para ver foto en grande */}
      {viewingPhoto && (
        <div className={styles.lightbox} onClick={() => setViewingPhoto(null)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setViewingPhoto(null)}
              aria-label="Cerrar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 6l12 12M18 6l-12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <img
              src={viewingPhoto.url}
              alt={viewingPhoto.label || "Foto de hallazgo"}
              className={styles.lightboxImage}
            />
            {viewingPhoto.label && (
              <p className={styles.lightboxLabel}>{viewingPhoto.label}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
