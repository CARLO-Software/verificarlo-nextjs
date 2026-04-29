// =============================================================================
// COMPONENTE: CulqiYapePayment
// Pago con Yape usando número de celular + código de aprobación (OTP)
// Flujo: Usuario ingresa número → obtiene código en app Yape → ingresa código
// =============================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./PaymentMethods.module.css";

interface CulqiYapePaymentProps {
  bookingId: number;
  amount: number; // En soles
  onBack: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

type PaymentState = "input" | "processing" | "success" | "error";

export default function CulqiYapePayment({
  bookingId,
  amount,
  onBack,
  onSuccess,
}: CulqiYapePaymentProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [state, setState] = useState<PaymentState>("input");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validaciones
  const isPhoneValid = /^9\d{8}$/.test(phoneNumber); // 9 dígitos, empieza con 9
  const isOtpValid = /^\d{6}$/.test(otpCode); // 6 dígitos
  const canSubmit = isPhoneValid && isOtpValid && state === "input";

  // Formatear número de teléfono mientras escribe
  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    setPhoneNumber(digits);
    setErrorMessage(null);
  };

  // Formatear OTP mientras escribe
  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setOtpCode(digits);
    setErrorMessage(null);
  };

  // Procesar pago
  const handleSubmit = async () => {
    if (!canSubmit) return;

    setState("processing");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/culqi/yape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          phoneNumber: phoneNumber,
          otpCode: otpCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error procesando el pago");
      }

      if (data.success) {
        setState("success");
        setTimeout(() => {
          onSuccess();
          // Redirigir según el rol del usuario
          const userRole = session?.user?.role;
          if (userRole === 'ADMIN') {
            router.push('/admin/inspecciones');
          } else {
            router.push(`/mis-inspecciones/${bookingId}`);
          }
        }, 1500);
      } else {
        throw new Error(data.error || "Pago no completado");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error desconocido");
      setState("error");
    }
  };

  // Reintentar después de error
  const handleRetry = () => {
    setOtpCode("");
    setErrorMessage(null);
    setState("input");
  };

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
          <p className={styles.modalSubtitle}>Redirigiendo a tu inspección...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div className={styles.modalIcon} style={{ background: "#f3e8ff", color: "#6B21A8" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <path d="M12 18h.01" />
          </svg>
        </div>
        <h3 className={styles.modalTitle}>Paga con Yape</h3>
        <p className={styles.modalSubtitle}>
          Ingresa tu número de Yape y el código de aprobación
        </p>
      </div>

      {/* Monto */}
      <div className={styles.infoCard} style={{ marginBottom: "1.5rem" }}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Total a pagar:</span>
          <span className={styles.infoValueLarge}>S/ {amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className={styles.errorMessage} style={{ marginBottom: "1rem" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          {errorMessage}
        </div>
      )}

      {/* Formulario */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* Número de celular */}
        <div>
          <label style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "#374151",
            marginBottom: "0.5rem"
          }}>
            Número de celular Yape
          </label>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6b7280",
              fontSize: "0.95rem",
            }}>
              +51
            </span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="987 654 321"
              disabled={state === "processing"}
              style={{
                width: "100%",
                padding: "0.75rem 0.75rem 0.75rem 3rem",
                border: `2px solid ${phoneNumber && !isPhoneValid ? "#ef4444" : "#e5e7eb"}`,
                borderRadius: "8px",
                fontSize: "1rem",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#6B21A8"}
              onBlur={(e) => e.target.style.borderColor = phoneNumber && !isPhoneValid ? "#ef4444" : "#e5e7eb"}
            />
          </div>
          {phoneNumber && !isPhoneValid && (
            <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>
              Ingresa un número válido de 9 dígitos
            </p>
          )}
        </div>

        {/* Código de aprobación */}
        <div>
          <label style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "#374151",
            marginBottom: "0.5rem"
          }}>
            Código de aprobación
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={otpCode}
            onChange={(e) => handleOtpChange(e.target.value)}
            placeholder="123456"
            disabled={state === "processing"}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: `2px solid ${otpCode && !isOtpValid ? "#ef4444" : "#e5e7eb"}`,
              borderRadius: "8px",
              fontSize: "1.25rem",
              fontFamily: "monospace",
              letterSpacing: "0.5em",
              textAlign: "center",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => e.target.style.borderColor = "#6B21A8"}
            onBlur={(e) => e.target.style.borderColor = otpCode && !isOtpValid ? "#ef4444" : "#e5e7eb"}
          />
          {otpCode && !isOtpValid && (
            <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>
              El código debe tener 6 dígitos
            </p>
          )}
        </div>
      </div>

      {/* Instrucciones */}
      <div style={{
        background: "#faf5ff",
        borderRadius: "8px",
        padding: "1rem",
        marginBottom: "1.5rem"
      }}>
        <p style={{ fontSize: "0.8rem", color: "#6B21A8", marginBottom: "0.5rem", fontWeight: 600 }}>
          ¿Dónde encuentro el código?
        </p>
        <ol style={{
          fontSize: "0.8rem",
          color: "#7c3aed",
          paddingLeft: "1.25rem",
          margin: 0,
          lineHeight: 1.6
        }}>
          <li>Abre tu app de <strong>Yape</strong></li>
          <li>Ve a <strong>&quot;Aprobar compras&quot;</strong> en la pantalla principal</li>
          <li>Copia el código de 6 dígitos</li>
        </ol>
      </div>

      {/* Botones */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {state === "error" ? (
          <>
            <button
              onClick={handleRetry}
              className={styles.continueButton}
              style={{ background: "#6B21A8" }}
            >
              Reintentar
            </button>
            <button onClick={onBack} className={styles.modalButtonSecondary}>
              Elegir otro método de pago
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || state === "processing"}
              className={styles.continueButton}
              style={{
                background: canSubmit ? "#6B21A8" : "#d1d5db",
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}
            >
              {state === "processing" ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <span className={styles.spinner} style={{ width: "18px", height: "18px" }} />
                  Procesando pago...
                </span>
              ) : (
                `Pagar S/ ${amount.toFixed(2)}`
              )}
            </button>
            <button
              onClick={onBack}
              className={styles.modalButtonSecondary}
              disabled={state === "processing"}
            >
              Elegir otro método de pago
            </button>
          </>
        )}
      </div>

      {/* Nota de seguridad */}
      <p style={{
        marginTop: "1rem",
        fontSize: "0.75rem",
        color: "#9ca3af",
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Pago seguro procesado por Culqi
      </p>
    </div>
  );
}
