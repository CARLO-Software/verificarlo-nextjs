/**
 * LegalFieldInput - Input reutilizable para campos del informe legal
 * Muestra: Selector de status + Input de texto + (opcional) Date picker
 */

'use client';

import { LegalFieldStatus } from '@prisma/client';
import styles from './legal.module.css';

interface LegalFieldInputProps {
  label: string;
  statusValue: LegalFieldStatus;
  textValue: string;
  dateValue?: string | null;
  onStatusChange: (status: LegalFieldStatus) => void;
  onTextChange: (text: string) => void;
  onDateChange?: (date: string) => void;
  showDatePicker?: boolean;
  disabled?: boolean;
}

const statusOptions: { value: LegalFieldStatus; label: string; color: string }[] = [
  { value: 'OK', label: 'OK', color: '#22C55E' },
  { value: 'WARNING', label: 'Obs.', color: '#EAB308' },
  { value: 'CRITICAL', label: 'Crit.', color: '#EF4444' },
  { value: 'PENDING', label: 'Pend.', color: '#9CA3AF' },
];

export function LegalFieldInput({
  label,
  statusValue,
  textValue,
  dateValue,
  onStatusChange,
  onTextChange,
  onDateChange,
  showDatePicker = false,
  disabled = false,
}: LegalFieldInputProps) {
  const currentStatus = statusOptions.find((s) => s.value === statusValue) || statusOptions[3];

  return (
    <div className={styles.fieldContainer}>
      <div className={styles.fieldHeader}>
        <span
          className={styles.statusIndicator}
          style={{ backgroundColor: currentStatus.color }}
          title={currentStatus.label}
        />
        <label className={styles.fieldLabel}>{label}</label>
      </div>

      <div className={styles.fieldContent}>
        {/* Status Selector */}
        <div className={styles.statusSelector}>
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.statusButton} ${statusValue === option.value ? styles.statusButtonActive : ''}`}
              style={
              { '--status-color': option.color } as React.CSSProperties & { '--status-color': string }
            }
              onClick={() => onStatusChange(option.value)}
              disabled={disabled}
              title={option.label}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Text Input */}
        <textarea
          className={styles.fieldTextarea}
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Observaciones..."
          disabled={disabled}
          rows={2}
        />

        {/* Date Picker (opcional) */}
        {showDatePicker && onDateChange && (
          <div className={styles.datePickerWrapper}>
            <label className={styles.dateLabel}>Fecha vencimiento:</label>
            <input
              type="date"
              className={styles.dateInput}
              value={dateValue || ''}
              onChange={(e) => onDateChange(e.target.value)}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}
