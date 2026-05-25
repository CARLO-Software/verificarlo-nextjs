/**
 * VehicleInspectionLegalClient - Gestión completa del informe legal
 *
 * Permite al admin:
 * - Tomar el caso legal (PENDIENTE -> EN_PROCESO)
 * - Completar cada campo del informe legal
 * - Completar la revisión legal (EN_PROCESO -> COMPLETADO)
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  Clock,
  User,
  Car,
  FileText,
  Loader2,
  AlertTriangle,
  Save,
  Shield,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import styles from './VehicleInspectionLegal.module.css';
import {
  LegalScreenshotsUpload,
  type LegalScreenshot,
  type LegalSourceId,
} from './LegalScreenshotsUpload';

// Tipos para el estado de cada campo
type FieldStatus = 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';

interface LegalField {
  status: FieldStatus;
  text: string;
}

// Claves de campos legales (excluye otherObservations)
type LegalFieldKey =
  | 'ownerHistory'
  | 'sunarpLiens'
  | 'satCaptureOrder'
  | 'soat'
  | 'techReview'
  | 'vehicleTax'
  | 'gasConversion'
  | 'satTickets'
  | 'callaoTickets'
  | 'sutranTickets'
  | 'siniestroSoat'
  | 'transportRegistry'
  | 'lastTransfer'
  | 'accidentHistory';

interface LegalReportData {
  // Columna Izquierda
  ownerHistory: LegalField;
  sunarpLiens: LegalField;
  satCaptureOrder: LegalField;
  soat: LegalField;
  techReview: LegalField;
  vehicleTax: LegalField;
  gasConversion: LegalField;
  // Columna Derecha
  satTickets: LegalField;
  callaoTickets: LegalField;
  sutranTickets: LegalField;
  siniestroSoat: LegalField;
  transportRegistry: LegalField;
  lastTransfer: LegalField;
  accidentHistory: LegalField;
  // Observaciones generales
  otherObservations: string;
}

interface LegalScreenshotData {
  imageUrl: string;
  uploadedAt: string;
}

// El valor puede ser un objeto único o un array (para fuentes con múltiples imágenes)
type LegalScreenshotsMap = Record<string, LegalScreenshotData | LegalScreenshotData[]>;

interface Props {
  inspectionId: number;
  plate: string | null;
  vehicleDescription: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  legalStatus: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO';
  mechanicalStatus: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO';
  legalNotes: string | null;
  legalReportData: LegalReportData | null;
  legalScreenshots: LegalScreenshotsMap | null;
  assignedAdmin: { id: string; name: string } | null;
  assignedMechanic: { id: string; name: string } | null;
  legalStartedAt: string | null;
  legalCompletedAt: string | null;
  currentUserId: string;
}

// Configuración de los campos del informe legal
const LEGAL_FIELDS = {
  left: [
    { key: 'ownerHistory', label: 'Historial de Propietarios', icon: User },
    { key: 'sunarpLiens', label: 'Gravámenes SUNARP', icon: FileText },
    { key: 'satCaptureOrder', label: 'Orden de Captura SAT', icon: AlertTriangle },
    { key: 'soat', label: 'SOAT', icon: Shield },
    { key: 'techReview', label: 'Revisión Técnica', icon: CheckCircle },
    { key: 'vehicleTax', label: 'Impuesto Vehicular', icon: FileText },
    { key: 'gasConversion', label: 'Conversión a Gas', icon: Car },
  ],
  right: [
    { key: 'satTickets', label: 'Papeletas SAT', icon: AlertCircle },
    { key: 'callaoTickets', label: 'Papeletas Callao', icon: AlertCircle },
    { key: 'sutranTickets', label: 'Papeletas SUTRAN', icon: AlertCircle },
    { key: 'siniestroSoat', label: 'Siniestro SOAT', icon: AlertTriangle },
    { key: 'transportRegistry', label: 'Registro de Transportes', icon: FileText },
    { key: 'lastTransfer', label: 'Última Transferencia', icon: User },
    { key: 'accidentHistory', label: 'Historial de accidentes del seguro', icon: Car },
  ],
} as const;

const _STATUS_CONFIG = {
  OK: { label: 'Sin problemas', color: 'green', icon: CheckCircle2 },
  WARNING: { label: 'Observación', color: 'yellow', icon: AlertCircle },
  CRITICAL: { label: 'Crítico', color: 'red', icon: AlertTriangle },
  PENDING: { label: 'Pendiente', color: 'gray', icon: HelpCircle },
};

const defaultField: LegalField = { status: 'PENDING', text: '' };

const getDefaultReportData = (): LegalReportData => ({
  ownerHistory: { ...defaultField },
  sunarpLiens: { ...defaultField },
  satCaptureOrder: { ...defaultField },
  soat: { ...defaultField },
  techReview: { ...defaultField },
  vehicleTax: { ...defaultField },
  gasConversion: { ...defaultField },
  satTickets: { ...defaultField },
  callaoTickets: { ...defaultField },
  sutranTickets: { ...defaultField },
  siniestroSoat: { ...defaultField },
  transportRegistry: { ...defaultField },
  lastTransfer: { ...defaultField },
  accidentHistory: { ...defaultField },
  otherObservations: '',
});

export function VehicleInspectionLegalClient({
  inspectionId,
  plate,
  vehicleDescription,
  clientName,
  clientEmail,
  clientPhone,
  legalStatus: initialLegalStatus,
  mechanicalStatus,
  legalNotes: initialNotes,
  legalReportData: initialReportData,
  legalScreenshots: initialScreenshots,
  assignedAdmin,
  assignedMechanic,
  legalStartedAt,
  legalCompletedAt,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [legalStatus, setLegalStatus] = useState(initialLegalStatus);
  const [reportData, setReportData] = useState<LegalReportData>(
    initialReportData || getDefaultReportData()
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Estado para capturas de pantalla y PDF (soporta múltiples imágenes por fuente)
  const [screenshots, setScreenshots] = useState<LegalScreenshot[]>(() => {
    if (!initialScreenshots) return [];
    const result: LegalScreenshot[] = [];
    Object.entries(initialScreenshots).forEach(([sourceId, data]) => {
      if (Array.isArray(data)) {
        // Fuente con múltiples imágenes
        data.forEach((img, index) => {
          result.push({
            sourceId: sourceId as LegalSourceId,
            imageUrl: img.imageUrl,
            uploadedAt: new Date(img.uploadedAt),
            index,
          });
        });
      } else {
        // Fuente con imagen única
        result.push({
          sourceId: sourceId as LegalSourceId,
          imageUrl: data.imageUrl,
          uploadedAt: new Date(data.uploadedAt),
          index: 0,
        });
      }
    });
    return result;
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const isCompleted = legalStatus === 'COMPLETADO';
  const canTakeCase = legalStatus === 'PENDIENTE';
  const canEdit = legalStatus === 'EN_PROCESO';
  const isAssignedToMe = assignedAdmin?.id === currentUserId;

  // Actualizar un campo del reporte
  const updateField = (key: LegalFieldKey | 'otherObservations', value: LegalField | string) => {
    setReportData((prev) => ({ ...prev, [key]: value }));
  };

  // Tomar el caso (PENDIENTE -> EN_PROCESO)
  const handleTakeCase = async () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/vehicle-inspections/${inspectionId}/legal/take`, {
          method: 'POST',
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Error al tomar el caso');
        }

        setLegalStatus('EN_PROCESO');
        setSuccess('Has tomado el caso. Ahora puedes completar el informe legal.');
        router.refresh();
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  // Completar revisión (EN_PROCESO -> COMPLETADO)
  const handleComplete = async () => {
    setShowCompleteModal(false);
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        // Guardar solo otherObservations (los estados de categorías ya se guardan automáticamente en sourceStatuses)
        await fetch(`/api/admin/vehicle-inspections/${inspectionId}/legal/save`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            otherObservations: reportData.otherObservations,
          }),
        });

        // Completar
        const res = await fetch(`/api/admin/vehicle-inspections/${inspectionId}/legal/complete`, {
          method: 'POST',
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Error al completar');
        }

        setLegalStatus('COMPLETADO');
        setSuccess('Revisión legal completada. Ahora puedes subir las capturas de pantalla.');
        router.refresh();
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  // Handlers para capturas de pantalla (soporta múltiples imágenes)
  const handleScreenshotUploaded = (screenshot: LegalScreenshot) => {
    setScreenshots((prev) => {
      // Calcular el nuevo índice para esta fuente
      const existingForSource = prev.filter((s) => s.sourceId === screenshot.sourceId);
      const newIndex = existingForSource.length;
      return [...prev, { ...screenshot, index: newIndex }];
    });
  };

  const handleScreenshotDeleted = (sourceId: LegalSourceId, index?: number) => {
    setScreenshots((prev) => {
      if (index !== undefined) {
        // Eliminar imagen específica y reindexar
        const filtered = prev.filter(
          (s) => !(s.sourceId === sourceId && s.index === index)
        );
        // Reindexar las imágenes restantes de esta fuente
        let currentIndex = 0;
        return filtered.map((s) => {
          if (s.sourceId === sourceId) {
            return { ...s, index: currentIndex++ };
          }
          return s;
        });
      }
      // Eliminar todas las imágenes de esta fuente (comportamiento original)
      return prev.filter((s) => s.sourceId !== sourceId);
    });
  };

  // Calcular progreso
  const allFields = [...LEGAL_FIELDS.left, ...LEGAL_FIELDS.right];
  const completedFields = allFields.filter(
    (f) => reportData[f.key as LegalFieldKey]?.status !== 'PENDING'
  ).length;
  const progressPercent = Math.round((completedFields / allFields.length) * 100);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/admin/inspecciones" className={styles.backButton}>
          <ArrowLeft size={20} />
        </Link>
        <div className={styles.headerInfo}>
          <h1 className={styles.headerTitle}>Revisión Legal</h1>
          <p className={styles.headerSubtitle}>
            {vehicleDescription} {plate && `• ${plate}`}
          </p>
        </div>
        {isCompleted && (
          <span className={styles.completedBadge}>
            <CheckCircle size={16} />
            Completado
          </span>
        )}
      </header>

      <div className={styles.content}>
        {/* Status Cards */}
        <div className={styles.statusGrid}>
          <div className={styles.statusCard}>
            <div className={styles.statusCardHeader}>
              <FileText size={18} className={styles.iconPurple} />
              <span>Estado Legal</span>
            </div>
            <span className={`${styles.statusBadge} ${styles[`status${legalStatus}`]}`}>
              {legalStatus === 'PENDIENTE' && 'Pendiente'}
              {legalStatus === 'EN_PROCESO' && 'En Proceso'}
              {legalStatus === 'COMPLETADO' && 'Completado'}
            </span>
            {assignedAdmin && (
              <p className={styles.statusAssigned}>Asignado a: {assignedAdmin.name}</p>
            )}
          </div>

          <div className={styles.statusCard}>
            <div className={styles.statusCardHeader}>
              <Car size={18} className={styles.iconBlue} />
              <span>Estado Mecánico</span>
            </div>
            <span className={`${styles.statusBadge} ${styles[`status${mechanicalStatus}`]}`}>
              {mechanicalStatus === 'PENDIENTE' && 'Pendiente'}
              {mechanicalStatus === 'EN_PROCESO' && 'En Proceso'}
              {mechanicalStatus === 'COMPLETADO' && 'Completado'}
            </span>
            {assignedMechanic && (
              <p className={styles.statusAssigned}>Mecánico: {assignedMechanic.name}</p>
            )}
          </div>
        </div>

        {/* Vehicle & Client Info */}
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Información del Vehículo</h3>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>Placa</span>
              <span className={styles.infoValue}>{plate || 'Sin placa'}</span>
            </div>
            <div>
              <span className={styles.infoLabel}>Vehículo</span>
              <span className={styles.infoValue}>{vehicleDescription}</span>
            </div>
            <div>
              <span className={styles.infoLabel}>Cliente</span>
              <span className={styles.infoValue}>{clientName}</span>
            </div>
            <div>
              <span className={styles.infoLabel}>Contacto</span>
              <span className={styles.infoValue}>{clientPhone || clientEmail}</span>
            </div>
          </div>

          {(legalStartedAt || legalCompletedAt) && (
            <div className={styles.timestamps}>
              {legalStartedAt && (
                <div className={styles.timestamp}>
                  <Clock size={14} />
                  <span>Iniciado: {new Date(legalStartedAt).toLocaleString('es-PE')}</span>
                </div>
              )}
              {legalCompletedAt && (
                <div className={`${styles.timestamp} ${styles.timestampGreen}`}>
                  <CheckCircle size={14} />
                  <span>Completado: {new Date(legalCompletedAt).toLocaleString('es-PE')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Take Case Button */}
        {canTakeCase && (
          <button
            onClick={handleTakeCase}
            disabled={isPending}
            className={styles.takeCaseButton}
          >
            {isPending ? (
              <Loader2 size={20} className={styles.spinner} />
            ) : (
              <Play size={20} />
            )}
            Tomar Caso
          </button>
        )}

        {/* Legal Report Form */}
        {(canEdit || isCompleted) && (
          <>
            

            {/* Progress Bar */}
            {canEdit && (
              <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                  <span>Progreso del Informe</span>
                  <span className={styles.progressPercent}>{progressPercent}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className={styles.progressText}>
                  {completedFields} de {allFields.length} campos revisados
                </p>
              </div>
            )}
            {/* Sección de capturas (siempre visible cuando está en proceso o completado) */}
            <LegalScreenshotsUpload
              inspectionId={inspectionId}
              existingScreenshots={screenshots}
              onScreenshotUploaded={handleScreenshotUploaded}
              onScreenshotDeleted={handleScreenshotDeleted}
              initialSourceStatuses={(initialReportData as any)?.sourceStatuses || {}}
              initialSourceObservations={(initialReportData as any)?.sourceObservations || {}}
              generalObservations={reportData.otherObservations}
              onGeneralObservationsChange={(value) => updateField('otherObservations', value)}
              canEdit={canEdit && isAssignedToMe}
              initialSoatExpiryDate={(initialReportData as any)?.soatExpiryDate || ''}
              initialTechReviewExpiryDate={(initialReportData as any)?.techReviewExpiryDate || ''}
              initialTechReviewNotes={(initialReportData as any)?.techReviewNotes || ''}
              initialLastTransferPrice={(initialReportData as any)?.lastTransferPrice || ''}
            />
          </>
        )}

        {/* Messages */}
        {error && (
          <div className={styles.errorMessage}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className={styles.successMessage}>
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Actions */}
        {canEdit && isAssignedToMe && (
          <div className={styles.actions}>
            <button
              onClick={() => setShowCompleteModal(true)}
              disabled={isPending}
              className={styles.completeButton}
            >
              {isPending ? (
                <Loader2 size={18} className={styles.spinner} />
              ) : (
                <CheckCircle size={18} />
              )}
              Completar Revisión
            </button>
          </div>
        )}

        {/* PDF Section - Solo visible después de completar */}
        {isCompleted && (
          <div className={styles.pdfSection}>
            <div className={styles.pdfReady}>
              <div className={styles.pdfReadyIcon}>
                <FileText size={32} />
              </div>
              <div className={styles.pdfReadyText}>
                <h3>Informe Legal Completado</h3>
                <p>Descarga el PDF con los datos más recientes</p>
              </div>
              <div className={styles.pdfActions}>
                <button
                  onClick={async () => {
                    setIsGeneratingPdf(true);
                    setError(null);
                    try {
                      const res = await fetch(
                        `/api/admin/vehicle-inspections/${inspectionId}/legal/download-pdf`
                      );
                      if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || 'Error al descargar el PDF');
                      }
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `informe-legal-${inspectionId}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } catch (err: any) {
                      setError(err.message);
                    } finally {
                      setIsGeneratingPdf(false);
                    }
                  }}
                  disabled={isGeneratingPdf}
                  className={styles.downloadPdfButton}
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 size={18} className={styles.spinner} />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      Descargar Informe PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {canEdit && !isAssignedToMe && assignedAdmin && (
          <div className={styles.assignedWarning}>
            <User size={18} />
            Este caso está asignado a {assignedAdmin.name}
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      {showCompleteModal && (
        <>
          <div
            className={styles.modalBackdrop}
            onClick={() => setShowCompleteModal(false)}
          />
          <div className={styles.modal}>
            <div className={styles.modalIcon}>
              <CheckCircle size={48} className={styles.modalIconGreen} />
            </div>
            <h3 className={styles.modalTitle}>Completar Revisión Legal</h3>
            <p className={styles.modalText}>
              ¿Confirmas que has completado la revisión legal de este vehículo?
            </p>
            <p className={styles.modalSubtext}>
              Una vez completada, no podrás editar la información.
            </p>
            <div className={styles.modalActions}>
              <button
                onClick={() => setShowCompleteModal(false)}
                className={styles.modalButtonCancel}
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                onClick={handleComplete}
                className={styles.modalButtonConfirm}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} className={styles.spinner} />
                    Completando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Sí, Completar
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
