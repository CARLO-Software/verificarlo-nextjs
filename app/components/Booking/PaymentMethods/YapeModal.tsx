// =============================================================================
// COMPONENTE: YapeModal (Modal de Yape/Plin)
// =============================================================================
// Muestra el código QR y número de Yape para que el usuario realice
// el pago de la reserva.
// =============================================================================

"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./PaymentMethods.module.css";

interface YapeData {
  phone: string;
  holder: string;
  qrImage: string;
}

interface YapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  yapeData: YapeData;
  amount: number;
}

export default function YapeModal({
  isOpen,
  onClose,
  yapeData,
  amount,
}: YapeModalProps) {
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

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <rect x="7" y="7" width="3" height="3" />
              <rect x="14" y="7" width="3" height="3" />
              <rect x="7" y="14" width="3" height="3" />
              <rect x="14" y="14" width="3" height="3" />
            </svg>
          </div>
          <h3 className={styles.modalTitle}>
            ¡Casi listo! Escanea y asegura tu inspección
          </h3>
          <p className={styles.modalSubtitle}>
            Para confirmar la visita del perito de Verificarlo, realiza el abono
            de tu reserva ahora:
          </p>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Código QR */}
          <div className={styles.qrWrapper}>
            <img
              src={yapeData.qrImage}
              alt="Código QR de Yape"
              className={styles.qrImage}
              onError={(e) => {
                // Si la imagen no carga, mostrar placeholder
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Crect fill='%23f3f4f6' width='180' height='180'/%3E%3Ctext x='90' y='90' font-family='Arial' font-size='14' fill='%239ca3af' text-anchor='middle' dy='.3em'%3EQR Placeholder%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>

          {/* Datos */}
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Número:</span>
              <span className={styles.infoValue}>{yapeData.phone}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Monto a yapear/plinear:</span>
              <span className={styles.infoValueLarge}>S/ {amount.toFixed(2)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Titular:</span>
              <span className={styles.infoValue}>{yapeData.holder}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            className={`${styles.modalButton} ${styles.modalButtonPrimary}`}
            onClick={onClose}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(modalContent, document.body);
}
