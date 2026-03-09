// =============================================================================
// COMPONENTE: WhatsAppModal (Modal de Coordinación por WhatsApp)
// =============================================================================
// Muestra un loader y luego las instrucciones para coordinar el pago
// vía WhatsApp con un asesor.
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./PaymentMethods.module.css";

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingCode: string;
  whatsappUrl: string;
}

export default function WhatsAppModal({
  isOpen,
  onClose,
  bookingCode,
  whatsappUrl,
}: WhatsAppModalProps) {
  // Estado para mostrar el loader inicialmente
  const [showLoader, setShowLoader] = useState(true);

  // Mostrar loader por 2 segundos al abrir
  useEffect(() => {
    if (isOpen) {
      setShowLoader(true);
      const timer = setTimeout(() => setShowLoader(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Bloquear scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {showLoader ? (
          // =================================================================
          // ESTADO: Cargando
          // =================================================================
          <>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                Conectando con un asesor de Verificarlo...
              </h3>
              <p className={styles.modalSubtitle}>
                Estás siendo redirigido a nuestro canal oficial para coordinar
                tu pago de reserva.
              </p>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.loaderWrapper}>
                <div className={styles.loader} />
                <span className={styles.loaderText}>Preparando conexión...</span>
              </div>
              <p style={{ textAlign: "center", marginTop: "1rem" }}>
                Tu código de reserva: <span className={styles.bookingCode}>{bookingCode}</span>
              </p>
            </div>
          </>
        ) : (
          // =================================================================
          // ESTADO: Instrucciones
          // =================================================================
          <>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon} style={{ background: "#dcfce7", color: "#25d366" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <h3 className={styles.modalTitle}>
                Conectando con un asesor de Verificarlo...
              </h3>
              <p className={styles.modalSubtitle}>
                Estás siendo redirigido a nuestro canal oficial para coordinar
                tu pago de reserva.
              </p>
            </div>

            <div className={styles.modalBody}>
              <p style={{ textAlign: "center", marginBottom: "1rem" }}>
                Tu código de reserva: <span className={styles.bookingCode}>{bookingCode}</span>
              </p>

              <h4 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                ¿Qué sigue?
              </h4>

              <div className={styles.stepsList}>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>1</span>
                  <span className={styles.stepText}>
                    Se abrirá tu WhatsApp con un mensaje pre-llenado con tus datos.
                  </span>
                </div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>2</span>
                  <span className={styles.stepText}>
                    Un asesor te brindará las cuentas de BCP o Interbank para tu abono.
                  </span>
                </div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>3</span>
                  <span className={styles.stepText}>
                    Una vez enviado tu voucher, recibirás la confirmación oficial de tu visita técnica.
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.modalButton} ${styles.modalButtonWhatsApp}`}
                onClick={onClose}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Abrir WhatsApp ahora
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(modalContent, document.body);
}
