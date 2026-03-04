"use client";

import { useState, useEffect, useCallback } from "react";
import Script from "next/script";
import styles from "./PaymentForm.module.css";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Culqi: any;
    culqi: () => void;
  }
}

interface BookingDetails {
  inspectionTitle: string;
  inspectionType: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePlate: string;
  date: string;
  timeSlot: string;
  amount: number;
}

interface PaymentFormProps {
  bookingId: number;
  bookingDetails: BookingDetails;
  expiresAt: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess: (data: any) => void;
  onBack: () => void;
  onExpired: () => void;
}

export default function PaymentForm({
  bookingId,
  bookingDetails,
  expiresAt,
  onSuccess,
  onBack,
  onExpired,
}: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [culqiReady, setCulqiReady] = useState(false);

  // Calcular tiempo restante
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      return diff;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        onExpired();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpired]);

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Formatear hora
  const formatTimeSlot = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  //! Configurar Culqi cuando el script carga // ESENCIAL
  //Cada vez que los valores de la interface bookingDetails se alteran se ejecuta ese metodo
  //* UseCallBack recuerda, mas no reacciona
  //Eso es diferente a lo que se estaba pensando porque al ser useEffect se estaría ejecutando todo de nuevo despues de que se genere ese estado
  const handleCulqiLoad = useCallback(() => {
    if (typeof window !== "undefined" && window.Culqi) {
      window.Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY!;
      //* Con el open window.culqi.open() lo que hace es leer el settings y el options
      //Esto le va a llegar al cliente para que pueda ingresar su numero de tarjeta, cuanto es lo que debe de pagar
      
      window.Culqi.settings({
        title: "VerifiCARLO",
        currency: "PEN",
        description: `Inspección ${bookingDetails.inspectionType}`,
        amount: bookingDetails.amount * 100, //! En céntimos
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
      //* Cuando el usuario llena los datos de la tarjeta se genera un token que se va a enviar al servidor de Culqi para proceder con el pago
    }
  }, [bookingDetails]);


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
              bookingId,
              token: window.Culqi.token.id,
            }),
          });

          const data = await res.json();

          if (data.success) {
            onSuccess(data);
          } else {
            setError(data.error || "Error procesando el pago");
          }
        } catch {
          setError("Error de conexión. Por favor intenta de nuevo.");
        } finally {
          setLoading(false);
        }
      } else if (window.Culqi.error) {
        setError(window.Culqi.error.user_message || "Error en el pago");
      }
    };
  }, [bookingId, onSuccess]);

  //window.Culqi espera a que Culqi haya cargado en el navegador, sino será undefined
  const handleOpenCulqi = () => {
    if (window.Culqi && culqiReady) {
      //Este es el corazón de Culqi
      //Culqi crea un modal (dialog)
      window.Culqi.open();
    }
  };

  const isExpired = timeLeft <= 0;
  const isUrgent = timeLeft > 0 && timeLeft < 300; // Menos de 5 minutos

  return (
    <>
      <Script src="https://checkout.culqi.com/js/v4" onLoad={handleCulqiLoad} />

      <div className={styles.container}>
        {/* Timer */}
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

        {/* Resumen de la reserva */}
        <div className={styles.summary}>
          <h3 className={styles.summaryTitle}>Resumen de tu reserva</h3>

          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Inspección</span>
            <span className={styles.summaryValue}>
              {bookingDetails.inspectionTitle}
            </span>
          </div>

          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Vehículo</span>
            <span className={styles.summaryValue}>
              {bookingDetails.vehicleBrand} {bookingDetails.vehicleModel}{" "}
              {bookingDetails.vehicleYear}
            </span>
          </div>

          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Placa</span>
            <span className={styles.summaryValue}>
              {bookingDetails.vehiclePlate}
            </span>
          </div>

          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Fecha</span>
            <span className={styles.summaryValue}>
              {formatDate(bookingDetails.date)}
            </span>
          </div>

          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Hora</span>
            <span className={styles.summaryValue}>
              {formatTimeSlot(bookingDetails.timeSlot)}
            </span>
          </div>

          <div className={styles.divider} />

          <div className={`${styles.summaryItem} ${styles.total}`}>
            <span className={styles.summaryLabel}>Total a pagar</span>
            <span className={styles.summaryValue}>
              S/ {bookingDetails.amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Métodos de pago */}
        <div className={styles.paymentMethods}>
          <p className={styles.paymentMethodsLabel}>Aceptamos</p>
          <div className={styles.cards}>
            <img src="/icons/visa.svg" alt="Visa" />
            <img src="/icons/mastercard.svg" alt="Mastercard" />
            <img src="/icons/amex.svg" alt="American Express" />
            <img src="/icons/diners.svg" alt="Diners Club" />
          </div>
        </div>

        {/* Acciones */}
        <div className={styles.actions}>
          <button
            onClick={onBack}
            disabled={loading}
            className={styles.backButton}
          >
            Atrás
          </button>
          <button
            onClick={handleOpenCulqi}
            disabled={loading || isExpired || !culqiReady}
            className={styles.payButton}
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
                Pagar S/ {bookingDetails.amount.toFixed(2)}
              </>
            )}
          </button>
        </div>

        {/* Seguridad */}
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
    </>
  );
}
