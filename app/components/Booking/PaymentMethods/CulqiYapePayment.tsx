// =============================================================================
// COMPONENTE: CulqiYapePayment
// Pago con Yape a través de Culqi Orders API
// El QR se genera automáticamente y el pago se valida via webhook
// =============================================================================

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./PaymentMethods.module.css";

interface CulqiYapePaymentProps {
  bookingId: number;
  amount: number; // En soles
  onBack: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

type PaymentState = "loading" | "ready" | "polling" | "success" | "error";

interface OrderData {
  id: string;
  qr?: {
    image: string;
    url: string;
  };
  expirationDate: string;
}

export default function CulqiYapePayment({
  bookingId,
  amount,
  onBack,
  onSuccess,
  onError,
}: CulqiYapePaymentProps) {
  const router = useRouter();
  const [state, setState] = useState<PaymentState>("loading");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Crear orden de Culqi al montar
  useEffect(() => {
    createCulqiOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Crear orden en Culqi
  const createCulqiOrder = async () => {
    setState("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/culqi/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          expirationMinutes: 15, // 15 minutos para pagar con Yape
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error creando orden de pago");
      }

      setOrder({
        id: data.order.id,
        qr: data.order.qr,
        expirationDate: data.order.expirationDate,
      });

      // Calcular tiempo restante
      const expiration = new Date(data.order.expirationDate).getTime();
      const now = Date.now();
      setTimeLeft(Math.max(0, Math.floor((expiration - now) / 1000)));

      setState("ready");

      // Iniciar polling para verificar pago
      startPolling();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error desconocido");
      setState("error");
    }
  };

  // Polling para verificar estado del pago
  const checkPaymentStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/culqi/order?bookingId=${bookingId}`);
      const data = await res.json();

      if (data.order?.state === "paid" || data.payment?.status === "COMPLETED") {
        setState("success");
        setTimeout(() => {
          onSuccess();
          router.push(`/payment/success?bookingId=${bookingId}`);
        }, 1500);
        return true; // Pago confirmado
      }

      if (data.order?.state === "expired") {
        setErrorMessage("El tiempo para pagar ha expirado");
        setState("error");
        return true; // Dejar de hacer polling
      }

      return false; // Continuar polling
    } catch {
      return false; // Continuar polling en caso de error de red
    }
  }, [bookingId, onSuccess, router]);

  // Iniciar polling
  const startPolling = useCallback(() => {
    setState("polling");

    const pollInterval = setInterval(async () => {
      const shouldStop = await checkPaymentStatus();
      if (shouldStop) {
        clearInterval(pollInterval);
      }
    }, 3000); // Cada 3 segundos

    // Limpiar al desmontar
    return () => clearInterval(pollInterval);
  }, [checkPaymentStatus]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setErrorMessage("El tiempo para pagar ha expirado");
          setState("error");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Estado: Cargando
  if (state === "loading") {
    return (
      <div className={styles.container}>
        <div className={styles.loaderWrapper}>
          <div className={styles.loader} style={{ borderTopColor: "#6B21A8" }} />
          <p className={styles.loaderText}>Generando código QR de Yape...</p>
        </div>
      </div>
    );
  }

  // Estado: Error
  if (state === "error") {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          {errorMessage || "Error procesando el pago"}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <button onClick={onBack} className={styles.modalButtonSecondary}>
            Volver
          </button>
          <button onClick={createCulqiOrder} className={`${styles.modalButton} ${styles.modalButtonPrimary}`}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Estado: Exitoso
  if (state === "success") {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: "center", padding: "2rem 0" }}>
          <div className={styles.modalIcon} style={{ background: "#dcfce7", color: "#16a34a" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h3 className={styles.modalTitle}>Pago confirmado</h3>
          <p className={styles.modalSubtitle}>Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // Estado: Listo para pagar / Polling
  return (
    <div className={styles.container}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div className={styles.modalIcon} style={{ background: "#f3e8ff", color: "#6B21A8" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <rect x="7" y="7" width="3" height="3" />
            <rect x="14" y="7" width="3" height="3" />
            <rect x="7" y="14" width="3" height="3" />
            <rect x="14" y="14" width="3" height="3" />
          </svg>
        </div>
        <h3 className={styles.modalTitle}>Paga con Yape</h3>
        <p className={styles.modalSubtitle}>
          Escanea el código QR con tu app de Yape para completar el pago
        </p>
      </div>

      {/* Timer */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        padding: "0.75rem",
        background: timeLeft < 120 ? "#fef2f2" : "#f3f4f6",
        borderRadius: "8px",
        marginBottom: "1rem",
        color: timeLeft < 120 ? "#dc2626" : "#4b5563",
        fontWeight: 600,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span>Tiempo restante: {formatTime(timeLeft)}</span>
      </div>

      {/* QR Code */}
      {order?.qr ? (
        <div className={styles.qrWrapper}>
          <img
            src={`data:image/png;base64,${order.qr.image}`}
            alt="Código QR de Yape"
            className={styles.qrImage}
            style={{ width: "200px", height: "200px" }}
          />
        </div>
      ) : (
        <div className={styles.qrWrapper}>
          <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
            <p>QR no disponible</p>
            <a
              href={order?.qr?.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#6B21A8", textDecoration: "underline" }}
            >
              Pagar en página de Culqi
            </a>
          </div>
        </div>
      )}

      {/* Monto */}
      <div className={styles.infoCard}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Monto a pagar:</span>
          <span className={styles.infoValueLarge}>S/ {amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Estado de verificación */}
      {state === "polling" && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "0.75rem",
          background: "#eff6ff",
          borderRadius: "8px",
          marginBottom: "1rem",
          color: "#2563eb",
          fontSize: "0.9rem",
        }}>
          <div className={styles.spinner} style={{
            width: "16px",
            height: "16px",
            borderColor: "rgba(37, 99, 235, 0.2)",
            borderTopColor: "#2563eb",
          }} />
          <span>Esperando confirmación de pago...</span>
        </div>
      )}

      {/* Instrucciones */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "0.75rem", fontWeight: 600 }}>
          Pasos para pagar:
        </p>
        <div className={styles.stepsList}>
          <div className={styles.stepItem}>
            <span className={styles.stepNumber} style={{ background: "#6B21A8" }}>1</span>
            <span className={styles.stepText}>Abre tu app de Yape</span>
          </div>
          <div className={styles.stepItem}>
            <span className={styles.stepNumber} style={{ background: "#6B21A8" }}>2</span>
            <span className={styles.stepText}>Escanea el código QR</span>
          </div>
          <div className={styles.stepItem}>
            <span className={styles.stepNumber} style={{ background: "#6B21A8" }}>3</span>
            <span className={styles.stepText}>Confirma el pago en tu app</span>
          </div>
          <div className={styles.stepItem}>
            <span className={styles.stepNumber} style={{ background: "#6B21A8" }}>4</span>
            <span className={styles.stepText}>Espera la confirmación automática</span>
          </div>
        </div>
      </div>

      {/* Botón volver */}
      <button onClick={onBack} className={styles.modalButtonSecondary} style={{ width: "100%" }}>
        Elegir otro método de pago
      </button>
    </div>
  );
}
