"use client";

// ============================================================================
// /payment/success
// Llegamos aquí después de confirmar que el webhook de Culqi
// actualizó el estado a COMPLETED/PAID.
// ============================================================================

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePaymentStatus } from "@/app/hooks/usePaymentStatus";
import styles from "../payment.module.css";
import { formatDate } from "@/lib/utils/formatDate";

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const bookingId = params.get("bookingId")
    ? parseInt(params.get("bookingId")!, 10)
    : null;

  // Single fetch — no polling needed on success page
  const { data, isLoading } = usePaymentStatus(bookingId, { intervalMs: 0 });

  if (!bookingId) {
    router.replace("/agendar");
    return null;
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.subtitle}>Cargando detalles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Icon */}
        <div className={styles.iconWrapper} data-type="success" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 12.5l3.5 3.5 6-7" />
          </svg>
        </div>

        <h1 className={styles.title}>¡Pago exitoso!</h1>
        <p className={styles.subtitle}>
          Tu reserva ha sido confirmada. Nos pondremos en contacto contigo pronto.
        </p>

        {/* Booking details card */}
        {data && (
          <dl className={styles.detailsGrid}>
            <div className={styles.detailRow}>
              <dt>Reserva</dt>
              <dd>#{data.bookingId}</dd>
            </div>
            {data.plan && (
              <div className={styles.detailRow}>
                <dt>Plan</dt>
                <dd>{data.plan.title}</dd>
              </div>
            )}
            {data.date && (
              <div className={styles.detailRow}>
                <dt>Fecha</dt>
                <dd>
                  {formatDate(data.date)} — {data.timeSlot}
                </dd>
              </div>
            )}
            {data.amount !== null && (
              <div className={styles.detailRow}>
                <dt>Monto</dt>
                <dd className={styles.amount}>S/ {data.amount?.toFixed(2)}</dd>
              </div>
            )}
            {data.paymentMethod && (
              <div className={styles.detailRow}>
                <dt>Método</dt>
                <dd>{data.paymentMethod}</dd>
              </div>
            )}
            <div className={styles.detailRow}>
              <dt>Inspector</dt>
              <dd>{data.inspector?.name ?? "Todavía no asignado"}</dd>
            </div>
          </dl>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <Link href="/mis-inspecciones" className={styles.primaryButton}>
            Ver mis inspecciones
          </Link>
          <Link href="/" className={styles.secondaryButton}>
            Volver al inicio
          </Link>
        </div>

        {data?.chargeId && (
          <p className={styles.legal}>ID de transacción: {data.chargeId}</p>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
