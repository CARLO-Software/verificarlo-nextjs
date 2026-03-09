// =============================================================================
// COMPONENTE: PaymentMethods (Métodos de Pago - Paso 4)
// =============================================================================
// Este componente muestra 4 opciones de pago:
// 1. Culqi (tarjeta) - Usa el componente PaymentForm existente
// 2. Transferencia Bancaria - Abre modal con datos del banco
// 3. Yape/Plin - Abre modal con QR
// 4. WhatsApp - Abre modal de coordinación
//
// CONCEPTO: Modales y "Portal"
// Los modales se renderizan "fuera" del DOM normal usando createPortal.
// Esto evita problemas con z-index y overflow: hidden de contenedores padres.
// =============================================================================

"use client";

import { useState } from "react";
import styles from "./PaymentMethods.module.css";
import TransferModal from "./TransferModal";
import YapeModal from "./YapeModal";
import WhatsAppModal from "./WhatsAppModal";

// Tipos de métodos de pago disponibles
type PaymentMethod = "culqi" | "transfer" | "yape" | "whatsapp" | null;

interface BookingDetails {
  bookingCode: string;
  userName: string;
  planTitle: string;
  totalAmount: number;
}

interface PaymentMethodsProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
  bookingDetails: BookingDetails;
  onCulqiPayment: () => void; // Callback para proceder con Culqi
  onTransferComplete: () => void; // Callback cuando envía comprobante
}

// Datos de ejemplo para los modales (REEMPLAZAR con datos reales)
const RESERVE_AMOUNT = 50;

const BANK_DATA = {
  bank: "BCP - Cuenta Ahorros Soles",
  accountNumber: "1234 5678 9012 3456",
  cci: "002 1234 5678 9012 3456 32",
  holder: "VERIFICARLO",
};

const YAPE_DATA = {
  phone: "987 654 321",
  holder: "VERIFICARLO",
  qrImage: "/assets/images/yape-qr.svg",
};

export default function PaymentMethods({
  selectedMethod,
  onSelectMethod,
  bookingDetails,
  onCulqiPayment,
  onTransferComplete,
}: PaymentMethodsProps) {
  // Estados para controlar la visibilidad de los modales
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showYapeModal, setShowYapeModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Configuración de cada método de pago
  const paymentOptions = [
    {
      id: "culqi" as const,
      label: "Tarjeta de crédito/débito",
      description:
        "Se te redirigirá a Culqi para que completes la compra de forma segura.",
      icons: [
        { src: "/assets/icons/visa.svg", alt: "Visa" },
        { src: "/assets/icons/mastercard.svg", alt: "MasterCard" },
        { src: "/assets/icons/amex.svg", alt: "American Express" },
      ],
    },
    {
      id: "transfer" as const,
      label: "Transferencia Bancaria",
      description:
        "Para asegurar tu turno y confirmar la inspección de Verificarlo a domicilio, realiza el abono de la reserva en nuestra Cuenta Ahorros Soles BCP a nombre de VERIFICARLO. Los datos específicos de la cuenta se mostrarán al continuar.",
      icons: [{ src: "/assets/icons/bank.svg", alt: "Banco" }],
    },
    {
      id: "yape" as const,
      label: "Yape / Plin",
      description:
        "Realiza el pago de tu reserva (S/ 50) de forma rápida escaneando nuestro código QR o usando nuestro número oficial. Al continuar, verás los datos de destino para realizar el abono.",
      icons: [{ src: "/assets/icons/yape.svg", alt: "Yape/Plin" }],
    },
    {
      id: "whatsapp" as const,
      label: "Pago por WhatsApp",
      description:
        "Para asegurar tu turno y confirmar la inspección de Verificarlo a domicilio, el pago de la reserva se coordina directamente con un asesor. Al hacer clic en el botón inferior, serás redirigido a nuestro chat oficial.",
      icons: [{ src: "/assets/icons/whatsapp.svg", alt: "WhatsApp" }],
    },
  ];

  // Handler para continuar según el método seleccionado
  const handleContinue = () => {
    switch (selectedMethod) {
      case "culqi":
        onCulqiPayment();
        break;
      case "transfer":
        setShowTransferModal(true);
        break;
      case "yape":
        setShowYapeModal(true);
        break;
      case "whatsapp":
        setShowWhatsAppModal(true);
        break;
    }
  };

  // Generar mensaje de WhatsApp
  const getWhatsAppUrl = () => {
    const message = encodeURIComponent(
      `¡Hola! Soy ${bookingDetails.userName}. Quiero confirmar mi reserva ${bookingDetails.bookingCode} ` +
        `para el plan ${bookingDetails.planTitle} y coordinar el pago de S/${RESERVE_AMOUNT} para asegurar mi inspección.`
    );
    return `https://api.whatsapp.com/send?phone=51934140010&text=${message}`;
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Pago de Reserva</h2>
      <p className={styles.subtitle}>
        Selecciona tu método de pago preferido para asegurar tu turno
      </p>

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
                          // Si el icono no carga, mostrar placeholder
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

      {/* Botón continuar - solo habilitado si hay método seleccionado */}
      <button
        onClick={handleContinue}
        disabled={!selectedMethod}
        className={styles.continueButton}
      >
        {selectedMethod === "culqi" && "Pagar con tarjeta"}
        {selectedMethod === "transfer" && "Ver datos bancarios"}
        {selectedMethod === "yape" && "Ver código QR"}
        {selectedMethod === "whatsapp" && "Continuar a WhatsApp"}
        {!selectedMethod && "Selecciona un método de pago"}
      </button>

      {/* =================================================================
          MODALES
          ================================================================= */}

      {/* Modal de Transferencia Bancaria */}
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        bankData={BANK_DATA}
        amount={RESERVE_AMOUNT}
        onSendVoucher={onTransferComplete}
      />

      {/* Modal de Yape/Plin */}
      <YapeModal
        isOpen={showYapeModal}
        onClose={() => setShowYapeModal(false)}
        yapeData={YAPE_DATA}
        amount={RESERVE_AMOUNT}
      />

      {/* Modal de WhatsApp */}
      <WhatsAppModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        bookingCode={bookingDetails.bookingCode}
        whatsappUrl={getWhatsAppUrl()}
      />
    </div>
  );
}
