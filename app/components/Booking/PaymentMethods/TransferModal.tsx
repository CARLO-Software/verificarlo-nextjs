"use client";

import { useEffect, useState, useRef } from "react";
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
  bookingId: number;
  onSendVoucher: () => void;
}

export default function TransferModal({
  isOpen,
  onClose,
  bankAccounts,
  amount,
  bookingId,
  onSendVoucher,
}: TransferModalProps) {
  const [selectedAccountId, setSelectedAccountId] = useState(bankAccounts[0]?.id || "");
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedAccount = bankAccounts.find(acc => acc.id === selectedAccountId) || bankAccounts[0];
  const banks = [...new Set(bankAccounts.map(acc => acc.bank))];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && bankAccounts.length > 0) {
      setSelectedAccountId(bankAccounts[0].id);
      setVoucherFile(null);
      setVoucherPreview(null);
      setError(null);
    }
  }, [isOpen, bankAccounts]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !uploading) onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose, uploading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar 5MB");
      return;
    }

    setError(null);
    setVoucherFile(file);
    setVoucherPreview(URL.createObjectURL(file));
  };

  const handleConfirm = async () => {
    if (!voucherFile) {
      setError("Debes adjuntar el comprobante de transferencia");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", voucherFile);
      formData.append("bookingId", bookingId.toString());

      const res = await fetch("/api/payments/voucher", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al subir comprobante");
      }

      onSendVoucher();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir comprobante");
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className={styles.modalOverlay} onClick={uploading ? undefined : onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar" disabled={uploading}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Transferencia Bancaria</h3>
          <p className={styles.modalSubtitle}>
            Deposita <strong>S/ {amount.toFixed(2)}</strong> en la cuenta que prefieras
          </p>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.bankSelector}>
            <span className={styles.bankSelectorLabel}>Banco</span>
            <div className={styles.bankTabs}>
              {banks.map((bank) => (
                <button
                  key={bank}
                  className={`${styles.bankTab} ${selectedAccount?.bank === bank ? styles.bankTabActive : ""}`}
                  onClick={() => {
                    const first = bankAccounts.find(acc => acc.bank === bank);
                    if (first) setSelectedAccountId(first.id);
                  }}
                >
                  <img
                    src={bankAccounts.find(acc => acc.bank === bank)?.logo}
                    alt={bank}
                    className={styles.bankTabLogo}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <span>{bank}</span>
                </button>
              ))}
            </div>
          </div>

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

          {selectedAccount && (
            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>N° de Cuenta</span>
                <span className={styles.infoValue}>{selectedAccount.accountNumber}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>CCI</span>
                <span className={styles.infoValue}>{selectedAccount.cci}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Titular</span>
                <span className={styles.infoValue}>{selectedAccount.holder}</span>
              </div>
            </div>
          )}

          {/* Upload comprobante */}
          <div className={styles.voucherUpload}>
            <label className={styles.voucherLabel}>
              Comprobante de transferencia <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            {voucherPreview ? (
              <div className={styles.voucherPreviewWrapper}>
                <img src={voucherPreview} alt="Comprobante" className={styles.voucherPreviewImg} />
                <button
                  className={styles.voucherRemove}
                  onClick={() => {
                    setVoucherFile(null);
                    setVoucherPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  type="button"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                className={styles.voucherDropzone}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                <span>Toca para adjuntar foto del comprobante</span>
              </button>
            )}
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={`${styles.modalButton} ${styles.modalButtonPrimary}`}
            onClick={handleConfirm}
            disabled={!voucherFile || uploading}
          >
            {uploading ? (
              <>
                <span className={styles.spinner} />
                Enviando...
              </>
            ) : (
              "Ya realicé la transferencia"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
