"use client";

// ============================================================================
// /payment/pending
// El usuario llega aquí cuando hubo un error de red al procesar el pago.
// Hace polling al backend hasta confirmar el resultado.
// Si el estado no cambia de PENDING_PAYMENT, muestra opciones para reintentar.
// ============================================================================

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePaymentStatus } from "@/app/hooks/usePaymentStatus";
import type { PaymentStatusData } from "@/app/hooks/usePaymentStatus";
import styles from "../payment.module.css";

function PendingContent() {
  const params = useSearchParams();
  const router = useRouter();
  const bookingId = params.get("bookingId")
    ? parseInt(params.get("bookingId")!, 10)
    : null;

  const [stuckOnPending, setStuckOnPending] = useState(false);

  const { data, isPolling, error } = usePaymentStatus(bookingId, {
    intervalMs: 3000,
    maxAttempts: 20,
    onTerminal: (statusData: PaymentStatusData) => {
      const { paymentStatus, bookingStatus } = statusData;

      if (paymentStatus === "COMPLETED" || bookingStatus === "PAID") {
        router.replace(`/payment/success?bookingId=${bookingId}`);
      } else if (paymentStatus === "FAILED" || bookingStatus === "EXPIRED") {
        const reason = bookingStatus === "EXPIRED" ? "expired" : "declined";
        router.replace(`/payment/failed?bookingId=${bookingId}&reason=${reason}`);
      } else if (bookingStatus === "CANCELLED") {
        router.replace(`/payment/failed?bookingId=${bookingId}&reason=cancelled`);
      }
    },
  });

  useEffect(() => {
    if (!bookingId || isNaN(bookingId)) {
      router.replace("/agendar");
    }
  }, [bookingId, router]);

  useEffect(() => {
    if (!isPolling && data && !data.isTerminal && data.bookingStatus === "PENDING_PAYMENT") {
      setStuckOnPending(true);
    }
  }, [isPolling, data]);

  if (stuckOnPending) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.iconWrapper} data-type="failed" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1 className={styles.title}>El pago no pudo ser confirmado</h1>
          <p className={styles.subtitle}>
            No se detectó ningún cargo procesado para esta reserva.
            Es posible que el pago no se haya completado.
          </p>

          <div className={styles.actions}>
            <a href="/agendar" className={styles.primaryButton}>
              Volver a intentar el pago
            </a>
            <a href="/mis-inspecciones" className={styles.secondaryButton}>
              Ver mis inspecciones
            </a>
          </div>

          <p className={styles.legal} style={{ marginTop: "20px" }}>
            Si realizaste el pago y no se refleja, contáctanos por WhatsApp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
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

        {data && (
          <div className={styles.statusChip} data-status="pending">
            <span className={styles.dot} />
            Estado: {data.bookingStatus === "PENDING_PAYMENT" ? "PENDIENTE DE PAGO" : data.bookingStatus === "PENDING_VERIFICATION" ? "PENDIENTE DE VERIFICACIÓN" : data.bookingStatus === "PAID" ? "PAGADO" : data.bookingStatus === "COMPLETED" ? "COMPLETADO" : data.bookingStatus}
          </div>
        )}

        {error && (
          <p className={styles.errorHint} role="alert">
            Error de conexión — reintentando...
          </p>
        )}

        {!isPolling && !data?.isTerminal && !stuckOnPending && (
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
