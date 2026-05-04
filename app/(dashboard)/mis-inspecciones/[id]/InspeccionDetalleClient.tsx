"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import styles from "./InspeccionDetalle.module.css";
import { getVerdict } from "@/lib/inspection-verdict";
import { InspectionTimeline } from "./InspectionTimeline";
import PaymentMethods from "@/app/components/Booking/PaymentMethods/PaymentMethods";

interface InspectionData {
  id: number;
  code: string;
  status: BookingStatus;
  date: string;
  timeSlot: string;
  expiresAt: string | null;
  createdAt: string;
  clientNotes: string | null;
  inspectorNotes: string | null;
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plate: string | null;
  };
  inspectionPlan: {
    id: number;
    type: string;
    title: string;
    price: number;
  };
  inspector: {
    id: string;
    name: string | null;
  } | null;
  payment: {
    id: number;
    status: string;
    amount: number;
    paidAt: string | null;
    receiptNumber: string | null;
  } | null;
  report: {
    id: number;
    legalStatus: string;
    legalScore: number | null;
    mechanicalStatus: string;
    mechanicalScore: number | null;
    bodyStatus: string;
    bodyScore: number | null;
    overallScore: number | null;
    overallStatus: string;
    executiveSummary: string | null;
    completedAt: string | null;
    pdfUrl: string | null;
  } | null;
  vehicleInspection: {
    id: number;
    plate: string | null;
    legalStatus: "BLOQUEADO" | "PENDIENTE" | "EN_PROCESO" | "COMPLETADO";
    mechanicalStatus: "PENDIENTE" | "EN_PROCESO" | "COMPLETADO";
    legalPdfUrl: string | null;
    assignedMechanic: { id: string; name: string } | null;
    assignedAdmin: { id: string; name: string } | null;
    createdAt: string;
    plateAddedAt: string | null;
    legalUnlockedAt: string | null;
    legalStartedAt: string | null;
    legalCompletedAt: string | null;
    mechanicAssignedAt: string | null;
    mechanicStartedAt: string | null;
    mechanicCompletedAt: string | null;
  } | null;
}

interface InspeccionDetalleClientProps {
  inspection: InspectionData;
}

export function InspeccionDetalleClient({
  inspection,
}: InspeccionDetalleClientProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const isPendingPayment = inspection.status === "PENDING_PAYMENT";
  const isPendingVerification = inspection.status === "PENDING_VERIFICATION";
  const isCompleted = inspection.status === "COMPLETED";
  const isPaid = ["PAID", "COMPLETED"].includes(inspection.status);
  const _canCancel = ["PENDING_PAYMENT", "PENDING_VERIFICATION", "PAID"].includes(inspection.status);

  // Renderizar vista según estado
  if (isPendingPayment) {
    return (
      <div className={styles.pageContainer}>
        <Header code={inspection.code} />
        <PendingPaymentView inspection={inspection} />
      </div>
    );
  }

  if (isPendingVerification) {
    return (
      <div className={styles.pageContainer}>
        <Header code={inspection.code} />
        <PendingVerificationView inspection={inspection} />
      </div>
    );
  }

  if (isPaid) {
    return (
      <div className={styles.pageContainer}>
        <Header code={inspection.code} />
        {isCompleted ? (
          <CompletedView inspection={inspection} />
        ) : (
          <PaymentSuccessView inspection={inspection} />
        )}
      </div>
    );
  }

  // Estados: CANCELLED, NO_SHOW, EXPIRED
  return (
    <div className={styles.pageContainer}>
      <Header code={inspection.code} />
      <CancelledView inspection={inspection} />
    </div>
  );
}

// ============================================
// Header Component
// ============================================
function Header({ code }: { code: string }) {
  return (
    <header className={styles.header}>
      <Link href="/mis-inspecciones" className={styles.backLink}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M12.5 15L7.5 10L12.5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Volver a mis inspecciones
      </Link>
      <h1 className={styles.pageTitle}>Inspección {code}</h1>
    </header>
  );
}
// ============================================
// Pending Payment View - Reutiliza PaymentMethods
// ============================================
function PendingPaymentView({ inspection }: { inspection: InspectionData }) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"culqi" | "transfer" | "yape" | "whatsapp" | null>("culqi");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/bookings/${inspection.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        router.push("/mis-inspecciones");
        router.refresh();
      } else {
        setError(data.error || "Error al cancelar la inspección");
        setShowCancelConfirm(false);
      }
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
      setShowCancelConfirm(false);
    } finally {
      setCancelLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    router.refresh();
  };

  const handlePaymentExpired = () => {
    router.refresh();
  };

  const handleAlternativePaymentSuccess = () => {
    router.refresh();
  };

  return (
    <div className={styles.content}>
      <div className={styles.mainCard}>
        {/* Status Badge */}
        <div className={styles.statusBadge} data-status="pending">
          <span className={styles.statusDot} />
          Pendiente de pago
        </div>

        {/* Error */}
        {error && (
          <div className={styles.error}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M10 6v5M10 13.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Reutilizar componente PaymentMethods */}
        <PaymentMethods
          selectedMethod={paymentMethod}
          onSelectMethod={setPaymentMethod}
          bookingDetails={{
            bookingCode: inspection.code,
            userName: "",
            planTitle: inspection.inspectionPlan.title,
            planType: inspection.inspectionPlan.type,
            totalAmount: inspection.inspectionPlan.price,
          }}
          bookingId={inspection.id}
          expiresAt={inspection.expiresAt ? new Date(inspection.expiresAt) : new Date(Date.now() + 30 * 60 * 1000)}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentExpired={handlePaymentExpired}
          onAlternativePaymentSuccess={handleAlternativePaymentSuccess}
        />

        {/* Botón cancelar */}
        <div style={{ marginTop: "1rem" }}>
          <button
            onClick={() => setShowCancelConfirm(true)}
            disabled={cancelLoading}
            className={styles.secondaryButton}
            style={{ width: "100%" }}
          >
            Cancelar reserva
          </button>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3 className={styles.modalTitle}>¿Cancelar reserva?</h3>
              <p className={styles.modalMessage}>
                Esta acción no se puede deshacer. ¿Estás seguro de que deseas cancelar esta inspección?
              </p>
              <div className={styles.modalActions}>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={cancelLoading}
                  className={styles.secondaryButton}
                >
                  No, mantener
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  className={styles.dangerButton}
                >
                  {cancelLoading ? "Cancelando..." : "Sí, cancelar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Pending Verification View
// ============================================
function PendingVerificationView({ inspection }: { inspection: InspectionData }) {
  const router = useRouter();
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/bookings/${inspection.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        router.push("/mis-inspecciones");
        router.refresh();
      } else {
        setError(data.error || "Error al cancelar la inspección");
        setShowCancelConfirm(false);
      }
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
      setShowCancelConfirm(false);
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className={styles.content}>
      <div className={styles.mainCard}>
        {/* Verification Icon */}
        <div className={styles.verificationIcon}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#F97316" fillOpacity="0.1" />
            <path
              d="M24 16v8m0 4v.5"
              stroke="#F97316"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h2 className={styles.verificationTitle}>Verificando pago</h2>
        <p className={styles.verificationMessage}>
          Tu pago está siendo verificado por nuestro equipo. Te notificaremos cuando esté confirmado.
        </p>

        {/* Status Badge */}
        <div className={styles.statusBadge} data-status="pending_verification">
          <span className={styles.statusDot} />
          Verificando pago
        </div>

        {/* Error */}
        {error && (
          <div className={styles.error}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M10 6v5M10 13.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Booking Summary */}
        <BookingSummary inspection={inspection} showPrice={false} />

        {/* Actions */}
        <div className={styles.actions}>
          <button
            onClick={() => setShowCancelConfirm(true)}
            disabled={cancelLoading}
            className={styles.secondaryButton}
          >
            Cancelar reserva
          </button>
          <Link href="/mis-inspecciones" className={styles.primaryButton}>
            Volver
          </Link>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3 className={styles.modalTitle}>¿Cancelar reserva?</h3>
              <p className={styles.modalMessage}>
                Esta acción no se puede deshacer. ¿Estás seguro de que deseas cancelar esta inspección?
              </p>
              <div className={styles.modalActions}>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={cancelLoading}
                  className={styles.secondaryButton}
                >
                  No, mantener
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  className={styles.dangerButton}
                >
                  {cancelLoading ? "Cancelando..." : "Sí, cancelar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Payment Success View
// ============================================
function PaymentSuccessView({ inspection }: { inspection: InspectionData }) {
  const router = useRouter();
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/bookings/${inspection.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        router.push("/mis-inspecciones");
        router.refresh();
      } else {
        setError(data.error || "Error al cancelar la inspección");
        setShowCancelConfirm(false);
      }
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
      setShowCancelConfirm(false);
    } finally {
      setCancelLoading(false);
    }
  };

  const statusLabels: Record<string, string> = {
    PAID: "Pago confirmado",
  };

  return (
    <div className={styles.content}>
      <div className={styles.mainCard}>
        {/* Success Icon */}
        <div className={styles.successIcon}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#22C55E" fillOpacity="0.1" />
            <path
              d="M16 24L22 30L32 18"
              stroke="#22C55E"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className={styles.successTitle}>Pago completado</h2>
        <p className={styles.successMessage}>
          Tu pago ha sido procesado exitosamente. Pronto recibirás la
          confirmación por correo.
        </p>

        {/* Status Badge */}
        <div
          className={styles.statusBadge}
          data-status={inspection.status.toLowerCase()}
        >
          <span className={styles.statusDot} />
          {statusLabels[inspection.status] || inspection.status}
        </div>

        {/* Payment Details */}
        {inspection.payment && (
          <div className={styles.paymentDetails}>
            <div className={styles.paymentDetailItem}>
              <span className={styles.paymentDetailLabel}>N° de operación</span>
              <span className={styles.paymentDetailValue}>
                {inspection.payment.receiptNumber ||
                  `#${inspection.payment.id}`}
              </span>
            </div>
            <div className={styles.paymentDetailItem}>
              <span className={styles.paymentDetailLabel}>Monto pagado</span>
              <span className={styles.paymentDetailValue}>
                S/ {(inspection.payment.amount / 100).toFixed(2)}
              </span>
            </div>
            {inspection.payment.paidAt && (
              <div className={styles.paymentDetailItem}>
                <span className={styles.paymentDetailLabel}>Fecha de pago</span>
                <span className={styles.paymentDetailValue}>
                  {new Date(inspection.payment.paidAt).toLocaleDateString(
                    "es-PE",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Inspector Info */}
        <div className={styles.inspectorCard}>
          <div className={styles.inspectorAvatar}>
            {inspection.inspector ? (inspection.inspector.name?.charAt(0) || "I") : "?"}
          </div>
          <div className={styles.inspectorInfo}>
            <p className={styles.inspectorLabel}>Inspector asignado</p>
            <p className={styles.inspectorName}>
              {inspection.inspector?.name ?? "Inspector todavía no asignado"}
            </p>
          </div>
        </div>

        {/* Inspection Timeline (flujo dual) */}
        {inspection.vehicleInspection && (
          <InspectionTimeline vehicleInspection={inspection.vehicleInspection} bookingId={inspection.id} />
        )}

        {/* Booking Summary */}
        <BookingSummary inspection={inspection} showPrice={false} />

        {/* Error */}
        {error && (
          <div className={styles.error}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M10 6v5M10 13.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button
            onClick={() => setShowCancelConfirm(true)}
            disabled={cancelLoading}
            className={styles.secondaryButton}
          >
            Cancelar inspección
          </button>
          <Link href="/mis-inspecciones" className={styles.primaryButton}>
            Volver
          </Link>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3 className={styles.modalTitle}>¿Cancelar inspección?</h3>
              <p className={styles.modalMessage}>
                Recuerda que debes cancelar con al menos 24 horas de anticipación. Esta acción no se puede deshacer.
              </p>
              <div className={styles.modalActions}>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={cancelLoading}
                  className={styles.secondaryButton}
                >
                  No, mantener
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  className={styles.dangerButton}
                >
                  {cancelLoading ? "Cancelando..." : "Sí, cancelar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Completed View (with Report)
// ============================================
function CompletedView({ inspection }: { inspection: InspectionData }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      // Si existe un PDF pre-generado, usarlo directamente
      if (inspection.report?.pdfUrl) {
        window.open(inspection.report.pdfUrl, "_blank");
        setDownloading(false);
        return;
      }

      // Si no, generar el PDF on-demand
      const response = await fetch(
        `/api/inspections/${inspection.id}/report/pdf`,
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `informe-${inspection.code}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      console.error("Error descargando PDF:", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={styles.content}>
      {/* Success Banner */}
      <div className={styles.completedBanner}>
        <div className={styles.completedIcon}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M10 16L14 20L22 12"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <h2 className={styles.completedTitle}>Inspección completada</h2>
          <p className={styles.completedSubtitle}>
            El informe de tu inspección está listo para revisar
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.completedGrid}>
        {/* Left: Report Preview */}
        <div className={styles.reportCard}>
          <h3 className={styles.reportTitle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Informe de Inspección
          </h3>

          {/* Results Summary */}
          <div className={styles.resultsSummary}>
            <ResultItem
              label="Revisión Legal"
              status={
                inspection.report?.legalStatus?.toLowerCase() || "pending"
              }
              score={inspection.report?.legalScore}
            />
            <ResultItem
              label="Revisión Mecánica"
              status={
                inspection.report?.mechanicalStatus?.toLowerCase() || "pending"
              }
              score={inspection.report?.mechanicalScore}
            />
            <ResultItem
              label="Carrocería"
              status={inspection.report?.bodyStatus?.toLowerCase() || "pending"}
              score={inspection.report?.bodyScore}
            />
          </div>

          {/* Overall Score y Veredicto */}
          {inspection.report?.overallScore && (() => {
            const verdict = getVerdict(
              inspection.report.overallScore,
              inspection.report.overallStatus
            );
            const verdictColors = {
              SAFE: { bg: '#dcfce7', border: '#86efac', text: '#15803d' },
              NEGOTIATE: { bg: '#fef3c7', border: '#fcd34d', text: '#b45309' },
              DONT_BUY: { bg: '#fee2e2', border: '#fca5a5', text: '#b91c1c' },
              PENDING: { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' },
            };
            const colors = verdictColors[verdict.type];

            return (
              <div style={{ marginBottom: '1rem' }}>
                <div className={styles.overallScore}>
                  <span className={styles.overallScoreLabel}>Puntaje General</span>
                  <span className={styles.overallScoreValue}>
                    {inspection.report.overallScore}/100
                  </span>
                </div>
                {/* Badge de veredicto */}
                <div style={{
                  marginTop: '0.75rem',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: `2px solid ${colors.border}`,
                  backgroundColor: colors.bg,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{verdict.icon}</span>
                    <div>
                      <p style={{
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: colors.text,
                        margin: 0,
                      }}>
                        {verdict.label}
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        color: colors.text,
                        opacity: 0.85,
                        margin: '0.25rem 0 0 0',
                      }}>
                        {verdict.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info de cómo se calcula */}
                <ScoreCalculationInfoInline
                  legalScore={inspection.report?.legalScore ?? null}
                  mechanicalScore={inspection.report?.mechanicalScore ?? null}
                  bodyScore={inspection.report?.bodyScore ?? null}
                />
              </div>
            );
          })()}

          {/* Executive Summary */}
          {inspection.report?.executiveSummary && (
            <div className={styles.summarySection}>
              <h4 className={styles.summaryTitle}>Resumen</h4>
              <p className={styles.summaryText}>
                {inspection.report.executiveSummary}
              </p>
            </div>
          )}

          {/* Inspector Notes */}
          {inspection.inspectorNotes && (
            <div className={styles.notesSection}>
              <h4 className={styles.notesTitle}>Observaciones del inspector</h4>
              <p className={styles.notesContent}>{inspection.inspectorNotes}</p>
            </div>
          )}

          {/* Download Buttons */}
          <div className={styles.downloadButtons}>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className={styles.downloadButton}
            >
              {downloading ? (
                <>
                  <span className={styles.buttonSpinner} />
                  Generando PDF...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 3v10m0 0l-4-4m4 4l4-4M3 17h14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Descargar informe mecánico
                </>
              )}
            </button>

            {/* Legal PDF Download Button */}
            {inspection.vehicleInspection?.legalPdfUrl && (
              <a
                href={`/api/admin/vehicle-inspections/${inspection.vehicleInspection.id}/legal/download-pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.downloadButtonLegal}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Descargar informe legal
              </a>
            )}
          </div>
        </div>

        {/* Right: Booking Info */}
        <div className={styles.infoCard}>
          <BookingSummary inspection={inspection} showPrice={false} />

          {/* Payment Info */}
          {inspection.payment && (
            <div className={styles.paymentInfo}>
              <h4 className={styles.paymentInfoTitle}>Información del pago</h4>
              <div className={styles.paymentInfoItem}>
                <span>N° de operación</span>
                <span>
                  {inspection.payment.receiptNumber ||
                    `#${inspection.payment.id}`}
                </span>
              </div>
              <div className={styles.paymentInfoItem}>
                <span>Monto</span>
                <span>S/ {(inspection.payment.amount / 100).toFixed(2)}</span>
              </div>
              <div className={styles.paymentInfoItem}>
                <span>Estado</span>
                <span className={styles.paymentStatusPaid}>Pagado</span>
              </div>
            </div>
          )}

          {/* Inspector */}
          {inspection.inspector ? (
            <div className={styles.inspectorCard}>
              <div className={styles.inspectorAvatar}>
                {inspection.inspector.name?.charAt(0) || "I"}
              </div>
              <div className={styles.inspectorInfo}>
                <p className={styles.inspectorLabel}>Inspeccionado por</p>
                <p className={styles.inspectorName}>
                  {inspection.inspector.name}
                </p>
              </div>
            </div>
          ) : null}

          {/* Inspection Timeline (flujo dual) */}
          {inspection.vehicleInspection && (
            <InspectionTimeline vehicleInspection={inspection.vehicleInspection} bookingId={inspection.id} />
          )}
        </div>
      </div>

      {/* Back Link */}
      <div className={styles.backContainer}>
        <Link href="/mis-inspecciones" className={styles.backLinkBottom}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Volver a mis inspecciones
        </Link>
      </div>
    </div>
  );
}

// ============================================
// Score Calculation Info (inline styles)
// ============================================
function ScoreCalculationInfoInline({ legalScore, mechanicalScore, bodyScore }: {
  legalScore: number | null;
  mechanicalScore: number | null;
  bodyScore: number | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calcular contribuciones
  const legalContrib = legalScore ? (legalScore * 0.3).toFixed(1) : '--';
  const mechContrib = mechanicalScore ? (mechanicalScore * 0.4).toFixed(1) : '--';
  const bodyContrib = bodyScore ? (bodyScore * 0.3).toFixed(1) : '--';

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '0.75rem',
  };

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: '#6b7280',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          justifyContent: 'center',
          padding: '0.25rem',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <span>{isExpanded ? 'Ocultar' : '¿Cómo se calcula?'}</span>
      </button>

      {isExpanded && (
        <div style={{
          marginTop: '0.75rem',
          padding: '1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb',
        }}>
          <p style={{ fontSize: '0.75rem', color: '#4b5563', marginBottom: '0.75rem' }}>
            Cada área se evalúa de 0 a 100. El puntaje general es la suma ponderada:
          </p>

          <div style={rowStyle}>
            <span style={{ color: '#4b5563' }}>Legal</span>
            <span style={{ fontFamily: 'monospace', color: '#374151' }}>
              {legalScore ?? '--'} × 30% = <strong>{legalContrib}</strong>
            </span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: '#4b5563' }}>Mecánica</span>
            <span style={{ fontFamily: 'monospace', color: '#374151' }}>
              {mechanicalScore ?? '--'} × 40% = <strong>{mechContrib}</strong>
            </span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: '#4b5563' }}>Carrocería</span>
            <span style={{ fontFamily: 'monospace', color: '#374151' }}>
              {bodyScore ?? '--'} × 30% = <strong>{bodyContrib}</strong>
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.75rem',
            fontSize: '0.75rem',
          }}>
            <span style={{ color: '#111827', fontWeight: 500 }}>Total</span>
            <span style={{ fontFamily: 'monospace', color: '#111827', fontWeight: 700 }}>
              {legalContrib} + {mechContrib} + {bodyContrib} = {
                legalScore && mechanicalScore && bodyScore
                  ? Math.round(legalScore * 0.3 + mechanicalScore * 0.4 + bodyScore * 0.3)
                  : '--'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Result Item Component
// ============================================
function ResultItem({
  label,
  status,
  score,
}: {
  label: string;
  status: string;
  score?: number | null;
}) {
  const statusConfig: Record<
    string,
    { icon: JSX.Element; color: string; text: string }
  > = {
    ok: {
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M4 8l3 3 5-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      color: "#22C55E",
      text: "Aprobado",
    },
    warning: {
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 5v4m0 2v.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
      color: "#F59E0B",
      text: "Observaciones",
    },
    critical: {
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M5 5l6 6m0-6l-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
      color: "#EF4444",
      text: "Crítico",
    },
    pending: {
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
      color: "#9CA3AF",
      text: "Pendiente",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <div className={styles.resultItem}>
      <span className={styles.resultLabel}>{label}</span>
      <div className={styles.resultRight}>
        {score !== null && score !== undefined && (
          <span className={styles.resultScore}>{score}/100</span>
        )}
        <span className={styles.resultStatus} style={{ color: config.color }}>
          {config.icon}
          {config.text}
        </span>
      </div>
    </div>
  );
}

// ============================================
// Cancelled View
// ============================================
function CancelledView({ inspection }: { inspection: InspectionData }) {
  const statusLabels: Record<string, { title: string; message: string }> = {
    CANCELLED: {
      title: "Inspección cancelada",
      message:
        "Esta inspección fue cancelada. Si tienes alguna consulta, contáctanos.",
    },
    EXPIRED: {
      title: "Reserva expirada",
      message:
        "El tiempo para completar el pago ha expirado. Puedes agendar una nueva inspección.",
    },
    NO_SHOW: {
      title: "No se presentó",
      message: "No se registró asistencia a esta inspección.",
    },
  };

  const statusInfo = statusLabels[inspection.status] || statusLabels.CANCELLED;

  return (
    <div className={styles.content}>
      <div className={styles.mainCard}>
        <div className={styles.cancelledIcon}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#EF4444" fillOpacity="0.1" />
            <path
              d="M18 18l12 12m0-12l-12 12"
              stroke="#EF4444"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h2 className={styles.cancelledTitle}>{statusInfo.title}</h2>
        <p className={styles.cancelledMessage}>{statusInfo.message}</p>

        <BookingSummary inspection={inspection} showPrice={false} />

        <div className={styles.actions}>
          <Link href="/mis-inspecciones" className={styles.secondaryButton}>
            Volver
          </Link>
          <Link href="/agendar" className={styles.primaryButton}>
            Nueva inspección
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Booking Summary Component
// ============================================
function BookingSummary({
  inspection,
  showPrice = true,
}: {
  inspection: InspectionData;
  showPrice?: boolean;
}) {
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTimeSlot = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className={styles.summary}>
      <h3 className={styles.summaryTitle}>Detalles de la reserva</h3>

      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>Inspección</span>
        <span className={styles.summaryValue}>
          {inspection.inspectionPlan.title}
        </span>
      </div>

      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>Vehículo</span>
        <span className={styles.summaryValue}>
          {inspection.vehicle.brand} {inspection.vehicle.model}{" "}
          {inspection.vehicle.year}
        </span>
      </div>

      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>Placa</span>
        <span className={styles.summaryValue}>
          {inspection.vehicle.plate || "Sin placa"}
        </span>
      </div>

      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>Fecha</span>
        <span className={styles.summaryValue}>
          {formatDate(inspection.date)}
        </span>
      </div>

      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>Hora</span>
        <span className={styles.summaryValue}>
          {formatTimeSlot(inspection.timeSlot)}
        </span>
      </div>

      {showPrice && (
        <>
          <div className={styles.divider} />
          <div className={`${styles.summaryItem} ${styles.total}`}>
            <span className={styles.summaryLabel}>Total a pagar</span>
            <span className={styles.summaryValue}>
              S/ {inspection.inspectionPlan.price.toFixed(2)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
