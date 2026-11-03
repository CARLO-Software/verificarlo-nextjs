"use client";

import { useState } from "react";
import styles from "./InspectionSchedule.module.css";
import BookingCalendar from "@/app/components/Booking/Calendar/BookingCalendar";
import TimeSlots from "@/app/components/Booking/TimeSlots/TimeSlots";
import { PhoneInput } from "@/app/components/ui/PhoneInput/PhoneInput";

interface ContactData {
  fullName: string;
  phone: string;
  marketingOptIn: boolean;
  termsAccepted: boolean;
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
  const [showCalendar, setShowCalendar] = useState(false);

  const displayDateValue = () => {
    if (!selectedDate && !selectedSlot) return "";
    const parts = [];
    if (selectedDate) {
      const [y, m, d] = selectedDate.split("-");
      parts.push(`${d}/${m}/${y}`);
    }
    if (selectedSlot) parts.push(selectedSlot);
    return parts.join(" — ");
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Datos para la Inspección</h2>
      <p className={styles.subtitle}>
        Para asegurar este turno, se requiere un{" "}
        <strong>pago de reserva de S/ 50.</strong>
      </p>

      {/* Fecha y Hora */}
      <div className={styles.fieldGroup}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            readOnly
            value={displayDateValue()}
            onClick={() => setShowCalendar(!showCalendar)}
            placeholder=" "
            className={styles.input}
            style={{ cursor: "pointer" }}
            aria-required="true"
          />
          {!displayDateValue() && (
            <span className={styles.requiredDot}>Fecha y Hora</span>
          )}
          <button
            type="button"
            className={styles.calendarIcon}
            onClick={() => setShowCalendar(!showCalendar)}
            aria-label="Abrir calendario"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
        </div>

        {showCalendar && (
          <div className={styles.calendarDropdown}>
            <BookingCalendar
              onDateSelect={(date) => {
                onDateSelect(date);
                onSlotSelect("");
              }}
              selectedDate={selectedDate}
            />
            {selectedDate && (
              <div className={styles.slotsInCalendar}>
                <TimeSlots
                  date={selectedDate}
                  onSlotSelect={(slot) => {
                    onSlotSelect(slot);
                    setShowCalendar(false);
                  }}
                  selectedSlot={selectedSlot}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nombre completo */}
      <div className={styles.fieldGroup}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            value={contactData.fullName}
            onChange={(e) =>
              onContactChange({ ...contactData, fullName: e.target.value })
            }
            placeholder=" "
            className={styles.input}
            aria-required="true"
          />
          {!contactData.fullName && (
            <span className={styles.requiredDot}>Nombre Completo</span>
          )}
        </div>
      </div>

      {/* Número de contacto */}
      <div className={styles.fieldGroup}>
        <PhoneInput
          value={contactData.phone}
          onChange={(fullPhone) =>
            onContactChange({ ...contactData, phone: fullPhone })
          }
        />
      </div>

      <p className={styles.requiredNote}>
        Los campos marcados con un asterisco (*) son obligatorios.
      </p>

      {/* Marketing opt-in */}
      <div className={styles.checkboxWrapper}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={contactData.marketingOptIn}
            onChange={(e) =>
              onContactChange({ ...contactData, marketingOptIn: e.target.checked })
            }
            className={styles.circularCheckbox}
          />
          <span className={styles.checkboxText}>
            Deseo recibir consejos para mi compra y ofertas exclusivas de
            Verificarlo.
          </span>
        </label>
      </div>

      {/* Términos y Condiciones */}
      <div className={styles.checkboxWrapper}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={contactData.termsAccepted}
            onChange={(e) =>
              onContactChange({ ...contactData, termsAccepted: e.target.checked })
            }
            className={styles.circularCheckbox}
            required
          />
          <span className={styles.checkboxText}>
            Acepto los{" "}
            <a href="/terminos-y-condiciones" target="_blank" rel="noopener noreferrer" className={styles.legalLink}>
              Términos y Condiciones
            </a>
            {" "}y la{" "}
            <a href="/politica-de-privacidad" target="_blank" rel="noopener noreferrer" className={styles.legalLink}>
              Política de Privacidad
            </a>
            {" "}<span className={styles.required}>*</span>
          </span>
        </label>
      </div>
    </div>
  );
}
