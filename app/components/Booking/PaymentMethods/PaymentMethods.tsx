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

import { useState, useEffect, useCallback, useRef } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./PaymentMethods.module.css";
import TransferModal from "./TransferModal";
import WhatsAppModal from "./WhatsAppModal";

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
  const [showCardModal, setShowCardModal] = useState(false);

  // Estados para pago con tarjeta (Culqi)
  const [culqiReady, setCulqiReady] = useState(false);
  const [culqiLoading, setCulqiLoading] = useState(false);
  const [culqiError, setCulqiError] = useState<string | null>(null);

  // Card form fields
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardEmail, setCardEmail] = useState("");

  // Voucher para Yape inline
  const [yapeVoucherFile, setYapeVoucherFile] = useState<File | null>(null);
  const [yapeVoucherPreview, setYapeVoucherPreview] = useState<string | null>(null);
  const [yapeUploading, setYapeUploading] = useState(false);
  const yapeFileInputRef = useRef<HTMLInputElement>(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(false);

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

    const email = cardEmail || session?.user?.email;
    if (!email) {
      setCulqiError("Ingresa tu correo electrónico");
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

  // Si está mostrando Yape/Plin
  if (showYapePayment) {
    return (
      <div className={styles.yapeFullPage}>
        <button
          className={styles.yapeBackButton}
          onClick={() => {
            setShowYapePayment(false);
            onSelectMethod(null);
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <h2 className={styles.yapeTitle}>¡Casi listo! Escanea y paga tu reserva</h2>
        <p className={styles.yapeSubtitle}>
          Yapea o plinea S/ {bookingDetails.totalAmount.toFixed(2)} y envíanos el comprobante para confirmar tu inspección.
        </p>

        <div className={styles.yapeQrContainer}>
          <img src="/assets/images/yape-qr.png" alt="QR Yape / Plin" className={styles.yapeQrImage} />
        </div>

        <div className={styles.yapeDetails}>
          <div className={styles.yapeDetailRow}>
            <span className={styles.yapeDetailLabel}>Número:</span>
            <span className={styles.yapeDetailValue}>987 654 321</span>
          </div>
          <div className={styles.yapeDetailRow}>
            <span className={styles.yapeDetailLabel}>Monto a yapear/plinear:</span>
            <span className={styles.yapeDetailValue}>S/ {bookingDetails.totalAmount.toFixed(2)}</span>
          </div>
          <div className={styles.yapeDetailRow}>
            <span className={styles.yapeDetailLabel}>Titular:</span>
            <span className={styles.yapeDetailValue}>VERIFICARLO</span>
          </div>
        </div>

        {/* Upload comprobante */}
        <div className={styles.voucherUpload} style={{ margin: "0 auto", maxWidth: 340 }}>
          <label className={styles.voucherLabel}>
            Comprobante de pago <span style={{ color: "#e53e3e" }}>*</span>
          </label>
          <input
            ref={yapeFileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!file.type.startsWith("image/")) { setCulqiError("Solo se permiten imágenes"); return; }
              if (file.size > 5 * 1024 * 1024) { setCulqiError("La imagen no debe superar 5MB"); return; }
              setCulqiError(null);
              setYapeVoucherFile(file);
              setYapeVoucherPreview(URL.createObjectURL(file));
            }}
            style={{ display: "none" }}
          />
          {yapeVoucherPreview ? (
            <div className={styles.voucherPreviewWrapper}>
              <img src={yapeVoucherPreview} alt="Comprobante" className={styles.voucherPreviewImg} />
              <button
                className={styles.voucherRemove}
                onClick={() => {
                  setYapeVoucherFile(null);
                  setYapeVoucherPreview(null);
                  if (yapeFileInputRef.current) yapeFileInputRef.current.value = "";
                }}
                type="button"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              className={styles.voucherDropzone}
              onClick={() => yapeFileInputRef.current?.click()}
              type="button"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span>Toca para adjuntar foto del comprobante</span>
            </button>
          )}
        </div>

        {culqiError && (
          <p style={{ color: "#e53e3e", fontSize: "0.85rem", textAlign: "center", marginTop: 8 }}>{culqiError}</p>
        )}

        <button
          className={styles.yapeSendButton}
          disabled={!yapeVoucherFile || yapeUploading}
          onClick={async () => {
            if (!yapeVoucherFile) { setCulqiError("Debes adjuntar el comprobante de pago"); return; }
            setYapeUploading(true);
            setCulqiError(null);
            try {
              const formData = new FormData();
              formData.append("file", yapeVoucherFile);
              formData.append("bookingId", bookingId.toString());
              const uploadRes = await fetch("/api/payments/voucher", { method: "POST", body: formData });
              if (!uploadRes.ok) { const d = await uploadRes.json(); throw new Error(d.error); }

              const res = await fetch("/api/payments/alternative", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId, paymentMethod: "YAPE" }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              setShowYapePayment(false);
              setYapeVoucherFile(null);
              setYapeVoucherPreview(null);
              onAlternativePaymentSuccess();
            } catch (err) {
              setCulqiError(err instanceof Error ? err.message : "Error al registrar el pago");
              setYapeUploading(false);
            }
          }}
        >
          {yapeUploading ? "Enviando..." : "Enviar comprobante"}
        </button>
      </div>
    );
  }

  // Configuración de cada método de pago
  const paymentOptions = [
    {
      id: "culqi" as const,
      labelImage: "/assets/images/culqi.png",
      label: "Culqi",
      description: null,
      icons: [
        { src: "/assets/images/visa.png", alt: "Visa Mastercard Amex" },
      ],
    },
    {
      id: "transfer" as const,
      label: "Transferencia Bancaria",
      description: <>Para asegurar tu turno y confirmar la inspección de Verificarlo a domicilio, realiza el abono de la reserva en nuestra <strong>Cuenta Ahorros Soles BCP</strong> a nombre de <strong><em>VERIFICARLO</em></strong>. Los datos específicos de la cuenta se mostrarán en la siguiente pantalla al finalizar tu solicitud.</>,
      icons: [{ src: "/assets/icons/bank.svg", alt: "Banco" }],
    },
    {
      id: "yape" as const,
      label: "Yape / Plin",
      description: <>Realiza el pago de tu reserva <strong>(S/ {bookingDetails.totalAmount.toFixed(0)})</strong> de forma rápida escaneando nuestro código QR o usando nuestro número oficial. Al finalizar tu solicitud, verás los datos de destino para realizar el abono.<br/><img src="/assets/images/yape.png" alt="Yape QR" style={{ marginTop: "0.75rem", maxWidth: "200px", borderRadius: "8px" }} /></>,
      icons: [
        { src: "/assets/images/yape.png", alt: "Yape / Plin" },
      ],
    },
    {
      id: "whatsapp" as const,
      label: "Pago por Whatsapp",
      description: <>Para asegurar tu turno y confirmar la inspección de Verificarlo a domicilio, <strong>el pago de la reserva se coordina directamente</strong> con un asesor. Al hacer clic en el botón inferior, serás redirigido a nuestro chat oficial.</>,
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
        <h2 className={styles.title}>Pago</h2>
        <p className={styles.subtitle}>
          Todas las transacciones son seguras y están encriptadas.
        </p>

        {/* Timer */}
        <div className={`${styles.timerBar} ${isUrgent ? styles.timerUrgent : ""}`}>
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
              className={styles.errorClose}
            >
              ×
            </button>
          </div>
        )}

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
                <div className={styles.radioWrapper}>
                  <div className={`${styles.radioCircle} ${isSelected ? styles.radioCircleSelected : ""}`}>
                    {isSelected && <div className={styles.radioDot} />}
                  </div>
                </div>

                <div className={styles.methodContent}>
                  <div className={styles.methodHeader}>
                    {option.labelImage ? (
                      <img src={option.labelImage} alt={option.label} className={styles.methodLabelImage} />
                    ) : (
                      <span className={styles.methodLabel}>{option.label}</span>
                    )}
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
                  {isSelected && option.description && (
                    <p className={styles.methodDescription}>{option.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen del pedido (collapsible) */}
        <div className={styles.orderSummary}>
          <button
            className={styles.orderSummaryToggle}
            onClick={() => setOrderSummaryOpen(!orderSummaryOpen)}
          >
            <span>Resumen del pedido</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={orderSummaryOpen ? styles.chevronOpen : ""}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {orderSummaryOpen && (
            <div className={styles.orderSummaryContent}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Plan</span>
                <span className={styles.infoValue}>{bookingDetails.planTitle}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Código</span>
                <span className={styles.infoValue}>{bookingDetails.bookingCode}</span>
              </div>
              <div className={styles.orderSummaryDivider} />
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Total a pagar</span>
                <span className={styles.infoValueLarge}>S/ {bookingDetails.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Botón de acción según método seleccionado */}
        {selectedMethod === "culqi" && (
          <button
            onClick={() => {
              if (!cardEmail && session?.user?.email) setCardEmail(session.user.email);
              setShowCardModal(true);
            }}
            disabled={culqiLoading || isExpired}
            className={styles.continueButton}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" />
              <path d="M1 10h22" />
            </svg>
            Pagar S/ {bookingDetails.totalAmount.toFixed(2)}
          </button>
        )}

        {selectedMethod === "yape" && (
          <button
            onClick={() => setShowYapePayment(true)}
            disabled={isExpired}
            className={styles.continueButton}
          >
            Pagar con Yape - S/ {bookingDetails.totalAmount.toFixed(2)}
          </button>
        )}

        {selectedMethod === "transfer" && (
          <button
            onClick={() => setShowTransferModal(true)}
            disabled={isExpired}
            className={styles.continueButton}
          >
            Ver datos para transferencia
          </button>
        )}

        {selectedMethod === "whatsapp" && (
          <button
            onClick={() => setShowWhatsAppModal(true)}
            disabled={isExpired}
            className={styles.continueButton}
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
        <p className={styles.securityNote}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Pago 100% seguro
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
          bookingId={bookingId}
          onSendVoucher={handleTransferComplete}
        />

        {/* Modal de WhatsApp */}
        <WhatsAppModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          bookingCode={bookingDetails.bookingCode}
          whatsappUrl={getWhatsAppUrl()}
        />

        {/* Modal de Tarjeta (reemplaza modal Culqi) */}
        {showCardModal && (
          <div className={styles.modalOverlay} onClick={() => !culqiLoading && setShowCardModal(false)}>
            <div className={styles.cardModal} onClick={(e) => e.stopPropagation()}>
              {/* Banner — estilo Culqi: logo, precio, descripción */}
              <div className={styles.cardModalBanner}>
                <div className={styles.cardModalBannerTop}>
                  <img src="/logo.png" alt="VerifiCARLO" className={styles.cardModalLogo} />
                  <button
                    className={styles.cardModalClose}
                    onClick={() => !culqiLoading && setShowCardModal(false)}
                  >
                    &times;
                  </button>
                </div>
                <div className={styles.cardModalAmount}>
                  <span className={styles.cardModalCurrency}>S/</span>
                  <span className={styles.cardModalPrice}>{bookingDetails.totalAmount.toFixed(2)}</span>
                </div>
                <span className={styles.cardModalBannerTitle}>{bookingDetails.planTitle}</span>
              </div>

              {/* Formulario */}
              <div className={styles.cardModalBody}>
                <p className={styles.cardModalDescription}>Datos de la tarjeta</p>

                {culqiError && (
                  <div className={styles.errorMessage}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                    {culqiError}
                  </div>
                )}

                <div className={styles.cardModalField}>
                  <label>Correo electrónico</label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="correo@ejemplo.com"
                    value={cardEmail}
                    onChange={(e) => setCardEmail(e.target.value)}
                  />
                </div>

                <div className={styles.cardModalField}>
                  <label>Número de tarjeta</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    maxLength={19}
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                      setCardNumber(v.replace(/(.{4})/g, "$1 ").trim());
                    }}
                  />
                </div>

                <div className={styles.cardRow}>
                  <div className={styles.cardModalField} style={{ flex: 1 }}>
                    <label>Mes</label>
                    <select
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
                  <div className={styles.cardModalField} style={{ flex: 1 }}>
                    <label>Año</label>
                    <select
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
                  <div className={styles.cardModalField} style={{ flex: 0.8 }}>
                    <label>CVV</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      maxLength={4}
                      placeholder="***"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    />
                  </div>
                </div>

                <button
                  className={styles.cardModalPayButton}
                  onClick={handleCardPayment}
                  disabled={!cardNumber || !expiryMonth || !expiryYear || !cvv || !cardEmail || culqiLoading}
                >
                  {culqiLoading ? (
                    <>
                      <span className={styles.spinner} />
                      Procesando...
                    </>
                  ) : (
                    <>Pagar S/ {bookingDetails.totalAmount.toFixed(2)}</>
                  )}
                </button>
              </div>

              {/* Footer — candado + logos de tarjetas */}
              <div className={styles.cardModalFooter}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Pago seguro
                <div className={styles.cardModalFooterCards}>
                  <img src="/assets/icons/visa.svg" alt="Visa" />
                  <img src="/assets/icons/mastercard.svg" alt="MC" />
                  <img src="/assets/icons/amex.svg" alt="Amex" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
