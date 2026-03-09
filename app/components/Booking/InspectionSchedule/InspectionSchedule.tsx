// =============================================================================
// COMPONENTE: InspectionSchedule (Datos para la Inspección - Paso 3)
// =============================================================================
// Este paso incluye:
// - Aviso sobre el pago de reserva (S/50)
// - Calendario para seleccionar fecha
// - Slots de horarios disponibles
// - Datos de contacto (nombre, teléfono)
// - Checkbox para marketing opt-in
//
// CONCEPTO: Reutilización de Componentes
// Usamos los componentes BookingCalendar y TimeSlots que ya existen,
// en lugar de crear nuevos. Esto es una práctica común en React:
// - Menos código duplicado
// - Cambios en un lugar afectan a todos los usos
// - Consistencia en toda la app
// =============================================================================

"use client";

import styles from "./InspectionSchedule.module.css";
import BookingCalendar from "@/app/components/Booking/Calendar/BookingCalendar";
import TimeSlots from "@/app/components/Booking/TimeSlots/TimeSlots";

interface ContactData {
  fullName: string;
  phone: string;
  marketingOptIn: boolean;
}

interface InspectionScheduleProps {
  selectedDate: string | null;
  selectedSlot: string | null;
  contactData: ContactData;
  onDateSelect: (date: string) => void;
  onSlotSelect: (slot: string) => void;
  onContactChange: (data: ContactData) => void;
}

export default function InspectionSchedule({
  selectedDate,
  selectedSlot,
  contactData,
  onDateSelect,
  onSlotSelect,
  onContactChange,
}: InspectionScheduleProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Datos para la inspección</h2>

      {/* =================================================================
          AVISO: Información sobre la reserva
          ================================================================= */}
      <div className={styles.reserveNotice}>
        <div className={styles.noticeIcon}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <div className={styles.noticeContent}>
          <p className={styles.noticeTitle}>Pago de reserva: S/ 50</p>
          <p className={styles.noticeText}>
            Para asegurar tu turno necesitas pagar un adelanto de S/ 50, que se
            descuenta del precio total del plan elegido.
          </p>
        </div>
      </div>

      {/* =================================================================
          SECCIÓN: Fecha y Hora
          ================================================================= */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>¿Cuándo te visitamos?</h3>

        <div className={styles.dateTimeGrid}>
          {/* Calendario - Reutilizamos el componente existente */}
          <div className={styles.calendarWrapper}>
            <BookingCalendar
              onDateSelect={onDateSelect}
              selectedDate={selectedDate}
            />
          </div>

          {/* Horarios - Solo aparece si hay fecha seleccionada */}
          {selectedDate && (
            <div className={styles.slotsWrapper}>
              <TimeSlots
                date={selectedDate}
                onSlotSelect={onSlotSelect}
                selectedSlot={selectedSlot}
              />
            </div>
          )}
        </div>
      </div>

      {/* =================================================================
          SECCIÓN: Datos de Contacto
          ================================================================= */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>¿Cómo te contactamos?</h3>

        <div className={styles.contactGrid}>
          {/* Nombre completo */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Nombre completo <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={contactData.fullName}
              onChange={(e) =>
                onContactChange({
                  ...contactData,
                  fullName: e.target.value,
                })
              }
              placeholder="Ej: Juan Pérez García"
              className={styles.input}
              aria-required="true"
            />
          </div>

          {/* Número de contacto */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Número de contacto <span className={styles.required}>*</span>
            </label>
            <input
              type="tel"
              value={contactData.phone}
              onChange={(e) => {
                // Solo permitir números
                const value = e.target.value.replace(/[^0-9]/g, "");
                onContactChange({
                  ...contactData,
                  phone: value,
                });
              }}
              placeholder="Ej: 987654321"
              maxLength={9}
              className={styles.input}
              aria-required="true"
            />
          </div>
        </div>

        {/* =================================================================
            CHECKBOX: Marketing opt-in (circular)
            =================================================================
            CONCEPTO CSS: El checkbox circular se logra con:
            - appearance: none (quita el estilo nativo del navegador)
            - border-radius: 50% (lo hace circular)
            - Estilos personalizados para :checked
            ================================================================= */}
        <div className={styles.checkboxWrapper}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={contactData.marketingOptIn}
              onChange={(e) =>
                onContactChange({
                  ...contactData,
                  marketingOptIn: e.target.checked,
                })
              }
              className={styles.circularCheckbox}
            />
            <span className={styles.checkboxText}>
              Deseo recibir consejos para mi compra y ofertas exclusivas de
              Verificarlo.
            </span>
          </label>
        </div>
      </div>

      {/* =================================================================
          NOTA: Información adicional
          ================================================================= */}
      <p className={styles.footerNote}>
        ** El monto de la reserva se descuenta del precio total del plan elegido.
      </p>
    </div>
  );
}
