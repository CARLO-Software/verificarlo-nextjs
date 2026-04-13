// =============================================================================
// COMPONENTE: TransferModal (Modal de Transferencia Bancaria)
// =============================================================================
// Muestra los datos de las cuentas bancarias para que el usuario realice
// la transferencia de la reserva. Permite seleccionar entre múltiples bancos.
//
// CONCEPTO: createPortal
// Los modales usan createPortal para renderizarse directamente en document.body.
// Esto evita que el modal quede "atrapado" por overflow:hidden o z-index
// de sus contenedores padres.
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./PaymentMethods.module.css";

interface BankAccount {
  id: string;
  bank: string;
  currency: string;
  accountNumber: string;
  cci: string;
  holder: string;
  logo: string;
}

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankAccounts: BankAccount[];
  amount: number;
  onSendVoucher: () => void;
}

export default function TransferModal({
  isOpen,
  onClose,
  bankAccounts,
  amount,
  onSendVoucher,
}: TransferModalProps) {
  // Estado para la cuenta bancaria seleccionada
  const [selectedAccountId, setSelectedAccountId] = useState(bankAccounts[0]?.id || "");

  // Obtener la cuenta seleccionada
  const selectedAccount = bankAccounts.find(acc => acc.id === selectedAccountId) || bankAccounts[0];

  // Agrupar cuentas por banco para mostrar tabs
  const banks = [...new Set(bankAccounts.map(acc => acc.bank))];

  // =============================================================================
  // EFECTO: Bloquear scroll del body cuando el modal está abierto
  // =============================================================================
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

  // Reset selección cuando se abre el modal
  useEffect(() => {
    if (isOpen && bankAccounts.length > 0) {
      setSelectedAccountId(bankAccounts[0].id);
    }
  }, [isOpen, bankAccounts]);

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
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </div>
          <h3 className={styles.modalTitle}>Transferencia Bancaria</h3>
          <p className={styles.modalSubtitle}>
            Selecciona tu banco y realiza el abono de la reserva
          </p>
        </div>

        {/* Body con datos */}
        <div className={styles.modalBody}>
          {/* Monto a depositar */}
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Monto a depositar:</span>
              <span className={styles.infoValueLarge}>S/ {amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Selector de banco */}
          <div className={styles.bankSelector}>
            <span className={styles.bankSelectorLabel}>Selecciona tu banco:</span>
            <div className={styles.bankTabs}>
              {banks.map((bank) => (
                <button
                  key={bank}
                  className={`${styles.bankTab} ${selectedAccount?.bank === bank ? styles.bankTabActive : ""}`}
                  onClick={() => {
                    const firstAccountOfBank = bankAccounts.find(acc => acc.bank === bank);
                    if (firstAccountOfBank) setSelectedAccountId(firstAccountOfBank.id);
                  }}
                >
                  <img
                    src={bankAccounts.find(acc => acc.bank === bank)?.logo}
                    alt={bank}
                    className={styles.bankTabLogo}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span>{bank}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selector de moneda */}
          {selectedAccount && (
            <div className={styles.currencySelector}>
              {bankAccounts
                .filter(acc => acc.bank === selectedAccount.bank)
                .map((acc) => (
                  <button
                    key={acc.id}
                    className={`${styles.currencyTab} ${selectedAccountId === acc.id ? styles.currencyTabActive : ""}`}
                    onClick={() => setSelectedAccountId(acc.id)}
                  >
                    {acc.currency}
                  </button>
                ))}
            </div>
          )}

          {/* Datos de la cuenta seleccionada */}
          {selectedAccount && (
            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Banco:</span>
                <span className={styles.infoValue}>{selectedAccount.bank} - {selectedAccount.currency}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>N° de Cuenta:</span>
                <span className={styles.infoValue}>{selectedAccount.accountNumber}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>CCI:</span>
                <span className={styles.infoValue}>{selectedAccount.cci}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Titular:</span>
                <span className={styles.infoValue}>{selectedAccount.holder}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer con botón */}
        <div className={styles.modalFooter}>
          <button className={`${styles.modalButton} ${styles.modalButtonPrimary}`} onClick={onSendVoucher}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
            Ya realicé la transferencia
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
