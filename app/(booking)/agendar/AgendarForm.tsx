// =============================================================================
// COMPONENTE: AgendarForm (Formulario Principal de Reserva)
// =============================================================================
// Este es el componente principal del flujo de reserva.
// Organiza un layout de DOS COLUMNAS:
// - Izquierda: Imagen fija (solo en desktop)
// - Derecha: Formulario con 4 pasos y línea de tiempo
//
// CONCEPTOS DE REACT:
// 1. "use client" - Este componente necesita interactividad (clicks, formularios)
// 2. useState - Guardamos el estado de cada paso (qué plan eligió, qué fecha, etc.)
// 3. Props - Los datos iniciales vienen del Server Component (page.tsx)
// 4. Renderizado Condicional - Mostramos diferentes componentes según el paso
// =============================================================================

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./Agendar.module.css";

// Componentes del flujo de reserva
import StepTimeline from "@/app/components/Booking/StepTimeline/StepTimeline";
import PlanSelector from "@/app/components/Booking/PlanSelector/PlanSelector";
import VehicleLocationForm from "@/app/components/Booking/VehicleLocationForm/VehicleLocationForm";
import InspectionSchedule from "@/app/components/Booking/InspectionSchedule/InspectionSchedule";
import PaymentMethods from "@/app/components/Booking/PaymentMethods/PaymentMethods";
import PaymentForm from "@/app/components/Booking/PaymentForm/PaymentForm";
import Confirmation from "@/app/components/Booking/Confirmation/Confirmation";

// =============================================================================
// TIPOS
// =============================================================================

interface Inspection {
  id: number;
  type: string;
  title: string;
  description: string;
  landingDescription?: string;
  price: number;
  items?: { id: number; label: string }[];
}

interface Brand {
  id: number;
  name: string;
  logo: string;
}

interface AgendarFormProps {
  initialInspections: Inspection[];
  initialBrands: Brand[];
}

// Tipo para los pasos del flujo (1-4)
type BookingStep = 1 | 2 | 3 | 4;

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function AgendarForm({
  initialInspections,
  initialBrands,
}: AgendarFormProps) {
  const { status } = useSession();
  const router = useRouter();

  // =========================================================================
  // ESTADOS DEL FLUJO
  // =========================================================================

  // Paso actual (1-4)
  const [currentStep, setCurrentStep] = useState<BookingStep>(1);

  // Estados de carga y error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =========================================================================
  // PASO 1: Selección de Plan
  // =========================================================================
  const [selectedInspection, setSelectedInspection] =
    useState<Inspection | null>(null);

  // =========================================================================
  // PASO 2: Datos del Vehículo y Ubicación
  // =========================================================================
  const [vehicleData, setVehicleData] = useState({
    brandId: null as number | null,
    brandName: "",
    modelId: null as number | null,
    modelName: "",
    year: null as number | null,
    plate: "",
    mileage: null as number | null,
  });

  const [locationData, setLocationData] = useState({
    districtId: null as number | null,
    districtName: "",
    address: "",
  });

  // =========================================================================
  // PASO 3: Fecha, Hora y Contacto
  // =========================================================================
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [contactData, setContactData] = useState({
    fullName: "",
    phone: "",
    marketingOptIn: false,
  });

  // =========================================================================
  // PASO 4: Método de Pago
  // =========================================================================
  const [paymentMethod, setPaymentMethod] = useState<
    "culqi" | "transfer" | "yape" | "whatsapp" | null
  >(null);
  const [showCulqiForm, setShowCulqiForm] = useState(false);

  // =========================================================================
  // DATOS DE RESERVA (después de crearla en el backend)
  // =========================================================================
  const [bookingData, setBookingData] = useState<{
    id: number;
    code: string;
    expiresAt: Date;
    amount: number;
  } | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [confirmationData, setConfirmationData] = useState<any>(null);

  // =========================================================================
  // EFECTO: Verificar autenticación
  // =========================================================================
  // Si el usuario no está logueado, lo redirigimos al login.
  // useEffect se ejecuta después de que el componente se renderiza.

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/agendar");
    }
  }, [status, router]);

  // =========================================================================
  // VALIDACIONES POR PASO
  // =========================================================================
  // Estas funciones determinan si el usuario puede avanzar al siguiente paso.

  const canProceedStep1 = selectedInspection !== null;

  const canProceedStep2 =
    vehicleData.brandId !== null &&
    vehicleData.modelId !== null &&
    vehicleData.year !== null &&
    locationData.districtId !== null &&
    locationData.address.length >= 10;

  const canProceedStep3 =
    selectedDate !== null &&
    selectedSlot !== null &&
    contactData.fullName.length >= 3 &&
    contactData.phone.length >= 9;

  // canProceedStep4 se usa implícitamente en PaymentMethods
  const _canProceedStep4 = paymentMethod !== null;

  // =========================================================================
  // NAVEGACIÓN ENTRE PASOS
  // =========================================================================

  const goToStep = (step: BookingStep) => {
    setError(null);
    setCurrentStep(step);
  };

  const goNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as BookingStep);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as BookingStep);
    }
  };

  // =========================================================================
  // HANDLER: Proceder al Pago (después del paso 3)
  // =========================================================================
  // Crea el vehículo y la reserva en el backend

  const handleProceedToPayment = async () => {
    if (!canProceedStep3 || !selectedInspection) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Crear o obtener el vehículo
      const vehicleRes = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: vehicleData.modelId,
          year: vehicleData.year,
          plate: vehicleData.plate.toUpperCase(),
          mileage: vehicleData.mileage,
        }),
      });

      const vehicleResult = await vehicleRes.json();

      if (!vehicleRes.ok) {
        throw new Error(vehicleResult.error || "Error creando vehículo");
      }

      // 2. Crear la reserva
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          timeSlot: selectedSlot,
          inspectionPlanId: selectedInspection.id,
          vehicleId: vehicleResult.id,
          // Datos adicionales del nuevo formulario
          district: locationData.districtName,
          address: locationData.address,
          contactName: contactData.fullName,
          contactPhone: contactData.phone,
          marketingOptIn: contactData.marketingOptIn,
        }),
      });

      const bookingResult = await bookingRes.json();

      if (!bookingRes.ok) {
        throw new Error(bookingResult.error || "Error creando reserva");
      }

      // 3. Guardar datos de la reserva
      setBookingData({
        id: bookingResult.bookingId,
        code: `#v-${bookingResult.bookingId.toString().padStart(5, "0")}`,
        expiresAt: new Date(bookingResult.expiresAt),
        amount: bookingResult.amount,
      });

      // 4. Avanzar al paso de pago
      goNext();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // HANDLERS DE PAGO
  // =========================================================================

  const handleCulqiPayment = () => {
    setShowCulqiForm(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePaymentSuccess = (data: any) => {
    setConfirmationData(data.booking);
  };

  const handlePaymentExpired = () => {
    setError(
      "El tiempo para pagar ha expirado. Por favor, inicia una nueva reserva."
    );
    setBookingData(null);
    goToStep(3);
  };

  const handleTransferComplete = () => {
    // Por ahora solo mostramos un mensaje, en producción enviaría el voucher
    alert(
      "Gracias. Por favor envía tu comprobante por WhatsApp al 934140010 para confirmar tu reserva."
    );
  };

  // =========================================================================
  // ESTADOS DE CARGA
  // =========================================================================

  if (status === "loading") {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Cargando...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  // =========================================================================
  // PANTALLA DE CONFIRMACIÓN (después del pago exitoso)
  // =========================================================================

  if (confirmationData) {
    return <Confirmation booking={confirmationData} />;
  }

  // =========================================================================
  // FORMULARIO DE CULQI (cuando selecciona pago con tarjeta)
  // =========================================================================

  if (showCulqiForm && bookingData && selectedInspection) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <PaymentForm
            bookingId={bookingData.id}
            bookingDetails={{
              inspectionTitle: selectedInspection.title,
              inspectionType: selectedInspection.type,
              vehicleBrand: vehicleData.brandName,
              vehicleModel: vehicleData.modelName,
              vehicleYear: vehicleData.year!,
              vehiclePlate: vehicleData.plate,
              date: selectedDate!,
              timeSlot: selectedSlot!,
              amount: bookingData.amount,
            }}
            expiresAt={bookingData.expiresAt}
            onSuccess={handlePaymentSuccess}
            onBack={() => setShowCulqiForm(false)}
            onExpired={handlePaymentExpired}
          />
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER PRINCIPAL: Layout de Dos Columnas
  // =========================================================================

  return (
    <div className={styles.bookingLayout}>
      {/* ===================================================================
          COLUMNA IZQUIERDA: Imagen (solo visible en desktop)
          =================================================================== */}
      <aside className={styles.sidebarImage}>
        <img
          src="/assets/images/booking-sidebar.png"
          alt="Verificarlo - Inspección vehicular"
          className={styles.sidebarImageBg}
        />
        <div className={styles.sidebarOverlay}>
          <h2 className={styles.sidebarTitle}>
            Compra tu auto usado con total confianza
          </h2>
          <p className={styles.sidebarSubtitle}>
            Nuestros peritos certificados inspeccionan más de 200 puntos para
            asegurar tu inversión.
          </p>
        </div>
      </aside>

      {/* ===================================================================
          COLUMNA DERECHA: Formulario
          =================================================================== */}
      <main className={styles.formContainer}>
        <div className={styles.formContent}>
          {/* Header */}
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Agenda tu inspección</h1>
            <p className={styles.formSubtitle}>
              Completa los siguientes pasos para reservar tu cita
            </p>
          </div>

          {/* Línea de tiempo */}
          <StepTimeline currentStep={currentStep} />

          {/* Error global */}
          {error && (
            <div className={styles.errorBanner}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M10 6v5M10 13.5v.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>{error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {/* =================================================================
              PASO 1: Selección de Plan
              ================================================================= */}
          {currentStep === 1 && (
            <div className={styles.stepWrapper}>
              <PlanSelector
                plans={initialInspections}
                selectedPlanId={selectedInspection?.id || null}
                onSelectPlan={(plan) => setSelectedInspection(plan)}
              />

              <div className={`${styles.stepButtons} ${styles.stepButtonsCenter}`}>
                <button
                  onClick={goNext}
                  disabled={!canProceedStep1}
                  className={styles.primaryButton}
                >
                  Continuar
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M7 5l5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* =================================================================
              PASO 2: Datos del Vehículo y Ubicación
              ================================================================= */}
          {currentStep === 2 && (
            <div className={styles.stepWrapper}>
              <VehicleLocationForm
                brands={initialBrands}
                vehicleData={vehicleData}
                locationData={locationData}
                onVehicleChange={setVehicleData}
                onLocationChange={setLocationData}
              />

              <div className={styles.stepButtons}>
                <button onClick={goBack} className={styles.secondaryButton}>
                  Atrás
                </button>
                <button
                  onClick={goNext}
                  disabled={!canProceedStep2}
                  className={styles.primaryButton}
                >
                  Continuar
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M7 5l5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* =================================================================
              PASO 3: Fecha, Hora y Contacto
              ================================================================= */}
          {currentStep === 3 && (
            <div className={styles.stepWrapper}>
              <InspectionSchedule
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                contactData={contactData}
                onDateSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedSlot(null); // Reset slot cuando cambia la fecha
                }}
                onSlotSelect={setSelectedSlot}
                onContactChange={setContactData}
              />

              <div className={styles.stepButtons}>
                <button onClick={goBack} className={styles.secondaryButton}>
                  Atrás
                </button>
                <button
                  onClick={handleProceedToPayment}
                  disabled={!canProceedStep3 || loading}
                  className={styles.primaryButton}
                >
                  {loading ? (
                    <>
                      <span className={styles.buttonSpinner} />
                      Procesando...
                    </>
                  ) : (
                    <>
                      Continuar al pago
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M7 5l5 5-5 5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* =================================================================
              PASO 4: Métodos de Pago
              ================================================================= */}
          {currentStep === 4 && bookingData && selectedInspection && (
            <div className={styles.stepWrapper}>
              <PaymentMethods
                selectedMethod={paymentMethod}
                onSelectMethod={setPaymentMethod}
                bookingDetails={{
                  bookingCode: bookingData.code,
                  userName: contactData.fullName,
                  planTitle: selectedInspection.title,
                  totalAmount: selectedInspection.price,
                }}
                onCulqiPayment={handleCulqiPayment}
                onTransferComplete={handleTransferComplete}
              />

              <div className={styles.stepButtons}>
                <button onClick={goBack} className={styles.secondaryButton}>
                  Atrás
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
