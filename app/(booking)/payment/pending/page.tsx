"use client";

// ============================================================================
// /payment/pending
// El usuario llega aquí justo después de enviar su pago.
// Esta página hace polling al backend hasta confirmar el resultado,
// luego redirige a /payment/success o /payment/failed.
//
// IMPORTANTE: El estado final SIEMPRE viene del webhook de Culqi,
// nunca del frontend.
// ============================================================================

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePaymentStatus } from "@/app/hooks/usePaymentStatus";
import type { PaymentStatusData } from "@/app/hooks/usePaymentStatus";
import styles from "../payment.module.css";

// ── Inner component (needs Suspense for useSearchParams) ──────────────────────

function PendingContent() {
  const params = useSearchParams();
  const router = useRouter();
  const bookingId = params.get("bookingId")
    ? parseInt(params.get("bookingId")!, 10)
    : null;

  const { data, isPolling, error } = usePaymentStatus(bookingId, {
    intervalMs: 3000,
    onTerminal: (statusData: PaymentStatusData) => {
      const { paymentStatus, bookingStatus } = statusData;

      if (paymentStatus === "COMPLETED" || bookingStatus === "CONFIRMED" || bookingStatus === "PAID") {
        router.replace(`/payment/success?bookingId=${bookingId}`);
      } else if (paymentStatus === "FAILED" || bookingStatus === "EXPIRED") {
        const reason = bookingStatus === "EXPIRED" ? "expired" : "declined";
        router.replace(`/payment/failed?bookingId=${bookingId}&reason=${reason}`);
      } else if (bookingStatus === "CANCELLED") {
        router.replace(`/payment/failed?bookingId=${bookingId}&reason=cancelled`);
      }
    },
  });

  // Edge case: no bookingId in URL
  useEffect(() => {
    if (!bookingId || isNaN(bookingId)) {
      router.replace("/agendar");
    }
  }, [bookingId, router]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Spinner */}
        <div className={styles.iconWrapper} aria-hidden="true">
          <svg
            className={styles.spinner}
            viewBox="0 0 50 50"
            fill="none"
            aria-label="Cargando"
          >
            <circle
              cx="25" cy="25" r="20"
              stroke="currentColor" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="80 40"
            />
          </svg>
        </div>

        <h1 className={styles.title}>Confirmando tu pago...</h1>
        <p className={styles.subtitle}>
          Estamos verificando tu transacción con Culqi.
          <br />
          Esto tomará solo unos segundos.
        </p>

        {/* Live status indicator */}
        {data && (
          <div className={styles.statusChip} data-status="pending">
            <span className={styles.dot} />
            Estado: {data.bookingStatus}
          </div>
        )}

        {/* Error state (network) — keep polling */}
        {error && (
          <p className={styles.errorHint} role="alert">
            Error de conexión — reintentando...
          </p>
        )}

        {/* Stop polling indicator */}
        {!isPolling && !data?.isTerminal && (
          <p className={styles.errorHint}>
            No pudimos obtener el estado. Revisa tus{" "}
            <a href="/mis-inspecciones">inspecciones</a>.
          </p>
        )}

        <p className={styles.legal}>
          No cierres esta ventana. Tu pago ya fue procesado
          y el resultado se confirmará automáticamente.
        </p>
      </div>
    </div>
  );
}

export default function PendingPage() {
  return (
    <Suspense fallback={<PendingFallback />}>
      <PendingContent />
    </Suspense>
  );
}

function PendingFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <p style={{ color: "#6b7280" }}>Cargando...</p>
    </div>
  );
}
