// =============================================================================
// COMPONENTE: PaymentMethods (Métodos de Pago - Paso 4)
// =============================================================================
// Opciones de pago:
// 1. Culqi (tarjeta) - Pago completo del plan
// 2. Yape - Pago completo con QR
// 3. Transferencia Bancaria - Pago completo (verificación manual)
// 4. WhatsApp - Coordinar pago (verificación manual)
// =============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./PaymentMethods.module.css";
import TransferModal from "./TransferModal";
import WhatsAppModal from "./WhatsAppModal";
import CulqiYapePayment from "./CulqiYapePayment";

// Declaración global de Culqi
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Culqi: any;
    culqi: () => void;
  }
}

// Tipos de métodos de pago disponibles
type PaymentMethod = "culqi" | "transfer" | "yape" | "whatsapp" | null;

interface BookingDetails {
  bookingCode: string;
  userName: string;
  planTitle: string;
  planType: string;
  totalAmount: number;
}

interface PaymentMethodsProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
  bookingDetails: BookingDetails;
  bookingId: number;
  expiresAt: Date;
  onPaymentSuccess: () => void;
  onPaymentExpired: () => void;
  onAlternativePaymentSuccess: () => void;
}

// Cuentas bancarias disponibles
const BANK_ACCOUNTS = [
  {
    id: "bcp-soles",
    bank: "BCP",
    currency: "Soles",
    accountNumber: "193-8758156-0-20",
    cci: "00219300875815602015",
    holder: "MOVE TECHNOLOGIES S.A.C.",
    logo: "/assets/icons/bcp.svg",
  },
  {
    id: "bcp-dolares",
    bank: "BCP",
    currency: "Dólares",
    accountNumber: "193-8748718-1-96",
    cci: "00219300874871819615",
    holder: "MOVE TECHNOLOGIES S.A.C.",
    logo: "/assets/icons/bcp.svg",
  },
  {
    id: "bbva-soles",
    bank: "BBVA",
    currency: "Soles",
    accountNumber: "0011-0157-0200610827",
    cci: "011-157-000200610827-54",
    holder: "MOVE TECHNOLOGIES S.A.C.",
    logo: "/assets/icons/bbva.svg",
  },
  {
    id: "bbva-dolares",
    bank: "BBVA",
    currency: "Dólares",
    accountNumber: "0011-0157-0200610843",
    cci: "011-157-000200610843-51",
    holder: "MOVE TECHNOLOGIES S.A.C.",
    logo: "/assets/icons/bbva.svg",
  },
  {
    id: "interbank-soles",
    bank: "Interbank",
    currency: "Soles",
    accountNumber: "200-3004204040",
    cci: "003-200-003004204040-39",
    holder: "MOVE TECHNOLOGIES S.A.C.",
    logo: "/assets/icons/interbank.svg",
  },
  {
    id: "interbank-dolares",
    bank: "Interbank",
    currency: "Dólares",
    accountNumber: "200-3004204058",
    cci: "003-200-003004204058-31",
    holder: "MOVE TECHNOLOGIES S.A.C.",
    logo: "/assets/icons/interbank.svg",
  },
];

export default function PaymentMethods({
  selectedMethod,
  onSelectMethod,
  bookingDetails,
  bookingId,
  expiresAt,
  onPaymentSuccess,
  onPaymentExpired,
  onAlternativePaymentSuccess,
}: PaymentMethodsProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Estados
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showYapePayment, setShowYapePayment] = useState(false);

  // Estados para pago con tarjeta (Culqi)
  const [culqiReady, setCulqiReady] = useState(false);
  const [culqiLoading, setCulqiLoading] = useState(false);
  const [culqiError, setCulqiError] = useState<string | null>(null);

  // Card form fields
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);

  // Calcular tiempo restante
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      return Math.max(0, Math.floor((expiry - now) / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        onPaymentExpired();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onPaymentExpired]);

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Configurar Culqi cuando el script carga
  const configureCulqi = useCallback(() => {
    if (typeof window !== "undefined" && window.Culqi && !culqiReady) {
      try {
        window.Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY!;

        window.Culqi.settings({
          title: "VerifiCARLO",
          currency: "PEN",
          description: bookingDetails.planTitle,
          amount: Math.round(bookingDetails.totalAmount * 100),
        });

        window.Culqi.options({
          lang: "es",
          style: {
            logo: "/logo.png",
            bannerColor: "#FDBF12",
            buttonBackground: "#FDBF12",
            menuColor: "#1A1A1A",
            linksColor: "#1A1A1A",
            priceColor: "#1A1A1A",
          },
        });

        setCulqiReady(true);
      } catch (err) {
        console.error("Error configurando Culqi:", err);
      }
    }
  }, [bookingDetails, culqiReady]);

  const handleCulqiLoad = useCallback(() => {
    configureCulqi();
  }, [configureCulqi]);

  // Reintento de configuración de Culqi si no se cargó
  useEffect(() => {
    if (culqiReady) return;

    const interval = setInterval(() => {
      if (window.Culqi) {
        configureCulqi();
      }
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [culqiReady, configureCulqi]);

  // Handler global de Culqi
  useEffect(() => {
    window.culqi = async () => {
      if (window.Culqi.token) {
        setCulqiLoading(true);
        setCulqiError(null);

        try {
          const res = await fetch("/api/payments/culqi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingId,
              token: window.Culqi.token.id,
            }),
          });

          const data = await res.json();

          if (data.success) {
            if (window.Culqi?.close) {
              window.Culqi.close();
            }
            onPaymentSuccess();
            const userRole = session?.user?.role;
            if (userRole === 'ADMIN') {
              router.push('/admin/inspecciones');
            } else {
              router.push(`/mis-inspecciones/${bookingId}`);
            }
          } else {
            if (window.Culqi?.close) {
              window.Culqi.close();
            }
            setCulqiError(data.error || "Error procesando el pago");
          }
        } catch {
          router.push(`/payment/pending?bookingId=${bookingId}`);
          return;
        } finally {
          setCulqiLoading(false);
        }
      } else if (window.Culqi.error) {
        setCulqiError(window.Culqi.error.user_message || "Error en el pago");
      }
    };
  }, [bookingId, onPaymentSuccess, router, session?.user?.role]);

  // Abrir checkout de Culqi
  const handleOpenCulqi = () => {
    if (window.Culqi && culqiReady) {
      window.Culqi.settings({
        title: "VerifiCARLO",
        currency: "PEN",
        description: bookingDetails.planTitle,
        amount: Math.round(bookingDetails.totalAmount * 100),
      });

      window.Culqi.open();
    }
  };

  // Pago con tarjeta via API directa (sin modal Culqi)
  const handleCardPayment = async () => {
    const raw = cardNumber.replace(/\s/g, "");
    if (raw.length < 13 || !expiryMonth || !expiryYear || cvv.length < 3) {
      setCulqiError("Completa todos los campos de la tarjeta");
      return;
    }

    const email = session?.user?.email;
    if (!email) {
      setCulqiError("Debe iniciar sesión para pagar");
      return;
    }

    setCulqiLoading(true);
    setCulqiError(null);

    try {
      // ponytail: token via REST API, bypasses Culqi modal bug with expiry dates
      const tokenRes = await fetch("https://secure.culqi.com/v2/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY}`,
        },
        body: JSON.stringify({
          card_number: raw,
          cvv,
          expiration_month: expiryMonth,
          expiration_year: expiryYear,
          email,
        }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        setCulqiError(tokenData.user_message || tokenData.merchant_message || "Error al procesar la tarjeta");
        return;
      }

      const res = await fetch("/api/payments/culqi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          token: tokenData.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onPaymentSuccess();
        const userRole = session?.user?.role;
        if (userRole === "ADMIN") {
          router.push("/admin/inspecciones");
        } else {
          router.push(`/mis-inspecciones/${bookingId}`);
        }
      } else {
        setCulqiError(data.error || "Error procesando el pago");
      }
    } catch {
      router.push(`/payment/pending?bookingId=${bookingId}`);
      return;
    } finally {
      setCulqiLoading(false);
    }
  };

  // Handler para confirmar pago con Transferencia
  const handleTransferComplete = async () => {
    const res = await fetch("/api/payments/alternative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        paymentMethod: "TRANSFER",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error al registrar el pago");
    }

    setShowTransferModal(false);
    onAlternativePaymentSuccess();
  };

  // Generar mensaje de WhatsApp
  const getWhatsAppUrl = () => {
    const message = encodeURIComponent(
      `¡Hola! Soy ${bookingDetails.userName}. Quiero confirmar mi reserva ${bookingDetails.bookingCode} ` +
        `para el plan ${bookingDetails.planTitle} (S/${bookingDetails.totalAmount}) y coordinar el pago.`
    );
    return `https://api.whatsapp.com/send?phone=51934140010&text=${message}`;
  };

  // Si está mostrando Yape con Culqi
  if (showYapePayment) {
    return (
      <CulqiYapePayment
        bookingId={bookingId}
        amount={bookingDetails.totalAmount}
        onBack={() => {
          setShowYapePayment(false);
          onSelectMethod(null);
        }}
        onSuccess={onPaymentSuccess}
        onError={(msg) => setCulqiError(msg)}
      />
    );
  }

  // Configuración de cada método de pago
  const paymentOptions = [
    {
      id: "culqi" as const,
      label: "Tarjeta de crédito/débito",
      description: "Paga de forma segura con tu tarjeta. Procesado por Culqi.",
      icons: [
        { src: "/assets/icons/visa.svg", alt: "Visa" },
        { src: "/assets/icons/mastercard.svg", alt: "MasterCard" },
        { src: "/assets/icons/amex.svg", alt: "American Express" },
      ],
    },
    {
      id: "yape" as const,
      label: "Yape",
      description: "Escanea el código QR con tu app de Yape. Confirmación automática.",
      icons: [{ src: "/assets/icons/yape.svg", alt: "Yape" }],
    },
    {
      id: "transfer" as const,
      label: "Transferencia Bancaria",
      description: `Realiza una transferencia de S/${bookingDetails.totalAmount.toFixed(2)}. Verificación en 4 horas máximo.`,
      icons: [{ src: "/assets/icons/bank.svg", alt: "Banco" }],
    },
    {
      id: "whatsapp" as const,
      label: "Coordinar por WhatsApp",
      description: "Contacta a un asesor para coordinar el pago y la cita.",
      icons: [{ src: "/assets/icons/whatsapp.svg", alt: "WhatsApp" }],
    },
  ];

  const isExpired = timeLeft <= 0;
  const isUrgent = timeLeft > 0 && timeLeft < 300;

  return (
    <>
      <Script src="https://checkout.culqi.com/js/v4" onLoad={handleCulqiLoad} />

      {/* Overlay de pago en curso */}
      {culqiLoading && (
        <div className={styles.paymentOverlay}>
          <div className={styles.paymentOverlayContent}>
            <div className={styles.paymentOverlaySpinner} />
            <p className={styles.paymentOverlayText}>Espere por favor</p>
            <p className={styles.paymentOverlaySubtext}>El pago está en curso...</p>
          </div>
        </div>
      )}

      <div className={styles.container}>
        <h2 className={styles.title}>Elige tu método de pago</h2>
        <p className={styles.subtitle}>
          Selecciona cómo deseas pagar tu inspección
        </p>

        {/* Timer */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1rem",
          background: isUrgent ? "#fef2f2" : "#f3f4f6",
          borderRadius: "8px",
          marginBottom: "1rem",
          color: isUrgent ? "#dc2626" : "#4b5563",
          fontWeight: 500,
          fontSize: "0.9rem",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>
            {isExpired
              ? "Tiempo expirado"
              : `Tiempo para pagar: ${formatTime(timeLeft)}`}
          </span>
        </div>

        {/* Error de Culqi */}
        {culqiError && (
          <div className={styles.errorMessage}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            {culqiError}
            <button
              onClick={() => setCulqiError(null)}
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}
            >
              ×
            </button>
          </div>
        )}

        {/* Resumen del pedido */}
        <div className={styles.infoCard} style={{ marginBottom: "1.5rem" }}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Plan</span>
            <span className={styles.infoValue}>{bookingDetails.planTitle}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Código</span>
            <span className={styles.infoValue}>{bookingDetails.bookingCode}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Total a pagar</span>
            <span className={styles.infoValueLarge}>S/ {bookingDetails.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Lista de métodos de pago */}
        <div className={styles.methodsList}>
          {paymentOptions.map((option) => {
            const isSelected = selectedMethod === option.id;

            return (
              <div
                key={option.id}
                className={`${styles.methodCard} ${isSelected ? styles.methodCardSelected : ""}`}
                onClick={() => onSelectMethod(option.id)}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectMethod(option.id);
                  }
                }}
              >
                {/* Radio button */}
                <div className={styles.radioWrapper}>
                  <div
                    className={`${styles.radioCircle} ${isSelected ? styles.radioCircleSelected : ""}`}
                  >
                    {isSelected && <div className={styles.radioDot} />}
                  </div>
                </div>

                {/* Contenido */}
                <div className={styles.methodContent}>
                  <div className={styles.methodHeader}>
                    <span className={styles.methodLabel}>{option.label}</span>
                    <div className={styles.methodIcons}>
                      {option.icons.map((icon, idx) => (
                        <img
                          key={idx}
                          src={icon.src}
                          alt={icon.alt}
                          className={styles.paymentIcon}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='20' viewBox='0 0 32 20'%3E%3Crect fill='%23e5e7eb' width='32' height='20' rx='4'/%3E%3C/svg%3E";
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Descripción - solo visible cuando está seleccionado */}
                  {isSelected && (
                    <p className={styles.methodDescription}>{option.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón de acción según método seleccionado */}
        {selectedMethod === "culqi" && (
          <div className={styles.cardForm}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Número de tarjeta</label>
              <input
                className={styles.input}
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                maxLength={19}
                placeholder="4111 1111 1111 1111"
                value={cardNumber}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                  setCardNumber(v.replace(/(.{4})/g, "$1 ").trim());
                }}
              />
            </div>
            <div className={styles.cardRow}>
              <div className={styles.inputGroup} style={{ flex: 1 }}>
                <label className={styles.inputLabel}>Mes</label>
                <select
                  className={styles.input}
                  value={expiryMonth}
                  onChange={(e) => setExpiryMonth(e.target.value)}
                  autoComplete="cc-exp-month"
                >
                  <option value="">MM</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = String(i + 1).padStart(2, "0");
                    return <option key={m} value={m}>{m}</option>;
                  })}
                </select>
              </div>
              <div className={styles.inputGroup} style={{ flex: 1 }}>
                <label className={styles.inputLabel}>Año</label>
                <select
                  className={styles.input}
                  value={expiryYear}
                  onChange={(e) => setExpiryYear(e.target.value)}
                  autoComplete="cc-exp-year"
                >
                  <option value="">AAAA</option>
                  {Array.from({ length: 11 }, (_, i) => {
                    const y = new Date().getFullYear() + i;
                    return <option key={y} value={String(y)}>{y}</option>;
                  })}
                </select>
              </div>
              <div className={styles.inputGroup} style={{ flex: 0.7 }}>
                <label className={styles.inputLabel}>CVV</label>
                <input
                  className={styles.input}
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  maxLength={4}
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </div>
            </div>
            <button
              onClick={handleCardPayment}
              disabled={!cardNumber || !expiryMonth || !expiryYear || !cvv || culqiLoading || isExpired}
              className={styles.continueButton}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            >
              {culqiLoading ? (
                <>
                  <span className={styles.spinner} />
                  Procesando...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" />
                    <path d="M1 10h22" />
                  </svg>
                  Pagar S/ {bookingDetails.totalAmount.toFixed(2)}
                </>
              )}
            </button>
          </div>
        )}

        {selectedMethod === "yape" && (
          <button
            onClick={() => setShowYapePayment(true)}
            disabled={isExpired}
            className={styles.continueButton}
            style={{ background: "#6B21A8" }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <rect x="7" y="7" width="3" height="3" />
                <rect x="14" y="7" width="3" height="3" />
                <rect x="7" y="14" width="3" height="3" />
              </svg>
              Pagar con Yape - S/ {bookingDetails.totalAmount.toFixed(2)}
            </span>
          </button>
        )}

        {selectedMethod === "transfer" && (
          <button
            onClick={() => setShowTransferModal(true)}
            disabled={isExpired}
            className={styles.continueButton}
            style={{ background: "#2563eb" }}
          >
            Ver datos para transferencia
          </button>
        )}

        {selectedMethod === "whatsapp" && (
          <button
            onClick={() => setShowWhatsAppModal(true)}
            disabled={isExpired}
            className={styles.continueButton}
            style={{ background: "#25d366" }}
          >
            Coordinar por WhatsApp
          </button>
        )}

        {!selectedMethod && (
          <button disabled className={styles.continueButton}>
            Selecciona un método de pago
          </button>
        )}

        {/* Nota de seguridad */}
        <p style={{
          marginTop: "1rem",
          fontSize: "0.8rem",
          color: "#9ca3af",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Pago seguro procesado por Culqi
        </p>

        {/* =================================================================
            MODALES
            ================================================================= */}

        {/* Modal de Transferencia Bancaria */}
        <TransferModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          bankAccounts={BANK_ACCOUNTS}
          amount={bookingDetails.totalAmount}
          onSendVoucher={handleTransferComplete}
        />

        {/* Modal de WhatsApp */}
        <WhatsAppModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          bookingCode={bookingDetails.bookingCode}
          whatsappUrl={getWhatsAppUrl()}
        />
      </div>
    </>
  );
}
