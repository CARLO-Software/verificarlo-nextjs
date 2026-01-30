'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import styles from './FormField.module.css';

// ============================================
// FormField: Input reutilizable con label y errores
// Usa forwardRef para compatibilidad con react-hook-form
// ============================================

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;           // Texto de ayuda debajo del input
  as?: 'input' | 'textarea' | 'select';
  options?: { value: string; label: string }[]; // Para select
}

// forwardRef permite que el componente padre acceda al input directamente
// Útil para formularios y focus management
const FormField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  FormFieldProps
>(({ label, error, hint, as = 'input', options, className, ...props }, ref) => {
  // Genera un ID único basado en el name o label
  const inputId = props.id || props.name || label.toLowerCase().replace(/\s/g, '-');

  // Clases condicionales: input normal o con error
  const inputClasses = `${styles.input} ${error ? styles.inputError : ''} ${className || ''}`;

  // Renderiza el elemento correcto según 'as'
  const renderInput = () => {
    switch (as) {
      case 'textarea':
        return (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={inputId}
            className={inputClasses}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...(props as InputHTMLAttributes<HTMLTextAreaElement>)}
          />
        );
      case 'select':
        return (
          <select
            ref={ref as React.Ref<HTMLSelectElement>}
            id={inputId}
            className={inputClasses}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...(props as InputHTMLAttributes<HTMLSelectElement>)}
          >
            <option value="">Seleccionar...</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            id={inputId}
            className={inputClasses}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...(props as InputHTMLAttributes<HTMLInputElement>)}
          />
        );
    }
  };

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
        {props.required && <span className={styles.required}>*</span>}
      </label>

      {renderInput()}

      {/* Hint: texto de ayuda (solo si no hay error) */}
      {hint && !error && (
        <span className={styles.hint}>{hint}</span>
      )}

      {/* Error: mensaje de validación */}
      {error && (
        <span id={`${inputId}-error`} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
});

// displayName ayuda en DevTools de React
FormField.displayName = 'FormField';

export default FormField;
