/**
 * LegalScreenshotsUpload - Sección para subir capturas de pantalla de fuentes legales
 *
 * Permite subir screenshots de cada consulta (SUNARP, SAT, MTC, etc.)
 * Soporta: drag & drop, click para subir, y pegar desde clipboard (Ctrl+V)
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Upload,
  X,
  CheckCircle,
  Loader2,
  Camera,
  Eye,
  AlertCircle,
  ExternalLink,
  Clipboard,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import styles from './LegalScreenshotsUpload.module.css';
import { LEGAL_SOURCES, LEGAL_CATEGORIES, LegalSourceId } from '@/lib/constants/legal-sources';

export { LEGAL_SOURCES, type LegalSourceId };

type SourceStatus = 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';

export interface LegalScreenshot {
  sourceId: LegalSourceId;
  imageUrl: string;
  uploadedAt: Date;
  index?: number; // Índice para fuentes con múltiples imágenes
}

interface Props {
  inspectionId: number;
  existingScreenshots: LegalScreenshot[];
  onScreenshotUploaded: (screenshot: LegalScreenshot) => void;
  onScreenshotDeleted: (sourceId: LegalSourceId, index?: number) => void;
  initialSourceStatuses?: Record<string, SourceStatus>;
  initialSourceObservations?: Record<string, string>;
  generalObservations: string;
  onGeneralObservationsChange: (value: string) => void;
  canEdit: boolean;
  // Campos adicionales del informe legal
  initialSoatExpiryDate?: string;
  initialTechReviewExpiryDate?: string;
  initialTechReviewNotes?: string;
  initialLastTransferPrice?: string;
}

export function LegalScreenshotsUpload({
  inspectionId,
  existingScreenshots,
  onScreenshotUploaded,
  onScreenshotDeleted,
  initialSourceStatuses,
  initialSourceObservations,
  generalObservations,
  onGeneralObservationsChange,
  canEdit,
  initialSoatExpiryDate,
  initialTechReviewExpiryDate,
  initialTechReviewNotes,
  initialLastTransferPrice,
}: Props) {
  const [uploading, setUploading] = useState<LegalSourceId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeSourceForPaste, setActiveSourceForPaste] = useState<LegalSourceId | null>(null);
  const [sourceStatuses, setSourceStatuses] = useState<Record<string, SourceStatus>>(
    initialSourceStatuses || {}
  );
  const [sourceObservations, setSourceObservations] = useState<Record<string, string>>(
    initialSourceObservations || {}
  );
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Estados para campos adicionales del informe legal
  const [soatExpiryDate, setSoatExpiryDate] = useState(initialSoatExpiryDate || '');
  const [techReviewExpiryDate, setTechReviewExpiryDate] = useState(initialTechReviewExpiryDate || '');
  const [techReviewNotes, setTechReviewNotes] = useState(initialTechReviewNotes || '');
  const [lastTransferPrice, setLastTransferPrice] = useState(initialLastTransferPrice || '');

  // Log inicial para debug
  useEffect(() => {
    console.log('[COMPONENTE INIT] initialSourceStatuses:', initialSourceStatuses);
    console.log('[COMPONENTE INIT] initialSourceObservations:', initialSourceObservations);
    console.log('[COMPONENTE INIT] sourceStatuses state:', sourceStatuses);
    console.log('[COMPONENTE INIT] sourceObservations state:', sourceObservations);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Obtener todas las capturas de una fuente (soporta múltiples imágenes)
  const getScreenshots = (sourceId: LegalSourceId): LegalScreenshot[] =>
    existingScreenshots.filter((s) => s.sourceId === sourceId);

  // Verificar si una fuente ya tiene captura (al menos una)
  const hasScreenshot = (sourceId: LegalSourceId): boolean =>
    existingScreenshots.some((s) => s.sourceId === sourceId);

  // Obtener el máximo de imágenes permitidas para una fuente
  const getMaxImages = (sourceId: LegalSourceId): number => {
    const source = LEGAL_SOURCES.find((s) => s.id === sourceId);
    return source?.maxImages || 1;
  };

  // Verificar si se puede subir más imágenes
  const canUploadMore = (sourceId: LegalSourceId): boolean => {
    const current = getScreenshots(sourceId).length;
    const max = getMaxImages(sourceId);
    return current < max;
  };

  // Obtener el estado de una fuente (por defecto PENDING) - Reservado para uso futuro
  const _getSourceStatus = (sourceId: string): SourceStatus => {
    return sourceStatuses[sourceId] || 'PENDING';
  };

  // Cambiar el estado de una fuente - Reservado para uso futuro
  const _setSourceStatus = (sourceId: string, status: SourceStatus) => {
    setSourceStatuses(prev => ({ ...prev, [sourceId]: status }));
    // Si cambia a OK, limpiar observaciones
    if (status === 'OK') {
      setSourceObservations(prev => {
        const newObs = { ...prev };
        delete newObs[sourceId];
        return newObs;
      });
    }
  };

  // Obtener el estado de una categoría (por defecto PENDING)
  const getCategoryStatus = (categoryId: string): SourceStatus => {
    return sourceStatuses[categoryId] || 'PENDING';
  };

  // Cambiar el estado de una categoría
  const setCategoryStatus = (categoryId: string, status: SourceStatus) => {
    setSourceStatuses(prev => ({ ...prev, [categoryId]: status }));
    // Si cambia a OK, limpiar observaciones
    if (status === 'OK') {
      setSourceObservations(prev => {
        const newObs = { ...prev };
        delete newObs[categoryId];
        return newObs;
      });
    }
  };

  // Obtener observación de una fuente - Reservado para uso futuro
  const _getSourceObservation = (sourceId: string): string => {
    return sourceObservations[sourceId] || '';
  };

  // Cambiar observación de una fuente - Reservado para uso futuro
  const _setSourceObservation = (sourceId: string, observation: string) => {
    setSourceObservations(prev => ({ ...prev, [sourceId]: observation }));
  };

  // Obtener observación de una categoría
  const getCategoryObservation = (categoryId: string): string => {
    return sourceObservations[categoryId] || '';
  };

  // Cambiar observación de una categoría
  const setCategoryObservation = (categoryId: string, observation: string) => {
    setSourceObservations(prev => ({ ...prev, [categoryId]: observation }));
  };

  // Guardar estados, observaciones y campos adicionales (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      // Solo guardar si hay datos
      const hasData = Object.keys(sourceStatuses).length > 0 ||
                      Object.keys(sourceObservations).length > 0 ||
                      soatExpiryDate || techReviewExpiryDate || lastTransferPrice;
      if (hasData) {
        console.log('[GUARDANDO] sourceStatuses:', sourceStatuses);
        console.log('[GUARDANDO] sourceObservations:', sourceObservations);
        console.log('[GUARDANDO] soatExpiryDate:', soatExpiryDate);
        console.log('[GUARDANDO] techReviewExpiryDate:', techReviewExpiryDate);
        console.log('[GUARDANDO] lastTransferPrice:', lastTransferPrice);
        try {
          const response = await fetch(
            `/api/admin/vehicle-inspections/${inspectionId}/legal/source-statuses`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                statuses: sourceStatuses,
                observations: sourceObservations,
                soatExpiryDate: soatExpiryDate || null,
                techReviewExpiryDate: techReviewExpiryDate || null,
                techReviewNotes: techReviewNotes || null,
                lastTransferPrice: lastTransferPrice || null,
              }),
            }
          );
          const result = await response.json();
          console.log('[GUARDADO] Respuesta:', result);
        } catch (err) {
          console.error('Error guardando estados:', err);
        }
      }
    }, 1000); // Guardar 1 segundo después del último cambio

    return () => clearTimeout(timeoutId);
  }, [sourceStatuses, sourceObservations, inspectionId, soatExpiryDate, techReviewExpiryDate, techReviewNotes, lastTransferPrice]);

  // Contar capturas requeridas vs subidas
  const requiredSources = LEGAL_SOURCES.filter((s) => s.required);
  const uploadedRequired = requiredSources.filter((s) =>
    existingScreenshots.some((sc) => sc.sourceId === s.id)
  );
  const progress = Math.round(
    (uploadedRequired.length / requiredSources.length) * 100
  );

  // Subir archivo (usado por input file y paste)
  const uploadFile = useCallback(async (sourceId: LegalSourceId, file: File) => {
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
      setActiveSourceForPaste(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(null);
      // Limpiar input
      if (fileInputRefs.current[sourceId]) {
        fileInputRefs.current[sourceId]!.value = '';
      }
    }
  }, [inspectionId, onScreenshotUploaded]);

  // Manejar subida de archivo desde input
  const handleFileChange = async (
    sourceId: LegalSourceId,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadFile(sourceId, file);
  };

  // Manejar paste global
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Solo procesar si hay una fuente activa para pegar
      if (!activeSourceForPaste) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await uploadFile(activeSourceForPaste, file);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [activeSourceForPaste, uploadFile]);

  // Eliminar captura (con índice opcional para múltiples imágenes)
  const handleDelete = async (sourceId: LegalSourceId, index?: number) => {
    if (!confirm('¿Eliminar esta captura?')) return;

    try {
      const maxImages = getMaxImages(sourceId);
      const indexParam = maxImages > 1 && index !== undefined ? `&index=${index}` : '';

      const res = await fetch(
        `/api/admin/vehicle-inspections/${inspectionId}/legal/screenshots?sourceId=${sourceId}${indexParam}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar');
      }

      onScreenshotDeleted(sourceId, index);
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
            Sube o pega (Ctrl+V) las capturas de cada consulta
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

      {/* Sources List - Agrupado por categorías */}
      <div className={styles.categoriesContainer}>
        {/* Sección: Documentación Legal */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Documentación Legal</h3>
          <div className={styles.categoriesList}>
            {LEGAL_CATEGORIES.filter((cat) => cat.section === 'legal').map((category) => (
              <div key={category.id} className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <h4 className={styles.categoryTitle}>{category.name}</h4>

                  {/* Botones de Estado de la Categoría */}
                  <div className={styles.statusButtonsRow}>
                    <button
                      type="button"
                      onClick={() => setCategoryStatus(category.id, 'OK')}
                      className={`${styles.statusBtn} ${styles.statusBtnOK} ${
                        getCategoryStatus(category.id) === 'OK' ? styles.statusBtnActive : ''
                      }`}
                      title="Sin problemas"
                    >
                      <CheckCircle2 size={14} />
                      <span>OK</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryStatus(category.id, 'WARNING')}
                      className={`${styles.statusBtn} ${styles.statusBtnWARNING} ${
                        getCategoryStatus(category.id) === 'WARNING' ? styles.statusBtnActive : ''
                      }`}
                      title="Observación"
                    >
                      <AlertCircle size={14} />
                      <span>Observación</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryStatus(category.id, 'CRITICAL')}
                      className={`${styles.statusBtn} ${styles.statusBtnCRITICAL} ${
                        getCategoryStatus(category.id) === 'CRITICAL' ? styles.statusBtnActive : ''
                      }`}
                      title="Crítico"
                    >
                      <AlertTriangle size={14} />
                      <span>Crítico</span>
                    </button>
                  </div>

                  {/* Textarea de Observaciones (solo si es WARNING o CRITICAL) */}
                  {(getCategoryStatus(category.id) === 'WARNING' || getCategoryStatus(category.id) === 'CRITICAL') && (
                    <div className={styles.observationBox}>
                      <textarea
                        value={getCategoryObservation(category.id)}
                        onChange={(e) => setCategoryObservation(category.id, e.target.value)}
                        placeholder={`Escriba las observaciones sobre ${category.name}...`}
                        rows={2}
                        className={styles.observationTextarea}
                      />
                    </div>
                  )}

                  {/* Campo de fecha de vencimiento para SOAT */}
                  {category.id === 'soat' && (
                    <div className={styles.extraFieldBox}>
                      <label className={styles.extraFieldLabel}>Fecha de vencimiento SOAT</label>
                      <input
                        type="date"
                        value={soatExpiryDate}
                        onChange={(e) => setSoatExpiryDate(e.target.value)}
                        className={styles.extraFieldInput}
                        disabled={!canEdit}
                      />
                    </div>
                  )}

                  {/* Campo para Revisión Técnica */}
                  {category.id === 'revision_tecnica' && (
                    <div className={styles.extraFieldBox}>
                      <label className={styles.extraFieldLabel}>Información de la Revisión Técnica</label>
                      <textarea
                        value={techReviewNotes}
                        onChange={(e) => setTechReviewNotes(e.target.value)}
                        placeholder="Ej: Vence: 15/06/2027, Certificadora: LIDERCON..."
                        className={styles.extraFieldTextarea}
                        disabled={!canEdit}
                        rows={2}
                      />
                    </div>
                  )}

                  {/* Campo de precio para Historial de Propietarios (última transferencia) */}
                  {category.id === 'historial_propietarios' && (
                    <div className={styles.extraFieldBox}>
                      <label className={styles.extraFieldLabel}>Última transferencia (monto)</label>
                      <input
                        type="text"
                        value={lastTransferPrice}
                        onChange={(e) => setLastTransferPrice(e.target.value)}
                        placeholder="Ej: S/ 45,000 o USD 12,000"
                        className={styles.extraFieldInput}
                        disabled={!canEdit}
                      />
                    </div>
                  )}
                </div>
                <div className={styles.sourcesList}>
                  {category.sources.map((source) => {
                    const screenshots = getScreenshots(source.id as LegalSourceId);
                    const maxImages = getMaxImages(source.id as LegalSourceId);
                    const canUpload = canUploadMore(source.id as LegalSourceId);
                    const isUploading = uploading === source.id;
                    const isActiveForPaste = activeSourceForPaste === source.id;
                    const isMultiImage = maxImages > 1;

                    return (
                      <div
                        key={source.id}
                        className={`${styles.sourceRow} ${
                          screenshots.length > 0 ? styles.sourceRowUploaded : ''
                        } ${isActiveForPaste ? styles.sourceRowActive : ''}`}
                      >
                        {/* Columna 1: Info + URL */}
                        <div className={styles.sourceInfo}>
                          <div className={styles.sourceNameRow}>
                            <h5 className={styles.sourceName}>
                              {screenshots.length > 0 && <CheckCircle size={14} className={styles.checkIcon} />}
                              {source.name}
                              {source.required && (
                                <span className={styles.requiredBadge}>*</span>
                              )}
                              {isMultiImage && (
                                <span className={styles.multiImageBadge}>
                                  {screenshots.length}/{maxImages}
                                </span>
                              )}
                              {source.tooltip && (
                                <span className={styles.sourceTooltip} title={source.tooltip}>
                                  <HelpCircle size={12} />
                                </span>
                              )}
                            </h5>
                          </div>

                          <p className={styles.sourceDescription}>{source.description}</p>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.sourceLink}
                          >
                            <ExternalLink size={12} />
                            {source.url.replace('https://', '').split('/')[0]}
                          </a>
                        </div>

                        {/* Columna 2: Preview de imágenes o área de upload */}
                        <div className={isMultiImage ? styles.sourceImageColMulti : styles.sourceImageCol}>
                          {isMultiImage ? (
                            // Vista de múltiples imágenes
                            <div className={styles.multiImageGrid}>
                              {screenshots.map((screenshot, idx) => (
                                <div key={idx} className={styles.multiThumbnailWrapper}>
                                  <Image
                                    src={screenshot.imageUrl}
                                    alt={`${source.name} ${idx + 1}`}
                                    fill
                                    className={styles.thumbnail}
                                    onClick={() => setPreviewImage(screenshot.imageUrl)}
                                  />
                                  <button
                                    onClick={() => handleDelete(source.id as LegalSourceId, idx)}
                                    className={styles.multiDeleteBtn}
                                    title="Eliminar"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                              {canUpload && (
                                <div className={styles.multiUploadActions}>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(source.id as LegalSourceId, e)}
                                    disabled={isUploading}
                                    ref={(el) => { fileInputRefs.current[source.id] = el; }}
                                    className={styles.fileInput}
                                  />
                                  {/* Área para pegar con Ctrl+V */}
                                  <div
                                    className={`${styles.multiPasteBox} ${isActiveForPaste ? styles.multiPasteBoxActive : ''}`}
                                    onClick={() => setActiveSourceForPaste(source.id as LegalSourceId)}
                                    onFocus={() => setActiveSourceForPaste(source.id as LegalSourceId)}
                                    tabIndex={0}
                                  >
                                    {isUploading ? (
                                      <Loader2 size={14} className={styles.spinner} />
                                    ) : (
                                      <>
                                        <Clipboard size={14} />
                                        <span>Ctrl+V</span>
                                      </>
                                    )}
                                  </div>
                                  {/* Botón para subir archivo */}
                                  <button
                                    type="button"
                                    className={styles.multiUploadBtn}
                                    onClick={() => fileInputRefs.current[source.id]?.click()}
                                    disabled={isUploading}
                                    title="Subir archivo"
                                  >
                                    <Upload size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            // Vista de imagen única (original)
                            screenshots.length > 0 ? (
                              <div className={styles.thumbnailWrapper}>
                                <Image
                                  src={screenshots[0].imageUrl}
                                  alt={source.name}
                                  fill
                                  className={styles.thumbnail}
                                  onClick={() => setPreviewImage(screenshots[0].imageUrl)}
                                />
                              </div>
                            ) : (
                              <div
                                className={`${styles.uploadBox} ${isActiveForPaste ? styles.uploadBoxActive : ''}`}
                                onClick={() => {
                                  setActiveSourceForPaste(source.id as LegalSourceId);
                                  fileInputRefs.current[source.id]?.click();
                                }}
                                onFocus={() => setActiveSourceForPaste(source.id as LegalSourceId)}
                                tabIndex={0}
                              >
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileChange(source.id as LegalSourceId, e)}
                                  disabled={isUploading}
                                  ref={(el) => { fileInputRefs.current[source.id] = el; }}
                                  className={styles.fileInput}
                                />
                                {isUploading ? (
                                  <Loader2 size={20} className={styles.spinner} />
                                ) : isActiveForPaste ? (
                                  <div className={styles.pasteHint}>
                                    <Clipboard size={16} />
                                    <span>Ctrl+V</span>
                                  </div>
                                ) : (
                                  <Upload size={20} />
                                )}
                              </div>
                            )
                          )}
                        </div>

                        {/* Columna 3: Acciones (solo para vista de imagen única) */}
                        {!isMultiImage && (
                          <div className={styles.sourceActions}>
                            {screenshots.length > 0 ? (
                              <>
                                <button
                                  onClick={() => setPreviewImage(screenshots[0].imageUrl)}
                                  className={styles.actionBtn}
                                  title="Ver imagen"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(source.id as LegalSourceId)}
                                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                  title="Eliminar"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setActiveSourceForPaste(source.id as LegalSourceId)}
                                className={`${styles.actionBtn} ${isActiveForPaste ? styles.actionBtnActive : ''}`}
                                title="Activar para pegar (Ctrl+V)"
                              >
                                <Clipboard size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección: Infracciones y registros */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Infracciones y Registros</h3>
          <div className={styles.categoriesList}>
            {LEGAL_CATEGORIES.filter((cat) => cat.section === 'infractions').map((category) => (
              <div key={category.id} className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <h4 className={styles.categoryTitle}>{category.name}</h4>

                  {/* Botones de Estado de la Categoría */}
                  <div className={styles.statusButtonsRow}>
                    <button
                      type="button"
                      onClick={() => setCategoryStatus(category.id, 'OK')}
                      className={`${styles.statusBtn} ${styles.statusBtnOK} ${
                        getCategoryStatus(category.id) === 'OK' ? styles.statusBtnActive : ''
                      }`}
                      title="Sin problemas"
                    >
                      <CheckCircle2 size={14} />
                      <span>OK</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryStatus(category.id, 'WARNING')}
                      className={`${styles.statusBtn} ${styles.statusBtnWARNING} ${
                        getCategoryStatus(category.id) === 'WARNING' ? styles.statusBtnActive : ''
                      }`}
                      title="Observación"
                    >
                      <AlertCircle size={14} />
                      <span>Observación</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryStatus(category.id, 'CRITICAL')}
                      className={`${styles.statusBtn} ${styles.statusBtnCRITICAL} ${
                        getCategoryStatus(category.id) === 'CRITICAL' ? styles.statusBtnActive : ''
                      }`}
                      title="Crítico"
                    >
                      <AlertTriangle size={14} />
                      <span>Crítico</span>
                    </button>
                  </div>

                  {/* Textarea de Observaciones (solo si es WARNING o CRITICAL) */}
                  {(getCategoryStatus(category.id) === 'WARNING' || getCategoryStatus(category.id) === 'CRITICAL') && (
                    <div className={styles.observationBox}>
                      <textarea
                        value={getCategoryObservation(category.id)}
                        onChange={(e) => setCategoryObservation(category.id, e.target.value)}
                        placeholder={`Escriba las observaciones sobre ${category.name}...`}
                        rows={2}
                        className={styles.observationTextarea}
                      />
                    </div>
                  )}
                </div>
                <div className={styles.sourcesList}>
                  {category.sources.map((source) => {
                    const screenshots = getScreenshots(source.id as LegalSourceId);
                    const maxImages = getMaxImages(source.id as LegalSourceId);
                    const canUpload = canUploadMore(source.id as LegalSourceId);
                    const isUploading = uploading === source.id;
                    const isActiveForPaste = activeSourceForPaste === source.id;
                    const isMultiImage = maxImages > 1;

                    return (
                      <div
                        key={source.id}
                        className={`${styles.sourceRow} ${
                          screenshots.length > 0 ? styles.sourceRowUploaded : ''
                        } ${isActiveForPaste ? styles.sourceRowActive : ''}`}
                      >
                        {/* Columna 1: Info + URL */}
                        <div className={styles.sourceInfo}>
                          <div className={styles.sourceNameRow}>
                            <h5 className={styles.sourceName}>
                              {screenshots.length > 0 && <CheckCircle size={14} className={styles.checkIcon} />}
                              {source.name}
                              {source.required && (
                                <span className={styles.requiredBadge}>*</span>
                              )}
                              {isMultiImage && (
                                <span className={styles.multiImageBadge}>
                                  {screenshots.length}/{maxImages}
                                </span>
                              )}
                              {source.tooltip && (
                                <span className={styles.sourceTooltip} title={source.tooltip}>
                                  <HelpCircle size={12} />
                                </span>
                              )}
                            </h5>
                          </div>

                          <p className={styles.sourceDescription}>{source.description}</p>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.sourceLink}
                          >
                            <ExternalLink size={12} />
                            {source.url.replace('https://', '').split('/')[0]}
                          </a>
                        </div>

                        {/* Columna 2: Preview de imágenes o área de upload */}
                        <div className={isMultiImage ? styles.sourceImageColMulti : styles.sourceImageCol}>
                          {isMultiImage ? (
                            // Vista de múltiples imágenes
                            <div className={styles.multiImageGrid}>
                              {screenshots.map((screenshot, idx) => (
                                <div key={idx} className={styles.multiThumbnailWrapper}>
                                  <Image
                                    src={screenshot.imageUrl}
                                    alt={`${source.name} ${idx + 1}`}
                                    fill
                                    className={styles.thumbnail}
                                    onClick={() => setPreviewImage(screenshot.imageUrl)}
                                  />
                                  <button
                                    onClick={() => handleDelete(source.id as LegalSourceId, idx)}
                                    className={styles.multiDeleteBtn}
                                    title="Eliminar"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                              {canUpload && (
                                <div className={styles.multiUploadActions}>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(source.id as LegalSourceId, e)}
                                    disabled={isUploading}
                                    ref={(el) => { fileInputRefs.current[source.id] = el; }}
                                    className={styles.fileInput}
                                  />
                                  {/* Área para pegar con Ctrl+V */}
                                  <div
                                    className={`${styles.multiPasteBox} ${isActiveForPaste ? styles.multiPasteBoxActive : ''}`}
                                    onClick={() => setActiveSourceForPaste(source.id as LegalSourceId)}
                                    onFocus={() => setActiveSourceForPaste(source.id as LegalSourceId)}
                                    tabIndex={0}
                                  >
                                    {isUploading ? (
                                      <Loader2 size={14} className={styles.spinner} />
                                    ) : (
                                      <>
                                        <Clipboard size={14} />
                                        <span>Ctrl+V</span>
                                      </>
                                    )}
                                  </div>
                                  {/* Botón para subir archivo */}
                                  <button
                                    type="button"
                                    className={styles.multiUploadBtn}
                                    onClick={() => fileInputRefs.current[source.id]?.click()}
                                    disabled={isUploading}
                                    title="Subir archivo"
                                  >
                                    <Upload size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            // Vista de imagen única (original)
                            screenshots.length > 0 ? (
                              <div className={styles.thumbnailWrapper}>
                                <Image
                                  src={screenshots[0].imageUrl}
                                  alt={source.name}
                                  fill
                                  className={styles.thumbnail}
                                  onClick={() => setPreviewImage(screenshots[0].imageUrl)}
                                />
                              </div>
                            ) : (
                              <div
                                className={`${styles.uploadBox} ${isActiveForPaste ? styles.uploadBoxActive : ''}`}
                                onClick={() => {
                                  setActiveSourceForPaste(source.id as LegalSourceId);
                                  fileInputRefs.current[source.id]?.click();
                                }}
                                onFocus={() => setActiveSourceForPaste(source.id as LegalSourceId)}
                                tabIndex={0}
                              >
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileChange(source.id as LegalSourceId, e)}
                                  disabled={isUploading}
                                  ref={(el) => { fileInputRefs.current[source.id] = el; }}
                                  className={styles.fileInput}
                                />
                                {isUploading ? (
                                  <Loader2 size={20} className={styles.spinner} />
                                ) : isActiveForPaste ? (
                                  <div className={styles.pasteHint}>
                                    <Clipboard size={16} />
                                    <span>Ctrl+V</span>
                                  </div>
                                ) : (
                                  <Upload size={20} />
                                )}
                              </div>
                            )
                          )}
                        </div>

                        {/* Columna 3: Acciones (solo para vista de imagen única) */}
                        {!isMultiImage && (
                          <div className={styles.sourceActions}>
                            {screenshots.length > 0 ? (
                              <>
                                <button
                                  onClick={() => setPreviewImage(screenshots[0].imageUrl)}
                                  className={styles.actionBtn}
                                  title="Ver imagen"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(source.id as LegalSourceId)}
                                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                  title="Eliminar"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setActiveSourceForPaste(source.id as LegalSourceId)}
                                className={`${styles.actionBtn} ${isActiveForPaste ? styles.actionBtnActive : ''}`}
                                title="Activar para pegar (Ctrl+V)"
                              >
                                <Clipboard size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Observaciones Generales */}
      <div className={styles.observationsCard}>
        <h3 className={styles.observationsTitle}>Observaciones Generales</h3>
        <textarea
          value={generalObservations}
          onChange={(e) => onGeneralObservationsChange(e.target.value)}
          placeholder="Agrega observaciones adicionales sobre la revisión legal..."
          rows={4}
          disabled={!canEdit}
          className={styles.observationsTextarea}
        />
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
