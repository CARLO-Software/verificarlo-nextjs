"use client";
/**
 * Culqi va a funcionar cuando se tenga la API_PUBLIC de ahí se obtiene la configuracion y
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import styles from "./InspeccionDetalle.module.css";

declare global {
  interface Window {
    Culqi: any;
    culqi: () => void;
  }
}

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
    id: number;
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
    recommendations: string | null;
    completedAt: string | null;
    pdfUrl: string | null;
  } | null;
}

interface InspeccionDetalleClientProps {
  inspection: InspectionData;
}

export function InspeccionDetalleClient({
  inspection,
}: InspeccionDetalleClientProps) {
  const router = useRouter();
  const isPendingPayment = inspection.status === "PENDING_PAYMENT";
  const isCompleted = inspection.status === "COMPLETED";
  const isPaid = ["PAID", "CONFIRMED", "COMPLETED"].includes(inspection.status);

  // Renderizar vista según estado
  if (isPendingPayment) {
    return (
      <div className={styles.pageContainer}>
        <Header code={inspection.code} />
        <PendingPaymentView inspection={inspection} />
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
//! Clic en la foto > mis inspecciones > pasar hasta el pago
// ============================================
// Pending Payment View
// ============================================
function PendingPaymentView({ inspection }: { inspection: InspectionData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [culqiReady, setCulqiReady] = useState(false);

  // useMemo memoriza el resultado y solo lo recalcula si inspection.expiresAt cambia.
  // Sin useMemo, cada re-render crea un nuevo objeto Date (nueva referencia en memoria),
  // lo que hace que el useEffect se re-ejecute innecesariamente y duplique el intervalo.
  const expiresAt = useMemo(
    () => (inspection.expiresAt ? new Date(inspection.expiresAt) : null),
    [inspection.expiresAt] // Solo recalcula si el string de expiración cambia
  );

  // Calcular tiempo restante
  useEffect(() => {
    if (!expiresAt) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = expiresAt.getTime();
      return Math.max(0, Math.floor((expiry - now) / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        router.refresh();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, router]);

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Configurar Culqi
  const handleCulqiLoad = useCallback(() => {
    if (typeof window !== "undefined" && window.Culqi) {
      window.Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY!;

      window.Culqi.settings({
        title: "VerifiCARLO",
        currency: "PEN",
        description: `Inspección ${inspection.inspectionPlan.type}`,
        amount: inspection.inspectionPlan.price * 100,
      });

      window.Culqi.options({
        lang: "es",
        style: {
          logo: "/logo.png",
          bannerColor: "#FDBF12",
          buttonBackground: "#FDBF12",
          buttonText: "#1A1A1A",
          buttonTextHover: "#1A1A1A",
        },
      });

      setCulqiReady(true);
    }
  }, [inspection.inspectionPlan]);

  // Handler global de Culqi
  useEffect(() => {
    window.culqi = async () => {
      if (window.Culqi.token) {
        setLoading(true);
        setError(null);

        try {
          const res = await fetch("/api/payments/culqi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingId: inspection.id,
              token: window.Culqi.token.id,
            }),
          });

          const data = await res.json();

          if (data.success) {
            router.refresh();
          } else {
            setError(data.error || "Error procesando el pago");
          }
        } catch (err) {
          setError("Error de conexión. Por favor intenta de nuevo.");
        } finally {
          setLoading(false);
        }
      } else if (window.Culqi.error) {
        setError(window.Culqi.error.user_message || "Error en el pago");
      }
    };
  }, [inspection.id, router]);

  const handleOpenCulqi = () => {
    if (window.Culqi && culqiReady) {
      //Si no tiene la configuracion llamando a la API_PUBLIC entonces no va a funcionar
      //Entonces no se va a habilitar
      //Si no funciona entonces no se puede generar el token para enviar al servidor de CULQI
      //! ES RECONTRA IMPORTANTE
      window.Culqi.open();
    }
  };

  const isExpired = timeLeft <= 0;
  const isUrgent = timeLeft > 0 && timeLeft < 300;

  return (
    <>
      {/*IMPORTANTE - AQUI COMIENZA*/}
      <Script src="https://checkout.culqi.com/js/v4" onLoad={handleCulqiLoad} />

      <div className={styles.content}>
        <div className={styles.mainCard}>
          {/* Status Badge */}
          <div className={styles.statusBadge} data-status="pending">
            <span className={styles.statusDot} />
            Pendiente de pago
          </div>

          {/* Timer */}
          {expiresAt && (
            <div
              className={`${styles.timer} ${isUrgent ? styles.timerUrgent : ""}`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M10 6v4l3 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>
                {isExpired
                  ? "Tiempo expirado"
                  : `Tiempo restante: ${formatTime(timeLeft)}`}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className={styles.error}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M10 6v5M10 13.5v.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Booking Summary */}
          <BookingSummary inspection={inspection} />

          {/* Payment Methods */}
          <div className={styles.paymentMethods}>
            <p className={styles.paymentMethodsLabel}>Aceptamos</p>
            <div className={styles.cards}>
              <img src="assets/icons/visa.svg" alt="Visa" />
              <img src="assets/icons/mastercard.svg" alt="Mastercard" />
              <img src="assets/icons/amex.svg" alt="American Express" />
              <img src="assets/icons/diners.svg" alt="Diners Club" />
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Link href="/mis-inspecciones" className={styles.secondaryButton}>
              Cancelar
            </Link>
            <button
              onClick={handleOpenCulqi}
              disabled={loading || isExpired || !culqiReady}
              className={styles.primaryButton}
            >
              {loading ? (
                <>
                  <span className={styles.buttonSpinner} />
                  Procesando...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect
                      x="2"
                      y="5"
                      width="16"
                      height="10"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path d="M2 9h16" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  Pagar S/ {inspection.inspectionPlan.price.toFixed(2)}
                </>
              )}
            </button>
          </div>

          {/* Security Note */}
          <p className={styles.securityNote}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect
                x="3"
                y="7"
                width="10"
                height="7"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M5 7V5a3 3 0 016 0v2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Pago seguro procesado por Culqi
          </p>
        </div>
      </div>
    </>
  );
}

// ============================================
// Payment Success View
// ============================================
function PaymentSuccessView({ inspection }: { inspection: InspectionData }) {
  const statusLabels: Record<string, string> = {
    PAID: "Pago confirmado",
    CONFIRMED: "Inspector asignado",
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
        {inspection.inspector && (
          <div className={styles.inspectorCard}>
            <div className={styles.inspectorAvatar}>
              {inspection.inspector.name?.charAt(0) || "I"}
            </div>
            <div className={styles.inspectorInfo}>
              <p className={styles.inspectorLabel}>Inspector asignado</p>
              <p className={styles.inspectorName}>
                {inspection.inspector.name || "Por asignar"}
              </p>
            </div>
          </div>
        )}

        {/* Booking Summary */}
        <BookingSummary inspection={inspection} showPrice={false} />

        {/* Actions */}
        <div className={styles.actions}>
          <Link href="/mis-inspecciones" className={styles.secondaryButton}>
            Volver
          </Link>
        </div>
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

          {/* Overall Score */}
          {inspection.report?.overallScore && (
            <div className={styles.overallScore}>
              <span className={styles.overallScoreLabel}>Puntaje General</span>
              <span className={styles.overallScoreValue}>
                {inspection.report.overallScore}/100
              </span>
            </div>
          )}

          {/* Executive Summary */}
          {inspection.report?.executiveSummary && (
            <div className={styles.summarySection}>
              <h4 className={styles.summaryTitle}>Resumen</h4>
              <p className={styles.summaryText}>
                {inspection.report.executiveSummary}
              </p>
            </div>
          )}

          {/* Recommendations */}
          {inspection.report?.recommendations && (
            <div className={styles.recommendationsSection}>
              <h4 className={styles.recommendationsTitle}>Recomendaciones</h4>
              <p className={styles.recommendationsText}>
                {inspection.report.recommendations}
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

          {/* Download Button */}
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
                Descargar informe PDF
              </>
            )}
          </button>
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
          {inspection.inspector && (
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
