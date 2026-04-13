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
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputMultipleRef = useRef<HTMLInputElement>(null);

  // Detectar si es iOS (no soporta bien multiple)
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  const handleCameraClick = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    if (disabled || uploading) return;
    fileInputMultipleRef.current?.click();
  };

  // Subir un archivo individual
  const uploadSingleFile = async (file: File): Promise<boolean> => {
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
      return true;
    } catch {
      return false;
    }
  };

  // Manejar captura de cámara (una foto)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen no debe superar 10MB");
      return;
    }

    if (photos.length >= maxPhotos && maxPhotos < 999) {
      setError(`Máximo ${maxPhotos} fotos por item`);
      return;
    }

    setUploading(true);
    setError(null);

    const success = await uploadSingleFile(file);
    if (!success) {
      setError("Error al subir la imagen");
    }

    setUploading(false);
  };

  // Manejar selección de galería (múltiple en Android/Desktop, una por una en iOS)
  const handleMultipleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limpiar input inmediatamente
    const input = e.target;
    setTimeout(() => { input.value = ""; }, 0);

    // Filtrar y validar archivos
    const validFiles: File[] = [];
    const remainingSlots = maxPhotos - photos.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Verificar tipo de imagen (incluyendo HEIC de iOS)
      const isImage = file.type.startsWith("image/") ||
                      file.name.toLowerCase().endsWith('.heic') ||
                      file.name.toLowerCase().endsWith('.heif');
      if (isImage && file.size <= 10 * 1024 * 1024) {
        validFiles.push(file);
      }
    }

    // Limitar a slots disponibles
    const filesToUpload = validFiles.slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      setError("No se encontraron imágenes válidas");
      return;
    }

    if (validFiles.length > remainingSlots && maxPhotos < 999) {
      setError(`Solo se subirán ${remainingSlots} fotos (límite: ${maxPhotos})`);
    }

    setUploading(true);
    setError(null);

    // Mostrar progreso solo si hay más de 1 archivo
    if (filesToUpload.length > 1) {
      setUploadProgress({ current: 0, total: filesToUpload.length });
    }

    let successCount = 0;
    for (let i = 0; i < filesToUpload.length; i++) {
      if (filesToUpload.length > 1) {
        setUploadProgress({ current: i + 1, total: filesToUpload.length });
      }
      const success = await uploadSingleFile(filesToUpload[i]);
      if (success) successCount++;
    }

    setUploadProgress(null);
    setUploading(false);

    if (successCount === 0) {
      setError("Error al subir las fotos");
    } else if (successCount < filesToUpload.length) {
      setError(`${successCount}/${filesToUpload.length} fotos subidas`);
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
      {/* Input oculto para captura con cámara */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className={styles.hiddenInput}
        disabled={disabled || uploading}
      />
      {/* Input oculto para selección múltiple de galería */}
      <input
        ref={(el) => {
          (fileInputMultipleRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
          // Forzar atributo multiple correctamente
          if (el) el.setAttribute('multiple', 'multiple');
        }}
        type="file"
        accept="image/*"
        onChange={handleMultipleFileChange}
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

        {/* Botones para agregar fotos */}
        {canAddMore && !disabled && (
          <div className={styles.addPhotoButtons}>
            {/* Botón cámara */}
            <button
              type="button"
              className={`${styles.addPhotoButton} ${uploading ? styles.uploading : ""}`}
              onClick={handleCameraClick}
              disabled={uploading}
              title="Tomar foto"
            >
              {uploading && !uploadProgress ? (
                <span className={styles.spinner} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="13" cy="5.5" r="0.75" fill="currentColor"/>
                </svg>
              )}
              <span>Cámara</span>
            </button>
            {/* Botón galería */}
            <button
              type="button"
              className={`${styles.addPhotoButton} ${styles.addPhotoButtonGallery} ${uploading ? styles.uploading : ""}`}
              onClick={handleGalleryClick}
              disabled={uploading}
              title={isIOS ? "Seleccionar foto" : "Seleccionar varias fotos"}
            >
              {uploading && uploadProgress ? (
                <>
                  <span className={styles.spinner} />
                  <span>{uploadProgress.current}/{uploadProgress.total}</span>
                </>
              ) : uploading ? (
                <span className={styles.spinner} />
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="1"/>
                    <path d="M2 12l4-4 3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{isIOS ? "Fotos" : "Galería"}</span>
                </>
              )}
            </button>
          </div>
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
          {maxPhotos >= 999 ? `${photos.length} fotos` : `${photos.length}/${maxPhotos} fotos`}
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
