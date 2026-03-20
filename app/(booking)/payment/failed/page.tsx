"use client";

// ============================================================================
// /payment/failed
// El pago fue rechazado, la reserva expiró, o algo falló.
// Permite al usuario reintentar o agendar de nuevo.
// ============================================================================

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePaymentStatus } from "@/app/hooks/usePaymentStatus";
import styles from "../payment.module.css";

const REASON_LABELS: Record<string, { title: string; subtitle: string }> = {
  declined: {
    title: "Pago rechazado",
    subtitle:
      "Tu pago fue rechazado por el banco o el medio de pago. Puedes intentarlo de nuevo con otro método.",
  },
  expired: {
    title: "Tiempo agotado",
    subtitle:
      "El tiempo para completar el pago ha expirado. Por favor, crea una nueva reserva.",
  },
  cancelled: {
    title: "Reserva cancelada",
    subtitle: "Tu reserva fue cancelada. Puedes agendar una nueva cuando quieras.",
  },
  default: {
    title: "Pago no completado",
    subtitle:
      "No pudimos procesar tu pago. Por favor, intenta de nuevo o elige otro método.",
  },
};

function FailedContent() {
  const params = useSearchParams();
  const router = useRouter();

  const bookingId = params.get("bookingId")
    ? parseInt(params.get("bookingId")!, 10)
    : null;
  const reason = params.get("reason") ?? "default";

  const { data } = usePaymentStatus(bookingId, { intervalMs: 0 });

  if (!bookingId) {
    router.replace("/agendar");
    return null;
  }

  const { title, subtitle } =
    REASON_LABELS[reason] ?? REASON_LABELS.default;

  const canRetry =
    data?.bookingStatus === "PENDING_PAYMENT" && reason !== "expired";

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Icon */}
        <div
          className={styles.iconWrapper}
          data-type="failed"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6M9 9l6 6" />
          </svg>
        </div>

        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>

        {/* Error detail from backend */}
        {data?.errorMessage && (
          <div className={styles.errorBox} role="alert">
            <strong>Motivo:</strong> {data.errorMessage}
          </div>
        )}

        {/* Booking reference */}
        {data && (
          <div className={styles.statusChip} data-status="failed">
            Reserva #{data.bookingId}
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          {canRetry && (
            <Link
              href={`/agendar?retry=${bookingId}`}
              className={styles.primaryButton}
            >
              Reintentar pago
            </Link>
          )}
          <Link href="/agendar" className={styles.primaryButton} data-variant={canRetry ? "secondary" : "primary"}>
            Nueva reserva
          </Link>
          <Link href="/" className={styles.secondaryButton}>
            Volver al inicio
          </Link>
        </div>

        <p className={styles.legal}>
          Si el monto fue descontado, contáctanos a{" "}
          <a href="mailto:verificarlo@carlo.pe">verificarlo@carlo.pe</a>
        </p>
      </div>
    </div>
  );
}

export default function FailedPage() {
  return (
    <Suspense fallback={null}>
      <FailedContent />
    </Suspense>
  );
}
