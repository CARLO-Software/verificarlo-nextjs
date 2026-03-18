/**
 * LegalReportClient - Componente principal del formulario de informe legal
 * Maneja el bloqueo exclusivo, guardado y completado del informe
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock, Save, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { LegalFieldStatus } from '@prisma/client';
import { LegalFieldInput } from './LegalFieldInput';
import styles from './legal.module.css';

interface LegalReportData {
  id: number;
  status: string;
  lockedBy: string | null;
  lockedByUser: { id: string; name: string; email: string } | null;
  lockExpiresAt: string | null;
  completedAt: string | null;
  completedByUser: { id: string; name: string } | null;
  report: {
    booking: {
      vehicle: {
        plate: string | null;
        year: number;
        model: {
          name: string;
          brand: { name: string };
        };
      };
      client: { name: string; email: string };
      inspectionPlan: { title: string };
    };
  };
  // Campos del informe
  ownerHistoryStatus: LegalFieldStatus;
  ownerHistoryText: string | null;
  sunarpLiensStatus: LegalFieldStatus;
  sunarpLiensText: string | null;
  satCaptureOrderStatus: LegalFieldStatus;
  satCaptureOrderText: string | null;
  soatStatus: LegalFieldStatus;
  soatText: string | null;
  soatExpiryDate: string | null;
  techReviewStatus: LegalFieldStatus;
  techReviewText: string | null;
  techReviewExpiryDate: string | null;
  vehicleTaxStatus: LegalFieldStatus;
  vehicleTaxText: string | null;
  gasConversionStatus: LegalFieldStatus;
  gasConversionText: string | null;
  satTicketsStatus: LegalFieldStatus;
  satTicketsText: string | null;
  callaoTicketsStatus: LegalFieldStatus;
  callaoTicketsText: string | null;
  sutranTicketsStatus: LegalFieldStatus;
  sutranTicketsText: string | null;
  theftHistoryStatus: LegalFieldStatus;
  theftHistoryText: string | null;
  transportRegistryStatus: LegalFieldStatus;
  transportRegistryText: string | null;
  lastTransferStatus: LegalFieldStatus;
  lastTransferText: string | null;
  accidentHistoryStatus: LegalFieldStatus;
  accidentHistoryText: string | null;
  otherObservations: string | null;
}

interface LegalReportClientProps {
  legalReportId: number;
  currentUserId: string;
}

export function LegalReportClient({ legalReportId, currentUserId }: LegalReportClientProps) {
  const router = useRouter();
  const [data, setData] = useState<LegalReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLock, setHasLock] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Ref para el intervalo de renovación del bloqueo
  const lockRenewalRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar datos del informe
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/legal-reviews/${legalReportId}`);
      if (!res.ok) {
        throw new Error('Error al cargar el informe');
      }
      const reportData = await res.json();
      setData(reportData);
      return reportData;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [legalReportId]);

  // Adquirir bloqueo
  const acquireLock = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/legal-reviews/${legalReportId}/lock`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        setLockError(data.error || 'No se pudo adquirir el bloqueo');
        return false;
      }

      setHasLock(true);
      setLockError(null);
      return true;
    } catch (err: any) {
      setLockError('Error al adquirir bloqueo');
      return false;
    }
  }, [legalReportId]);

  // Renovar bloqueo
  const renewLock = useCallback(async () => {
    if (!hasLock) return;

    try {
      const res = await fetch(`/api/admin/legal-reviews/${legalReportId}/lock`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        console.error('Error renovando bloqueo');
        setHasLock(false);
      }
    } catch (err) {
      console.error('Error renovando bloqueo:', err);
    }
  }, [legalReportId, hasLock]);

  // Liberar bloqueo
  const releaseLock = useCallback(async () => {
    if (!hasLock) return;

    try {
      await fetch(`/api/admin/legal-reviews/${legalReportId}/lock`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error liberando bloqueo:', err);
    }
  }, [legalReportId, hasLock]);

  // Guardar cambios
  const handleSave = async () => {
    if (!data || !hasLock) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/legal-reviews/${legalReportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerHistoryStatus: data.ownerHistoryStatus,
          ownerHistoryText: data.ownerHistoryText,
          sunarpLiensStatus: data.sunarpLiensStatus,
          sunarpLiensText: data.sunarpLiensText,
          satCaptureOrderStatus: data.satCaptureOrderStatus,
          satCaptureOrderText: data.satCaptureOrderText,
          soatStatus: data.soatStatus,
          soatText: data.soatText,
          soatExpiryDate: data.soatExpiryDate,
          techReviewStatus: data.techReviewStatus,
          techReviewText: data.techReviewText,
          techReviewExpiryDate: data.techReviewExpiryDate,
          vehicleTaxStatus: data.vehicleTaxStatus,
          vehicleTaxText: data.vehicleTaxText,
          gasConversionStatus: data.gasConversionStatus,
          gasConversionText: data.gasConversionText,
          satTicketsStatus: data.satTicketsStatus,
          satTicketsText: data.satTicketsText,
          callaoTicketsStatus: data.callaoTicketsStatus,
          callaoTicketsText: data.callaoTicketsText,
          sutranTicketsStatus: data.sutranTicketsStatus,
          sutranTicketsText: data.sutranTicketsText,
          theftHistoryStatus: data.theftHistoryStatus,
          theftHistoryText: data.theftHistoryText,
          transportRegistryStatus: data.transportRegistryStatus,
          transportRegistryText: data.transportRegistryText,
          lastTransferStatus: data.lastTransferStatus,
          lastTransferText: data.lastTransferText,
          accidentHistoryStatus: data.accidentHistoryStatus,
          accidentHistoryText: data.accidentHistoryText,
          otherObservations: data.otherObservations,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al guardar');
      }

      setUnsavedChanges(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Completar informe
  const handleComplete = async () => {
    if (!data || !hasLock) return;

    if (!confirm('¿Estás seguro de marcar este informe como completado? Esta acción no se puede deshacer.')) {
      return;
    }

    setCompleting(true);
    setError(null);

    try {
      // Primero guardar cambios pendientes
      if (unsavedChanges) {
        await handleSave();
      }

      const res = await fetch(`/api/admin/legal-reviews/${legalReportId}/complete`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al completar');
      }

      // Redirigir a la lista de inspecciones
      router.push('/admin/inspecciones');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  };

  // Actualizar campo
  const updateField = (field: keyof LegalReportData, value: any) => {
    if (!data) return;
    setData({ ...data, [field]: value });
    setUnsavedChanges(true);
  };

  // Efectos
  useEffect(() => {
    const init = async () => {
      const reportData = await fetchData();

      // Si el informe no está completado, intentar adquirir bloqueo
      if (reportData && reportData.status !== 'COMPLETED') {
        await acquireLock();
      }
    };

    init();

    // Cleanup: liberar bloqueo al salir
    return () => {
      if (lockRenewalRef.current) {
        clearInterval(lockRenewalRef.current);
      }
      releaseLock();
    };
  }, [fetchData, acquireLock, releaseLock]);

  // Renovar bloqueo cada 5 minutos
  useEffect(() => {
    if (hasLock) {
      lockRenewalRef.current = setInterval(renewLock, 5 * 60 * 1000);
      return () => {
        if (lockRenewalRef.current) {
          clearInterval(lockRenewalRef.current);
        }
      };
    }
  }, [hasLock, renewLock]);

  // Advertir antes de salir con cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={32} />
        <p>Cargando informe legal...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={styles.errorContainer}>
        <AlertTriangle size={32} />
        <p>{error}</p>
        <Link href="/admin/inspecciones" className={styles.backLink}>
          Volver a inspecciones
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const isCompleted = data.status === 'COMPLETED';
  const isEditable = hasLock && !isCompleted;
  const vehicle = data.report.booking.vehicle;
  const vehicleInfo = `${vehicle.model.brand.name} ${vehicle.model.name} (${vehicle.year})`;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/admin/inspecciones" className={styles.backButton}>
          <ArrowLeft size={20} />
          Volver
        </Link>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Informe Legal</h1>
          <p className={styles.subtitle}>
            {vehicleInfo} {vehicle.plate && `- ${vehicle.plate}`}
          </p>
        </div>
      </div>

      {/* Status Banner */}
      {isCompleted && (
        <div className={styles.completedBanner}>
          <CheckCircle size={20} />
          <span>
            Completado por {data.completedByUser?.name || 'Admin'} el{' '}
            {data.completedAt && new Date(data.completedAt).toLocaleDateString('es-PE')}
          </span>
        </div>
      )}

      {lockError && !isCompleted && (
        <div className={styles.lockBanner}>
          <Lock size={20} />
          <span>{lockError}</span>
        </div>
      )}

      {error && (
        <div className={styles.errorBanner}>
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Form */}
      <div className={styles.formContainer}>
        <div className={styles.formGrid}>
          {/* Columna Izquierda */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Documentos y Registros</h3>

            <LegalFieldInput
              label="Historial de propietarios"
              statusValue={data.ownerHistoryStatus}
              textValue={data.ownerHistoryText || ''}
              onStatusChange={(v) => updateField('ownerHistoryStatus', v)}
              onTextChange={(v) => updateField('ownerHistoryText', v)}
              disabled={!isEditable}
            />

            <LegalFieldInput
              label="Gravámenes SUNARP"
              statusValue={data.sunarpLiensStatus}
              textValue={data.sunarpLiensText || ''}
              onStatusChange={(v) => updateField('sunarpLiensStatus', v)}
              onTextChange={(v) => updateField('sunarpLiensText', v)}
              disabled={!isEditable}
            />

            <LegalFieldInput
              label="Orden de captura SAT"
              statusValue={data.satCaptureOrderStatus}
              textValue={data.satCaptureOrderText || ''}
              onStatusChange={(v) => updateField('satCaptureOrderStatus', v)}
              onTextChange={(v) => updateField('satCaptureOrderText', v)}
              disabled={!isEditable}
            />

            <LegalFieldInput
              label="SOAT"
              statusValue={data.soatStatus}
              textValue={data.soatText || ''}
              dateValue={data.soatExpiryDate}
              onStatusChange={(v) => updateField('soatStatus', v)}
              onTextChange={(v) => updateField('soatText', v)}
              onDateChange={(v) => updateField('soatExpiryDate', v)}
              showDatePicker
              disabled={!isEditable}
            />

            <LegalFieldInput
              label="Revisión técnica vehicular"
              statusValue={data.techReviewStatus}
              textValue={data.techReviewText || ''}
              dateValue={data.techReviewExpiryDate}
              onStatusChange={(v) => updateField('techReviewStatus', v)}
              onTextChange={(v) => updateField('techReviewText', v)}
              onDateChange={(v) => updateField('techReviewExpiryDate', v)}
              showDatePicker
              disabled={!isEditable}
            />

            <LegalFieldInput
              label="Situación impuesto vehicular"
              statusValue={data.vehicleTaxStatus}
              textValue={data.vehicleTaxText || ''}
              onStatusChange={(v) => updateField('vehicleTaxStatus', v)}
              onTextChange={(v) => updateField('vehicleTaxText', v)}
              disabled={!isEditable}
            />

            <LegalFieldInput
              label="Transformado a gas"
              statusValue={data.gasConversionStatus}
              textValue={data.gasConversionText || ''}
              onStatusChange={(v) => updateField('gasConversionStatus', v)}
              onTextChange={(v) => updateField('gasConversionText', v)}
              disabled={!isEditable}
            />
          </div>

          {/* Columna Derecha */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Multas e Historial</h3>

            <LegalFieldInput
              label="Papeletas SAT"
              statusValue={data.satTicketsStatus}
              textValue={data.satTicketsText || ''}
              onStatusChange={(v) => updateField('satTicketsStatus', v)}
              onTextChange={(v) => updateField('satTicketsText', v)}
              disabled={!isEditable}
            />

            <LegalFieldInput
              label="Papeletas CALLAO"
              statusValue={data.callaoTicketsStatus}
              textValue={data.callaoTicketsText || ''}
              onStatusChange={(v) => updateField('callaoTicketsStatus', v)}
              onTextChange={(v) => updateField('callaoTicketsText', v)}
              disabled={!isEditable}
            />

            <LegalFieldInput
              label="Papeletas SUTRAN"
              statusValue={data.sutranTicketsStatus}
              textValue={data.sutranTicketsText || ''}
              onStatusChange={(v) => updateField('sutranTicketsStatus', v)}
              onTextChange={(v) => updateField('sutranTicketsText', v)}
              disabled={!isEditable}
            />

            <LegalFieldInput
              label="Historial de Robos"
              statusValue={data.theftHistoryStatus}
              textValue={data.theftHistoryText || ''}
              onStatusChange={(v) => updateField('theftHistoryStatus', v)}
              onTextChange={(v) => updateField('theftHistoryText', v)}
              disabled={!isEditable}
            />

            <LegalFieldInput
              label="Registro de transportes"
              statusValue={data.transportRegistryStatus}
              textValue={data.transportRegistryText || ''}
              onStatusChange={(v) => updateField('transportRegistryStatus', v)}
              onTextChange={(v) => updateField('transportRegistryText', v)}
              disabled={!isEditable}
            />

            <LegalFieldInput
              label="Datos última transferencia"
              statusValue={data.lastTransferStatus}
              textValue={data.lastTransferText || ''}
              onStatusChange={(v) => updateField('lastTransferStatus', v)}
              onTextChange={(v) => updateField('lastTransferText', v)}
              disabled={!isEditable}
            />

            <LegalFieldInput
              label="Siniestralidad"
              statusValue={data.accidentHistoryStatus}
              textValue={data.accidentHistoryText || ''}
              onStatusChange={(v) => updateField('accidentHistoryStatus', v)}
              onTextChange={(v) => updateField('accidentHistoryText', v)}
              disabled={!isEditable}
            />
          </div>
        </div>

        {/* Otras observaciones */}
        <div className={styles.observationsSection}>
          <h3 className={styles.columnTitle}>Otras observaciones</h3>
          <textarea
            className={styles.observationsTextarea}
            value={data.otherObservations || ''}
            onChange={(e) => updateField('otherObservations', e.target.value)}
            placeholder="Observaciones adicionales del informe legal..."
            disabled={!isEditable}
            rows={4}
          />
        </div>

        {/* Action Buttons */}
        {!isCompleted && hasLock && (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleSave}
              disabled={saving || !unsavedChanges}
            >
              {saving ? (
                <>
                  <Loader2 className={styles.spinnerSmall} size={16} />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Guardar borrador
                </>
              )}
            </button>

            <button
              type="button"
              className={styles.completeButton}
              onClick={handleComplete}
              disabled={completing}
            >
              {completing ? (
                <>
                  <Loader2 className={styles.spinnerSmall} size={16} />
                  Completando...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Completar informe
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
