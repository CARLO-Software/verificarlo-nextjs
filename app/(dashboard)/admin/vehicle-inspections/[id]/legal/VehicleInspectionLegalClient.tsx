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
  | 'theftHistory'
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
  theftHistory: LegalField;
  transportRegistry: LegalField;
  lastTransfer: LegalField;
  accidentHistory: LegalField;
  // Observaciones generales
  otherObservations: string;
}

interface LegalScreenshotData {
  sourceId: string;
  imageUrl: string;
  uploadedAt: string;
}

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
  legalScreenshots: Record<string, LegalScreenshotData> | null;
  legalPdfUrl: string | null;
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
    { key: 'theftHistory', label: 'Historial de Robos', icon: AlertTriangle },
    { key: 'transportRegistry', label: 'Registro de Transportes', icon: FileText },
    { key: 'lastTransfer', label: 'Última Transferencia', icon: User },
    { key: 'accidentHistory', label: 'Siniestralidad', icon: Car },
  ],
} as const;

const STATUS_CONFIG = {
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
  theftHistory: { ...defaultField },
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
  legalPdfUrl: initialPdfUrl,
  assignedAdmin,
  assignedMechanic,
  legalStartedAt,
  legalCompletedAt,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [legalStatus, setLegalStatus] = useState(initialLegalStatus);
  const [notes, setNotes] = useState(initialNotes || '');
  const [reportData, setReportData] = useState<LegalReportData>(
    initialReportData || getDefaultReportData()
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Estado para capturas de pantalla y PDF
  const [screenshots, setScreenshots] = useState<LegalScreenshot[]>(() => {
    if (!initialScreenshots) return [];
    return Object.entries(initialScreenshots).map(([sourceId, data]) => ({
      sourceId: sourceId as LegalSourceId,
      imageUrl: data.imageUrl,
      uploadedAt: new Date(data.uploadedAt),
    }));
  });
  const [pdfUrl, setPdfUrl] = useState<string | null>(initialPdfUrl);
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

  // Guardar progreso
  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/vehicle-inspections/${inspectionId}/legal/save`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legalNotes: notes,
          legalReportData: reportData,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar');
      }

      setSuccess('Progreso guardado correctamente.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Completar revisión (EN_PROCESO -> COMPLETADO)
  const handleComplete = async () => {
    // Verificar que todos los campos estén completados
    const allFields = [...LEGAL_FIELDS.left, ...LEGAL_FIELDS.right];
    const pendingFields = allFields.filter(
      (f) => reportData[f.key as LegalFieldKey]?.status === 'PENDING'
    );

    if (pendingFields.length > 0) {
      setError(`Faltan campos por revisar: ${pendingFields.map((f) => f.label).join(', ')}`);
      return;
    }

    if (!confirm('¿Confirmas que has completado la revisión legal de este vehículo?')) {
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        // Guardar datos primero
        await fetch(`/api/admin/vehicle-inspections/${inspectionId}/legal/save`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            legalNotes: notes,
            legalReportData: reportData,
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

  // Handlers para capturas de pantalla
  const handleScreenshotUploaded = (screenshot: LegalScreenshot) => {
    setScreenshots((prev) => {
      const filtered = prev.filter((s) => s.sourceId !== screenshot.sourceId);
      return [...filtered, screenshot];
    });
  };

  const handleScreenshotDeleted = (sourceId: LegalSourceId) => {
    setScreenshots((prev) => prev.filter((s) => s.sourceId !== sourceId));
    // Si se elimina una captura, limpiar el PDF generado
    setPdfUrl(null);
  };

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/vehicle-inspections/${inspectionId}/legal/generate-pdf`,
        { method: 'POST' }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al generar el PDF');
      }

      const data = await res.json();
      setPdfUrl(data.pdfUrl);
      setSuccess('PDF generado exitosamente. El cliente ya puede descargarlo.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
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
        <Link href="/admin/vehicle-inspections" className={styles.backButton}>
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

            {/* Fields Grid */}
            <div className={styles.fieldsContainer}>
              <div className={styles.fieldsColumn}>
                <h3 className={styles.columnTitle}>Documentación Legal</h3>
                {LEGAL_FIELDS.left.map((field) => (
                  <LegalFieldCard
                    key={field.key}
                    label={field.label}
                    icon={field.icon}
                    value={reportData[field.key as LegalFieldKey]}
                    onChange={(val) => updateField(field.key as LegalFieldKey, val)}
                    disabled={!canEdit || !isAssignedToMe}
                  />
                ))}
              </div>

              <div className={styles.fieldsColumn}>
                <h3 className={styles.columnTitle}>Infracciones y Registros</h3>
                {LEGAL_FIELDS.right.map((field) => (
                  <LegalFieldCard
                    key={field.key}
                    label={field.label}
                    icon={field.icon}
                    value={reportData[field.key as LegalFieldKey]}
                    onChange={(val) => updateField(field.key as LegalFieldKey, val)}
                    disabled={!canEdit || !isAssignedToMe}
                  />
                ))}
              </div>
            </div>

            {/* Other Observations */}
            <div className={styles.observationsCard}>
              <h3 className={styles.observationsTitle}>Observaciones Generales</h3>
              <textarea
                value={reportData.otherObservations}
                onChange={(e) => updateField('otherObservations', e.target.value)}
                placeholder="Agrega observaciones adicionales sobre la revisión legal..."
                rows={4}
                disabled={!canEdit || !isAssignedToMe}
                className={styles.observationsTextarea}
              />
            </div>

            {/* Notes Section */}
            <div className={styles.notesCard}>
              <h3 className={styles.notesTitle}>Notas Internas</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas internas (no visibles para el cliente)..."
                rows={3}
                disabled={!canEdit || !isAssignedToMe}
                className={styles.notesTextarea}
              />
            </div>
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
              onClick={handleSave}
              disabled={saving || isPending}
              className={styles.saveButton}
            >
              {saving ? <Loader2 size={18} className={styles.spinner} /> : <Save size={18} />}
              Guardar Progreso
            </button>
            <button
              onClick={handleComplete}
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

        {canEdit && !isAssignedToMe && assignedAdmin && (
          <div className={styles.assignedWarning}>
            <User size={18} />
            Este caso está asignado a {assignedAdmin.name}
          </div>
        )}

        {/* Sección de capturas de pantalla (solo cuando está COMPLETADO) */}
        {isCompleted && (
          <LegalScreenshotsUpload
            inspectionId={inspectionId}
            existingScreenshots={screenshots}
            onScreenshotUploaded={handleScreenshotUploaded}
            onScreenshotDeleted={handleScreenshotDeleted}
            onGeneratePdf={handleGeneratePdf}
            pdfUrl={pdfUrl}
            isGeneratingPdf={isGeneratingPdf}
          />
        )}
      </div>
    </div>
  );
}

// Componente para cada campo del informe legal
function LegalFieldCard({
  label,
  icon: Icon,
  value,
  onChange,
  disabled,
}: {
  label: string;
  icon: any;
  value: LegalField;
  onChange: (val: LegalField) => void;
  disabled: boolean;
}) {
  const statusConfig = STATUS_CONFIG[value.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`${styles.fieldCard} ${styles[`fieldCard${value.status}`]}`}>
      <div className={styles.fieldHeader}>
        <div className={styles.fieldLabel}>
          <Icon size={16} />
          <span>{label}</span>
        </div>
        <div className={`${styles.fieldStatus} ${styles[`fieldStatus${value.status}`]}`}>
          <StatusIcon size={14} />
          <span>{statusConfig.label}</span>
        </div>
      </div>

      {!disabled && (
        <div className={styles.fieldStatusButtons}>
          {(['OK', 'WARNING', 'CRITICAL'] as FieldStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onChange({ ...value, status })}
              className={`${styles.statusButton} ${styles[`statusButton${status}`]} ${
                value.status === status ? styles.statusButtonActive : ''
              }`}
            >
              {STATUS_CONFIG[status].label}
            </button>
          ))}
        </div>
      )}

      <textarea
        value={value.text}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
        placeholder={`Observaciones sobre ${label.toLowerCase()}...`}
        rows={2}
        disabled={disabled}
        className={styles.fieldTextarea}
      />
    </div>
  );
}
