'use client';

import { useState } from 'react';
import ComplaintBookModal from './ComplaintBookModal';
import styles from './ComplaintBook.module.css';

const COMPLAINT_URL = 'https://app.reclamovirtual.pe/reclamar/Carlo-pe/surco';

interface ComplaintBookButtonProps {
  mode?: 'external' | 'modal';
  variant?: 'default' | 'footer';
  className?: string;
}

export default function ComplaintBookButton({
  mode = 'external',
  variant = 'default',
  className = '',
}: ComplaintBookButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (mode === 'modal') {
      setIsModalOpen(true);
    } else {
      window.open(COMPLAINT_URL, '_blank', 'noopener,noreferrer');
    }
  };

  if (variant === 'footer') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`${styles.footerLink} ${className}`}
          aria-label="Abrir libro de reclamaciones virtual"
        >
          <BookIcon className={styles.footerLinkIcon} />
          <span>Libro de Reclamaciones</span>
          {mode === 'external' && <ExternalIcon className={styles.footerLinkExternal} />}
        </button>
        {mode === 'modal' && (
          <ComplaintBookModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            url={COMPLAINT_URL}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`${styles.button} ${className}`}
        aria-label="Abrir libro de reclamaciones virtual"
        aria-haspopup={mode === 'modal' ? 'dialog' : undefined}
      >
        <BookIcon className={styles.buttonIcon} />
        <span className={styles.buttonContent}>
          <span className={styles.buttonLabel}>Libro de Reclamaciones</span>
          <span className={styles.buttonSub}>
            Conforme al Código de Protección y Defensa del Consumidor
          </span>
        </span>
        {mode === 'external' && <ExternalIcon className={styles.buttonExternal} />}
      </button>

      {mode === 'modal' && (
        <ComplaintBookModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          url={COMPLAINT_URL}
        />
      )}
    </>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}
