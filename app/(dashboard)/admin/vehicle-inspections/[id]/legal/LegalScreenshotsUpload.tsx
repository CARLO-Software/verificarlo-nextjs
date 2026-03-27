/**
 * LegalScreenshotsUpload - Sección para subir capturas de pantalla de fuentes legales
 *
 * Aparece después de que el admin completa la revisión legal.
 * Permite subir screenshots de cada consulta (SUNARP, SAT, MTC, etc.)
 */

'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Upload,
  X,
  FileText,
  CheckCircle,
  Loader2,
  Camera,
  Download,
  Eye,
  AlertCircle,
} from 'lucide-react';
import styles from './LegalScreenshotsUpload.module.css';
import { LEGAL_SOURCES, LegalSourceId } from '@/lib/constants/legal-sources';

export { LEGAL_SOURCES, type LegalSourceId };

export interface LegalScreenshot {
  sourceId: LegalSourceId;
  imageUrl: string;
  uploadedAt: Date;
}

interface Props {
  inspectionId: number;
  existingScreenshots: LegalScreenshot[];
  onScreenshotUploaded: (screenshot: LegalScreenshot) => void;
  onScreenshotDeleted: (sourceId: LegalSourceId) => void;
  onGeneratePdf: () => void;
  pdfUrl: string | null;
  isGeneratingPdf: boolean;
}

export function LegalScreenshotsUpload({
  inspectionId,
  existingScreenshots,
  onScreenshotUploaded,
  onScreenshotDeleted,
  onGeneratePdf,
  pdfUrl,
  isGeneratingPdf,
}: Props) {
  const [uploading, setUploading] = useState<LegalSourceId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Verificar si una fuente ya tiene captura
  const getScreenshot = (sourceId: LegalSourceId) =>
    existingScreenshots.find((s) => s.sourceId === sourceId);

  // Contar capturas requeridas vs subidas
  const requiredSources = LEGAL_SOURCES.filter((s) => s.required);
  const uploadedRequired = requiredSources.filter((s) =>
    existingScreenshots.some((sc) => sc.sourceId === s.id)
  );
  const canGeneratePdf = uploadedRequired.length === requiredSources.length;
  const progress = Math.round(
    (uploadedRequired.length / requiredSources.length) * 100
  );

  // Manejar subida de archivo
  const handleFileChange = async (
    sourceId: LegalSourceId,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen (PNG, JPG, WEBP)');
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    setUploading(sourceId);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sourceId', sourceId);

      const res = await fetch(
        `/api/admin/vehicle-inspections/${inspectionId}/legal/screenshots`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al subir la imagen');
      }

      const data = await res.json();
      onScreenshotUploaded({
        sourceId,
        imageUrl: data.imageUrl,
        uploadedAt: new Date(),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(null);
      // Limpiar input para permitir subir el mismo archivo de nuevo
      if (fileInputRefs.current[sourceId]) {
        fileInputRefs.current[sourceId]!.value = '';
      }
    }
  };

  // Eliminar captura
  const handleDelete = async (sourceId: LegalSourceId) => {
    if (!confirm('¿Eliminar esta captura?')) return;

    try {
      const res = await fetch(
        `/api/admin/vehicle-inspections/${inspectionId}/legal/screenshots?sourceId=${sourceId}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar');
      }

      onScreenshotDeleted(sourceId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <Camera size={24} />
        </div>
        <div className={styles.headerText}>
          <h2 className={styles.title}>Capturas de Fuentes Legales</h2>
          <p className={styles.subtitle}>
            Sube las capturas de pantalla de cada consulta realizada
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span>Capturas requeridas</span>
          <span className={styles.progressCount}>
            {uploadedRequired.length} / {requiredSources.length}
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage}>
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className={styles.errorClose}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Sources Grid */}
      <div className={styles.sourcesGrid}>
        {LEGAL_SOURCES.map((source) => {
          const screenshot = getScreenshot(source.id);
          const isUploading = uploading === source.id;

          return (
            <div
              key={source.id}
              className={`${styles.sourceCard} ${
                screenshot ? styles.sourceCardUploaded : ''
              } ${source.required ? '' : styles.sourceCardOptional}`}
            >
              <div className={styles.sourceHeader}>
                <div className={styles.sourceInfo}>
                  <h4 className={styles.sourceName}>
                    {source.name}
                    {source.required && (
                      <span className={styles.requiredBadge}>Requerido</span>
                    )}
                  </h4>
                  <p className={styles.sourceDescription}>{source.description}</p>
                </div>
                {screenshot && (
                  <CheckCircle size={20} className={styles.uploadedIcon} />
                )}
              </div>

              {screenshot ? (
                <div className={styles.screenshotPreview}>
                  <div className={styles.screenshotImageWrapper}>
                    <Image
                      src={screenshot.imageUrl}
                      alt={source.name}
                      fill
                      className={styles.screenshotImage}
                      onClick={() => setPreviewImage(screenshot.imageUrl)}
                    />
                  </div>
                  <div className={styles.screenshotActions}>
                    <button
                      onClick={() => setPreviewImage(screenshot.imageUrl)}
                      className={styles.actionButton}
                      title="Ver"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(source.id)}
                      className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                      title="Eliminar"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <label className={styles.uploadArea}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(source.id, e)}
                    disabled={isUploading}
                    ref={(el) => { fileInputRefs.current[source.id] = el; }}
                    className={styles.fileInput}
                  />
                  {isUploading ? (
                    <div className={styles.uploadingState}>
                      <Loader2 size={24} className={styles.spinner} />
                      <span>Subiendo...</span>
                    </div>
                  ) : (
                    <div className={styles.uploadPrompt}>
                      <Upload size={24} />
                      <span>Subir captura</span>
                    </div>
                  )}
                </label>
              )}

              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.sourceLink}
              >
                Ir a {source.url.replace('https://', '').split('/')[0]}
              </a>
            </div>
          );
        })}
      </div>

      {/* Generate PDF Section */}
      <div className={styles.generateSection}>
        {pdfUrl ? (
          <div className={styles.pdfReady}>
            <div className={styles.pdfReadyIcon}>
              <FileText size={32} />
            </div>
            <div className={styles.pdfReadyText}>
              <h3>PDF Legal Generado</h3>
              <p>El informe está listo para descargar</p>
            </div>
            <div className={styles.pdfActions}>
              <a
                href={`/api/admin/vehicle-inspections/${inspectionId}/legal/download-pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.viewPdfButton}
              >
                <Eye size={18} />
                Ver PDF
              </a>
              <a
                href={`/api/admin/vehicle-inspections/${inspectionId}/legal/download-pdf`}
                download="informe-legal.pdf"
                className={styles.downloadPdfButton}
              >
                <Download size={18} />
                Descargar
              </a>
            </div>
          </div>
        ) : (
          <button
            onClick={onGeneratePdf}
            disabled={!canGeneratePdf || isGeneratingPdf}
            className={styles.generateButton}
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 size={20} className={styles.spinner} />
                Generando PDF...
              </>
            ) : (
              <>
                <FileText size={20} />
                Generar Informe PDF Legal
              </>
            )}
          </button>
        )}
        {!canGeneratePdf && !pdfUrl && (
          <p className={styles.generateHint}>
            Sube todas las capturas requeridas para generar el PDF
          </p>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className={styles.previewModal} onClick={() => setPreviewImage(null)}>
          <div className={styles.previewContent} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className={styles.previewClose}
            >
              <X size={24} />
            </button>
            <Image
              src={previewImage}
              alt="Vista previa"
              fill
              className={styles.previewImage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
