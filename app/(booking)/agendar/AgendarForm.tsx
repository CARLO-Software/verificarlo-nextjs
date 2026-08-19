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
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

const DRAFT_KEY = "agendar_draft";
import styles from "./Agendar.module.css";

// Componentes del flujo de reserva
import StepTimeline from "@/app/components/Booking/StepTimeline/StepTimeline";
import PlanSelector from "@/app/components/Booking/PlanSelector/PlanSelector";
import VehicleLocationForm from "@/app/components/Booking/VehicleLocationForm/VehicleLocationForm";
import InspectionSchedule from "@/app/components/Booking/InspectionSchedule/InspectionSchedule";
import PaymentMethods from "@/app/components/Booking/PaymentMethods/PaymentMethods";

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
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // =========================================================================
  // ESTADOS DEL FLUJO
  // =========================================================================

  // Paso actual (1-4)
  const [currentStep, setCurrentStep] = useState<BookingStep>(1);

  // Flag: el usuario volvió del login con draft listo para pagar
  const [pendingPayment, setPendingPayment] = useState(false);

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
    termsAccepted: false,
  });

  // =========================================================================
  // PASO 4: Método de Pago
  // =========================================================================
  const [paymentMethod, setPaymentMethod] = useState<
    "culqi" | "transfer" | "yape" | "whatsapp" | null
  >(null);

  // =========================================================================
  // DATOS DE RESERVA (después de crearla en el backend)
  // =========================================================================
  const [bookingData, setBookingData] = useState<{
    id: number;
    code: string;
    expiresAt: Date;
    amount: number;
  } | null>(null);

  // =========================================================================
  // EFECTO: Restaurar borrador guardado (si el usuario volvió del login)
  // =========================================================================
  useEffect(() => {
    // Evitar ejecutar en SSR
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem(DRAFT_KEY);

    // Si no hay draft, no hacer nada
    if (!raw) return;

    try {
      const draft = JSON.parse(raw);

      // Restaurar todos los datos del formulario
      if (draft.selectedInspectionId) {
        const plan = initialInspections.find(
          (i) => i.id === draft.selectedInspectionId
        );
        if (plan) setSelectedInspection(plan);
      }
      if (draft.vehicleData) setVehicleData(draft.vehicleData);
      if (draft.locationData) setLocationData(draft.locationData);
      if (draft.selectedDate) setSelectedDate(draft.selectedDate);
      if (draft.selectedSlot) setSelectedSlot(draft.selectedSlot);
      if (draft.contactData) setContactData(draft.contactData);
      if (draft.currentStep) {
        console.log("[AgendarForm] Restaurando currentStep:", draft.currentStep);
        setCurrentStep(draft.currentStep);
        if (draft.currentStep === 3) {
          setPendingPayment(true);
        }
      }

      console.log("[AgendarForm] Draft restaurado exitosamente.");
    } catch (e) {
      console.error("[AgendarForm] Error restaurando draft:", e);
      // Solo eliminar si hay error de parsing
      localStorage.removeItem(DRAFT_KEY);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-proceder al pago si el usuario volvió del login con draft en paso 3
  useEffect(() => {
    if (pendingPayment && status === "authenticated" && currentStep === 3 && canProceedStep3) {
      setPendingPayment(false);
      handleProceedToPayment();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPayment, status, currentStep, canProceedStep3]);

  // =========================================================================
  // EFECTO: Pre-seleccionar plan desde parámetro de URL
  // =========================================================================
  // Si el usuario viene desde la landing con ?plan=tipo, pre-seleccionamos
  // El parámetro de URL tiene prioridad sobre el draft porque el usuario
  // explícitamente eligió un plan desde la landing
  useEffect(() => {
    const planType = searchParams.get("plan");
    if (!planType) return;

    const matchingPlan = initialInspections.find((p) => p.type === planType);
    if (matchingPlan) {
      setSelectedInspection(matchingPlan);
      // Limpiar draft para empezar fresco con el plan elegido desde landing
      localStorage.removeItem(DRAFT_KEY);
      // Reset al paso 1 si venía de un draft en otro paso
      setCurrentStep(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // =========================================================================
  // EFECTO: Auto-guardar borrador mientras el usuario llena el formulario
  // =========================================================================
  // Esto asegura que si el usuario navega al login desde cualquier lugar
  // (navbar, etc.), no pierda su progreso.
  useEffect(() => {
    // Solo guardar si hay datos significativos
    const hasData = selectedInspection || vehicleData.brandId || locationData.districtId;

    if (!hasData) return;

    const draftData = {
      currentStep,
      selectedInspectionId: selectedInspection?.id || null,
      vehicleData,
      locationData,
      selectedDate,
      selectedSlot,
      contactData,
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    console.log("[AgendarForm] Auto-guardado draft");
  }, [
    currentStep,
    selectedInspection,
    vehicleData,
    locationData,
    selectedDate,
    selectedSlot,
    contactData,
  ]);

  // =========================================================================
  // EFECTO: Limpiar draft cuando el usuario completa el pago o sale logueado
  // =========================================================================
  useEffect(() => {
    // Si está en paso 4 con booking creado, limpiar el draft
    // (ya no necesitamos restaurar, el booking está en el backend)
    if (currentStep === 4 && bookingData) {
      localStorage.removeItem(DRAFT_KEY);
      console.log("[AgendarForm] Draft eliminado - booking creado");
    }
  }, [currentStep, bookingData]);

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
    contactData.phone.length >= 9 &&
    contactData.termsAccepted;

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

    // Si el usuario aún no está autenticado, guardar el borrador y llevarlo al login.
    // Al volver, el useEffect de arriba restaurará todo automáticamente.
    // Usamos localStorage para que persista después de Google OAuth.
    if (status === "unauthenticated") {
      const draftData = {
        currentStep: 3,
        selectedInspectionId: selectedInspection.id,
        vehicleData,
        locationData,
        selectedDate,
        selectedSlot,
        contactData,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      console.log("[AgendarForm] Draft guardado:", draftData);
      router.push("/login?callbackUrl=/agendar");
      return;
    }

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

  // Pago exitoso (tarjeta o Yape) — redirige a success/pending
  const handlePaymentSuccess = () => {
    // El componente PaymentMethods ya redirige internamente
    // Este handler es para cualquier limpieza adicional
    localStorage.removeItem(DRAFT_KEY);
  };

  const handlePaymentExpired = () => {
    setError(
      "El tiempo para pagar ha expirado. Por favor, inicia una nueva reserva."
    );
    setBookingData(null);
    goToStep(3);
  };

  // Transferencia / WhatsApp registrado (verificación manual)
  const handleAlternativePaymentSuccess = () => {
    localStorage.removeItem(DRAFT_KEY);
    // Redirigir según el rol del usuario
    const userRole = session?.user?.role;
    if (userRole === 'ADMIN') {
      router.push('/admin/inspecciones');
    } else {
      router.push(`/mis-inspecciones?pendingVerification=${bookingData!.id}`);
    }
  };

  // =========================================================================
  // RENDER PRINCIPAL: Layout de Dos Columnas
  // =========================================================================

  return (
    <div className={styles.bookingLayout}>
      {/* ===================================================================
          COLUMNA IZQUIERDA: Imagen (solo visible en desktop)
          =================================================================== */}
      <aside className={styles.sidebarImage}>
        <Image
          src="/assets/images/booking-sidebar.webp"
          alt="Verificarlo - Inspección vehicular"
          className={styles.sidebarImageBg}
          fill
          sizes="(max-width: 1024px) 0vw, 50vw"
          quality={75}
          priority={false}
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
                  planType: selectedInspection.type,
                  totalAmount: bookingData.amount,
                }}
                bookingId={bookingData.id}
                expiresAt={bookingData.expiresAt}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentExpired={handlePaymentExpired}
                onAlternativePaymentSuccess={handleAlternativePaymentSuccess}
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
