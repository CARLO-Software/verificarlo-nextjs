"use client";

import { useEffect, useState, useRef } from "react";
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
  bookingId: number;
  onPaymentConfirm: (operationNumber: string) => Promise<void>;
}

export default function YapeModal({
  isOpen,
  onClose,
  yapeData,
  amount,
  bookingId,
  onPaymentConfirm,
}: YapeModalProps) {
  const [step, setStep] = useState<"info" | "confirm">("info");
  const [operationNumber, setOperationNumber] = useState("");
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep("info");
      setOperationNumber("");
      setVoucherFile(null);
      setVoucherPreview(null);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose, loading]);

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

  const handleConfirmPayment = async () => {
    if (!operationNumber.trim()) {
      setError("Ingresa el número de operación");
      return;
    }
    if (!voucherFile) {
      setError("Debes adjuntar el comprobante de pago");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Subir comprobante primero
      const formData = new FormData();
      formData.append("file", voucherFile);
      formData.append("bookingId", bookingId.toString());

      const uploadRes = await fetch("/api/payments/voucher", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        throw new Error(data.error || "Error al subir comprobante");
      }

      await onPaymentConfirm(operationNumber.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar el pago");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className={styles.modalOverlay} onClick={loading ? undefined : onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar" disabled={loading}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {step === "info" ? (
          <>
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
                Para confirmar la visita del perito, realiza el abono de tu reserva:
              </p>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.qrWrapper}>
                <img
                  src={yapeData.qrImage}
                  alt="Código QR de Yape"
                  className={styles.qrImage}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Crect fill='%23f3f4f6' width='180' height='180'/%3E%3Ctext x='90' y='90' font-family='Arial' font-size='14' fill='%239ca3af' text-anchor='middle' dy='.3em'%3EQR Placeholder%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>

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

            <div className={styles.modalFooter}>
              <button className={styles.modalButtonSecondary} onClick={onClose}>
                Cancelar
              </button>
              <button
                className={`${styles.modalButton} ${styles.modalButtonPrimary}`}
                onClick={() => setStep("confirm")}
              >
                Ya realicé el pago
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.modalHeader}>
              <div className={styles.modalIconSuccess}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <h3 className={styles.modalTitle}>Confirma tu pago</h3>
              <p className={styles.modalSubtitle}>
                Ingresa el número de operación y adjunta el comprobante
              </p>
            </div>

            <div className={styles.modalBody}>
              {error && (
                <div className={styles.errorMessage}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  {error}
                </div>
              )}

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Número de operación <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={operationNumber}
                  onChange={(e) => setOperationNumber(e.target.value)}
                  placeholder="Ej: 123456789"
                  className={styles.input}
                  disabled={loading}
                  autoFocus
                />
                <span className={styles.inputHint}>
                  Lo encuentras en el comprobante de Yape/Plin
                </span>
              </div>

              {/* Upload comprobante */}
              <div className={styles.voucherUpload}>
                <label className={styles.voucherLabel}>
                  Comprobante de pago <span style={{ color: "#e53e3e" }}>*</span>
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
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.modalButtonSecondary}
                onClick={() => setStep("info")}
                disabled={loading}
              >
                Atrás
              </button>
              <button
                className={`${styles.modalButton} ${styles.modalButtonPrimary}`}
                onClick={handleConfirmPayment}
                disabled={loading || !operationNumber.trim() || !voucherFile}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    Verificando...
                  </>
                ) : (
                  "Confirmar pago"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
