"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./Agendar.module.css";

// ============================================
// Helpers de formato
// ============================================

// Formatear placa: ABC123 -> ABC-123
function formatPlate(value: string): string {
  // Remover todo excepto letras y números
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

  // Si tiene más de 3 caracteres, insertar guión después del tercero
  if (clean.length > 3) {
    return clean.slice(0, 3) + "-" + clean.slice(3, 6);
  }
  return clean;
}

// Formatear número con comas: 50000 -> 50,000
function formatNumberWithCommas(value: number | null): string {
  if (value === null) return "";
  return value.toLocaleString("es-PE");
}

// Parsear número quitando comas: 50,000 -> 50000
function parseFormattedNumber(value: string): number | null {
  const clean = value.replace(/[^0-9]/g, "");
  if (clean === "") return null;
  return parseInt(clean, 10);
}

// Components
import StepIndicator, { BookingStep } from "@/app/components/Booking/StepIndicator/StepIndicator";
import BookingCalendar from "@/app/components/Booking/Calendar/BookingCalendar";
import TimeSlots from "@/app/components/Booking/TimeSlots/TimeSlots";
import PaymentForm from "@/app/components/Booking/PaymentForm/PaymentForm";
import Confirmation from "@/app/components/Booking/Confirmation/Confirmation";

// Types
interface Inspection {
  id: number;
  type: string;
  title: string;
  description: string;
  price: number;
  items?: { id: number; label: string }[];
}

interface Brand {
  id: number;
  name: string;
  logo: string;
}

interface Model {
  id: number;
  name: string;
  brandId: number;
  yearFrom: number;
  yearTo: number;
}

interface AgendarFormProps {
  initialInspections: Inspection[];
  initialBrands: Brand[];
}

interface VehicleData {
  id?: number;
  brandId: number | null;
  brandName: string;
  modelId: number | null;
  modelName: string;
  year: number | null;
  plate: string;
  mileage: number | null;
}

interface BookingData {
  id: number;
  expiresAt: Date;
  amount: number;
}

export default function AgendarForm({ initialInspections, initialBrands }: AgendarFormProps) {
  const { status } = useSession();
  const router = useRouter();

  // Estado del flujo
  const [currentStep, setCurrentStep] = useState<BookingStep>("servicio");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datos seleccionados
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [vehicleData, setVehicleData] = useState<VehicleData>({
    brandId: null,
    brandName: "",
    modelId: null,
    modelName: "",
    year: null,
    plate: "",
    mileage: null,
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [confirmationData, setConfirmationData] = useState<any>(null);

  // Modelos disponibles
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // UI state for dropdowns
  const [showBrands, setShowBrands] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [brandQuery, setBrandQuery] = useState("");
  const [modelQuery, setModelQuery] = useState("");

  // Verificar sesión
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/agendar");
    }
  }, [status, router]);

  // Cargar modelos cuando se selecciona marca
  const loadModels = async (brandId: number) => {
    setLoadingModels(true);
    try {
      const res = await fetch(`/api/vehicles/models/${brandId}`);
      const data = await res.json();
      setModels(data);
    } catch (err) {
      console.error("Error loading models:", err);
    } finally {
      setLoadingModels(false);
    }
  };

  // Handlers
  const handleInspectionSelect = (inspection: Inspection) => {
    setSelectedInspection(inspection);
  };

  const handleBrandSelect = (brand: Brand) => {
    setVehicleData((prev) => ({
      ...prev,
      brandId: brand.id,
      brandName: brand.name,
      modelId: null,
      modelName: "",
    }));
    setBrandQuery(brand.name);
    setShowBrands(false);
    loadModels(brand.id);
  };

  const handleModelSelect = (model: Model) => {
    setVehicleData((prev) => ({
      ...prev,
      modelId: model.id,
      modelName: model.name,
      year: null, // Resetear año al cambiar modelo
    }));
    setModelQuery(model.name);
    setShowModels(false);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null); // Reset slot when date changes
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
  };

  // Validaciones
  const canProceedToVehicle = selectedInspection !== null;

  const canProceedToDate =
    vehicleData.brandId !== null &&
    vehicleData.modelId !== null &&
    vehicleData.year !== null;

  const canProceedToPayment = selectedDate !== null && selectedSlot !== null;

  //* Crear reserva y proceder al pago
  const handleProceedToPayment = async () => {
    if (!canProceedToPayment || !selectedInspection) return;

    setLoading(true);
    setError(null);

    try {
      // Primero crear o obtener el vehículo
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
      console.log("ANTES DE CREAR LA RESERVA:");
      console.log("date: " + selectedDate);
      console.log("timeSlot:" + selectedSlot);
      console.log("inspectionId:" + selectedInspection.id);
      console.log("vehicleId: " + vehicleResult.id);

      // Crear la reserva
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          timeSlot: selectedSlot,
          inspectionPlanId: selectedInspection.id,
          vehicleId: vehicleResult.id,
        }),
      });

      const bookingResult = await bookingRes.json();

      if (!bookingRes.ok) {
        throw new Error(bookingResult.error || "Error creando reserva");
      }

      setBookingData({
        id: bookingResult.bookingId,
        expiresAt: new Date(bookingResult.expiresAt),
        amount: bookingResult.amount,
      });

      setVehicleData((prev) => ({ ...prev, id: vehicleResult.id }));
      setCurrentStep("pago");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Pago exitoso
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePaymentSuccess = (data: any) => {
    setConfirmationData(data.booking);
    setCurrentStep("confirmado");
  };

  // Pago expirado
  const handlePaymentExpired = () => {
    setError("El tiempo para pagar ha expirado. Por favor, inicia una nueva reserva.");
    setBookingData(null);
    setCurrentStep("fecha");
  };

  // Navegación entre pasos
  const goToStep = (step: BookingStep) => {
    setError(null);
    //*Esto es crucial para pasar a la siguiente ventana
    setCurrentStep(step);
  };

  // Filtrar marcas
  const filteredBrands = initialBrands.filter((b) =>
    b.name.toLowerCase().includes(brandQuery.toLowerCase())
  );

  // Filtrar modelos
  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(modelQuery.toLowerCase())
  );

  // Generar años disponibles basados en el modelo seleccionado
  const getAvailableYears = () => {
    const selectedModel = models.find((m) => m.id === vehicleData.modelId);
    if (!selectedModel) return [];

    const years = [];
    for (let y = selectedModel.yearTo; y >= selectedModel.yearFrom; y--) {
      years.push(y);
    }
    return years;
  };

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

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Agenda tu inspección</h1>
          <p className={styles.subtitle}>
            Completa los siguientes pasos para reservar tu cita
          </p>
        </div>

        {/* Step Indicator */}
        {currentStep !== "confirmado" && (
          <StepIndicator currentStep={currentStep} />
        )}

        {/* Error global */}
        {error && (
          <div className={styles.errorBanner}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M10 6v5M10 13.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Step 1: Seleccionar servicio */}
        {currentStep === "servicio" && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>¿Qué tipo de inspección necesitas?</h2>

            <div className={styles.inspectionList}>
              {initialInspections.map((inspection) => (
                <div
                  key={inspection.id}
                  onClick={() => handleInspectionSelect(inspection)}
                  className={`${styles.inspectionCard} ${selectedInspection?.id === inspection.id ? styles.inspectionCardSelected : ""
                    }`}
                >
                  <div className={styles.inspectionRadio}>
                    <div className={`${styles.radioCircle} ${selectedInspection?.id === inspection.id ? styles.radioCircleSelected : ""
                      }`}>
                      {selectedInspection?.id === inspection.id && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className={styles.inspectionInfo}>
                    <h3 className={styles.inspectionTitle}>{inspection.title}</h3>
                    <p className={styles.inspectionDescription}>{inspection.description}</p>
                    {inspection.items && inspection.items.length > 0 && (
                      <ul className={styles.inspectionItems}>
                        {inspection.items.slice(0, 4).map((item) => (
                          <li key={item.id}>{item.label}</li>
                        ))}
                        {inspection.items.length > 4 && (
                          <li className={styles.moreItems}>
                            +{inspection.items.length - 4} más
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  <div className={styles.inspectionPrice}>
                    <span className={styles.priceLabel}>Precio</span>
                    <span className={styles.priceValue}>S/ {inspection.price}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.stepActions}>
              <button
                onClick={() => goToStep("vehiculo")}
                disabled={!canProceedToVehicle}
                className={styles.primaryButton}
              >
                Continuar
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Datos del vehículo */}
        {currentStep === "vehiculo" && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Datos de tu vehículo</h2>

            <div className={styles.formGrid}>
              {/* Marca */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Marca <span className={styles.required}>*</span>
                </label>
                <div className={styles.dropdownContainer}>
                  <input
                    type="text"
                    value={brandQuery}
                    onChange={(e) => {
                      setBrandQuery(e.target.value);
                      setShowBrands(true);
                    }}
                    onFocus={() => setShowBrands(true)}
                    placeholder="Buscar marca..."
                    className={styles.input}
                  />
                  {showBrands && filteredBrands.length > 0 && (
                    <div className={styles.dropdown}>
                      {filteredBrands.map((brand) => (
                        <div
                          key={brand.id}
                          onClick={() => handleBrandSelect(brand)}
                          className={styles.dropdownItem}
                        >
                          <img src={brand.logo} alt={brand.name} className={styles.brandLogo} />
                          <span>{brand.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modelo */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Modelo <span className={styles.required}>*</span>
                </label>
                <div className={styles.dropdownContainer}>
                  <input
                    type="text"
                    value={modelQuery}
                    onChange={(e) => {
                      setModelQuery(e.target.value);
                      setShowModels(true);
                    }}
                    onFocus={() => setShowModels(true)}
                    placeholder={loadingModels ? "Cargando..." : "Buscar modelo..."}
                    disabled={!vehicleData.brandId || loadingModels}
                    className={styles.input}
                  />
                  {showModels && filteredModels.length > 0 && (
                    <div className={styles.dropdown}>
                      {filteredModels.map((model) => (
                        <div
                          key={model.id}
                          onClick={() => handleModelSelect(model)}
                          className={styles.dropdownItem}
                        >
                          <span>{model.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Año */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Año <span className={styles.required}>*</span>
                </label>
                <select
                  value={vehicleData.year || ""}
                  onChange={(e) =>
                    setVehicleData((prev) => ({ ...prev, year: Number(e.target.value) }))
                  }
                  disabled={!vehicleData.modelId}
                  className={styles.select}
                >
                  <option value="">Seleccionar año</option>
                  {getAvailableYears().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Placa */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Placa (opcional)</label>
                <input
                  type="text"
                  value={vehicleData.plate}
                  onChange={(e) =>
                    setVehicleData((prev) => ({
                      ...prev,
                      plate: formatPlate(e.target.value),
                    }))
                  }
                  placeholder="ABC-123"
                  maxLength={7}
                  className={styles.input}
                />
              </div>

              {/* Kilometraje */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Kilometraje (opcional)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberWithCommas(vehicleData.mileage)}
                  onChange={(e) =>
                    setVehicleData((prev) => ({
                      ...prev,
                      mileage: parseFormattedNumber(e.target.value),
                    }))
                  }
                  placeholder="Ej: 50,000"
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.stepActions}>
              <button onClick={() => goToStep("servicio")} className={styles.secondaryButton}>
                Atrás
              </button>
              <button
                onClick={() => goToStep("fecha")}
                disabled={!canProceedToDate}
                className={styles.primaryButton}
              >
                Continuar
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Fecha y hora */}
        {currentStep === "fecha" && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Selecciona fecha y hora</h2>

            <div className={styles.dateTimeGrid}>
              {/**La fecha seleccionada en el handleDateSelect se asigna a selectedDate desde el hijo (BookingCalendar) => esa funcion y valor obtenido de esa funcion se van al BookingCalendar */}
              <BookingCalendar
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
              />

              {selectedDate && (
                <TimeSlots
                  date={selectedDate}
                  onSlotSelect={handleSlotSelect}
                  selectedSlot={selectedSlot}
                />
              )}
            </div>

            <div className={styles.stepActions}>
              <button onClick={() => goToStep("vehiculo")} className={styles.secondaryButton}>
                Atrás
              </button>
              <button
                onClick={handleProceedToPayment}
                disabled={!canProceedToPayment || loading}
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
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Pago */}
        {currentStep === "pago" && bookingData && selectedInspection && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Completa tu pago</h2>

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
              onBack={() => goToStep("fecha")}
              onExpired={handlePaymentExpired}
            />
          </div>
        )}

        {/* Step 5: Confirmación */}
        {currentStep === "confirmado" && confirmationData && (
          <Confirmation booking={confirmationData} />
        )}
      </div>
    </div>
  );
}
