// =============================================================================
// COMPONENTE: TransferModal (Modal de Transferencia Bancaria)
// =============================================================================
// Muestra los datos de la cuenta bancaria para que el usuario realice
// la transferencia de la reserva.
//
// CONCEPTO: createPortal
// Los modales usan createPortal para renderizarse directamente en document.body.
// Esto evita que el modal quede "atrapado" por overflow:hidden o z-index
// de sus contenedores padres.
// =============================================================================

"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./PaymentMethods.module.css";

interface BankData {
  bank: string;
  accountNumber: string;
  cci: string;
  holder: string;
}

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankData: BankData;
  amount: number;
  onSendVoucher: () => void;
}

export default function TransferModal({
  isOpen,
  onClose,
  bankData,
  amount,
  onSendVoucher,
}: TransferModalProps) {
  // =============================================================================
  // EFECTO: Bloquear scroll del body cuando el modal está abierto
  // =============================================================================
  // Esto mejora la UX evitando que el usuario scrollee la página detrás del modal.

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    // Cleanup: restaurar scroll cuando el componente se desmonte
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // =============================================================================
  // EFECTO: Cerrar modal con tecla ESC
  // =============================================================================
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // No renderizar nada si el modal está cerrado
  if (!isOpen) return null;

  // Contenido del modal
  const modalContent = (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()} // Evita que el click cierre el modal
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
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </div>
          <h3 className={styles.modalTitle}>Transferencia Bancaria</h3>
          <p className={styles.modalSubtitle}>
            Realiza el abono a nuestra cuenta y envíanos el comprobante
          </p>
        </div>

        {/* Body con datos */}
        <div className={styles.modalBody}>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Monto a depositar:</span>
              <span className={styles.infoValueLarge}>S/ {amount.toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Destino:</span>
              <span className={styles.infoValue}>{bankData.bank}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Número de Cuenta:</span>
              <span className={styles.infoValue}>{bankData.accountNumber}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Código Interbancario (CCI):</span>
              <span className={styles.infoValue}>{bankData.cci}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Titular:</span>
              <span className={styles.infoValue}>{bankData.holder}</span>
            </div>
          </div>
        </div>

        {/* Footer con botón */}
        <div className={styles.modalFooter}>
          <button className={`${styles.modalButton} ${styles.modalButtonPrimary}`} onClick={onSendVoucher}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
            Enviar comprobante
          </button>
        </div>
      </div>
    </div>
  );

  // Usar createPortal para renderizar en document.body
  // Esto solo funciona en el cliente, por eso verificamos que document existe
  if (typeof document === "undefined") return null;

  return createPortal(modalContent, document.body);
}
