'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './ComplaintBook.module.css';

interface ComplaintBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export default function ComplaintBookModal({ isOpen, onClose, url }: ComplaintBookModalProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') trapFocus(e);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
      setIsLoaded(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (!modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Libro de Reclamaciones"
    >
      <div className={styles.modal} ref={modalRef}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <BookIcon className={styles.modalIcon} />
            <div>
              <h2 className={styles.modalTitle}>Libro de Reclamaciones</h2>
              <p className={styles.modalSubtitle}>Ley N° 29571 – Código de Protección al Consumidor</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar libro de reclamaciones"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Iframe */}
        <div className={styles.iframeWrapper}>
          {!isLoaded && (
            <div className={styles.loader} aria-label="Cargando...">
              <div className={styles.spinner} />
              <p className={styles.loaderText}>Cargando formulario...</p>
            </div>
          )}
          <iframe
            src={url}
            title="Libro de Reclamaciones Virtual"
            className={`${styles.iframe} ${isLoaded ? styles.iframeVisible : ''}`}
            onLoad={() => setIsLoaded(true)}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
          />
        </div>
      </div>
    </div>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
