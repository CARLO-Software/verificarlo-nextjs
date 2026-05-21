"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./InspectionForm.module.css";
import { InspectionChecklist } from "./components";
import { type InspectionResults } from "./inspectionData";
import { type Photo } from "./components/ItemPhotoCapture/ItemPhotoCapture";
import { useToast } from "@/app/components/Toast";
import type { JsonValue } from "@prisma/client/runtime/library";

type ResultStatus = "PENDING" | "OK" | "WARNING" | "CRITICAL";

type MechanicalVerdict = "PENDING" | "APROBADO" | "OBSERVADO" | "NO_APROBADO";

interface Report {
  id: number;
  legalStatus: ResultStatus;
  legalScore: number | null;
  legalObservations: JsonValue;
  mechanicalStatus: ResultStatus;
  mechanicalScore: number | null;
  mechanicalObservations: JsonValue;
  bodyStatus: ResultStatus;
  bodyScore: number | null;
  bodyObservations: JsonValue;
  interiorStatus?: ResultStatus;
  interiorScore?: number | null;
  interiorObservations?: JsonValue;
  checklistResults?: InspectionResults;
  mileageAtInspection: number | null;
  ownershipCardVerified: boolean;
  soatValid: boolean;
  soatExpiryDate: string | null;
  technicalReviewValid: boolean;
  technicalReviewExpiryDate: string | null;
  executiveSummary: string | null;
  estimatedRepairCost: number | null;
  overallScore: number | null;
  overallStatus: ResultStatus;
  completedAt: string | null;
  photos: Photo[];
  // Nuevos campos para el veredicto del mecánico
  mechanicalVerdict?: MechanicalVerdict;
  hasSiniestro?: boolean;
  hasKilometrajeAdulterado?: boolean;
}

interface VehicleInspectionData {
  id: number;
  plate: string | null;
  legalStatus: 'BLOQUEADO' | 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO';
  mechanicalStatus: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO';
}

interface InspectionData {
  id: number;
  code: string;
  status: string;
  date: string;
  timeSlot: string;
  client: {
    id: string;
    name: string;
    phone: string | null;
    email: string;
  };
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plate: string | null;
    mileage: number | null;
  };
  inspectionPlan: {
    id: number;
    type: string;
    title: string;
    items: string[];
    price: number;
  };
  report: Report | null;
  vehicleInspection: VehicleInspectionData | null;
}

interface InspectionFormClientProps {
  inspection: InspectionData;
}

type Section = "info" | "checklist" | "summary";

export function InspectionFormClient({ inspection }: InspectionFormClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<Section>("info");
  const [report, setReport] = useState<Report | null>(inspection.report);
  const [error, setError] = useState<string | null>(null);

  // Estado local para la placa (para re-render cuando se registra)
  const [vehiclePlate, setVehiclePlate] = useState<string | null>(inspection.vehicle.plate);

  // Estado elevado para la sección de Resumen (para que persista entre cambios de sección)
  const [summaryData, setSummaryData] = useState({
    summary: inspection.report?.executiveSummary || "",
    repairCost: inspection.report?.estimatedRepairCost?.toString() || "",
    mileage: inspection.report?.mileageAtInspection?.toString() || "",
    verdict: (inspection.report?.mechanicalVerdict || "PENDING") as MechanicalVerdict,
    hasSiniestro: inspection.report?.hasSiniestro || false,
    hasKilometrajeAdulterado: inspection.report?.hasKilometrajeAdulterado || false,
  });

  // Estado para fotos agrupadas por checklistItemId
  const [photosByItem, setPhotosByItem] = useState<Record<string, Photo[]>>(() => {
    // Inicializar desde las fotos del reporte
    const grouped: Record<string, Photo[]> = {};
    if (inspection.report?.photos) {
      inspection.report.photos.forEach((photo) => {
        if (photo.checklistItemId) {
          if (!grouped[photo.checklistItemId]) {
            grouped[photo.checklistItemId] = [];
          }
          grouped[photo.checklistItemId].push(photo);
        }
      });
    }
    return grouped;
  });

  const isCompleted = report !== null && report.completedAt !== null;

  // Manejar foto agregada
  const handlePhotoAdded = (photo: Photo) => {
    if (!photo.checklistItemId) return;

    setPhotosByItem((prev) => {
      const itemPhotos = prev[photo.checklistItemId!] || [];
      return {
        ...prev,
        [photo.checklistItemId!]: [...itemPhotos, photo],
      };
    });
  };

  // Manejar foto eliminada
  const handlePhotoDeleted = (photoId: number) => {
    setPhotosByItem((prev) => {
      const newState: Record<string, Photo[]> = {};
      Object.entries(prev).forEach(([itemId, photos]) => {
        const filtered = photos.filter((p) => p.id !== photoId);
        if (filtered.length > 0) {
          newState[itemId] = filtered;
        }
      });
      return newState;
    });
  };

  // Ref para evitar múltiples llamadas simultáneas
  const creatingReportRef = useRef(false);

  // Crear informe si no existe
  useEffect(() => {
    const createReportIfNeeded = async () => {
      if (!report && !isCompleted && !creatingReportRef.current) {
        creatingReportRef.current = true;
        try {
          const res = await fetch(`/api/bookings/${inspection.id}/report`, {
            method: "POST",
          });
          const data = await res.json();
          if (data.success) {
            setReport({
              ...data.report,
              photos: [],
            });
          }
        } catch {
          setError("Error al crear el informe");
        } finally {
          creatingReportRef.current = false;
        }
      }
    };
    createReportIfNeeded();
  }, [report, isCompleted, inspection.id]);

  const sections: { id: Section; label: string; icon: JSX.Element }[] = [
    {
      id: "info",
      label: "Información",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M10 9v4M10 7v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "checklist",
      label: "Inspección",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M6 3h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" />
          <path d="M7 8l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "summary",
      label: "Resumen",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
  ];

  const getSectionStatus = (section: Section): "pending" | "complete" | "active" => {
    if (activeSection === section) return "active";
    if (!report) return "pending";

    switch (section) {
      case "info":
        return report.mileageAtInspection ? "complete" : "pending";
      case "checklist":
        // Verificar si hay algún resultado en el checklist
        const hasResults = report.checklistResults && Object.keys(report.checklistResults).length > 0;
        return hasResults ? "complete" : "pending";
      case "summary":
        return report.executiveSummary ? "complete" : "pending";
      default:
        return "pending";
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/inspector" className={styles.backLink}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver
        </Link>
        <div className={styles.headerInfo}>
          <h1 className={styles.headerTitle}>{inspection.code}</h1>
          <p className={styles.headerSubtitle}>
            {inspection.vehicle.brand} {inspection.vehicle.model} {inspection.vehicle.year}
            {vehiclePlate && ` • ${vehiclePlate}`}
          </p>
        </div>
        {isCompleted && (
          <span className={styles.completedBadge}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 8l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Completado
          </span>
        )}
      </header>

      {/* Navigation */}
      <nav className={styles.nav}>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`${styles.navItem} ${styles[`navItem--${getSectionStatus(section.id)}`]}`}
          >
            {section.icon}
            <span>{section.label}</span>
            {getSectionStatus(section.id) === "complete" && (
              <svg className={styles.navCheck} width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ))}
      </nav>

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        {activeSection === "info" && (
          <InfoSection
            inspection={inspection}
            vehiclePlate={vehiclePlate}
            report={report}
            onUpdate={(data) => setReport((prev) => prev ? { ...prev, ...data } : prev)}
            disabled={isCompleted}
            onPlateRegistered={(plate) => {
              // Actualizar estado local para re-render
              setVehiclePlate(plate);
            }}
          />
        )}
        {activeSection === "checklist" && (
          report ? (
            <ChecklistSection
              reportId={report.id}
              initialResults={report.checklistResults || {}}
              onUpdate={(results) => setReport((prev) => prev ? { ...prev, checklistResults: results } : prev)}
              disabled={isCompleted}
              photosByItem={photosByItem}
              onPhotoAdded={handlePhotoAdded}
              onPhotoDeleted={handlePhotoDeleted}
            />
          ) : (
            <div style={{ padding: 20, textAlign: "center" }}>
              <p>Cargando checklist...</p>
            </div>
          )
        )}
        {activeSection === "summary" && report && (
          <SummarySection
            report={report}
            onUpdate={(data) => setReport((prev) => prev ? { ...prev, ...data } : prev)}
            onComplete={() => {
              // Actualizar estado local para deshabilitar inmediatamente
              setReport((prev) => prev ? { ...prev, completedAt: new Date().toISOString() } : prev);
              showToast("Inspección completada exitosamente", "success");
              router.refresh();
            }}
            disabled={isCompleted}
            vehiclePlate={vehiclePlate}
            summaryData={summaryData}
            onSummaryDataChange={setSummaryData}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// Info Section
// ============================================
function InfoSection({
  inspection,
  vehiclePlate,
  report,
  onUpdate,
  disabled,
  onPlateRegistered,
}: {
  inspection: InspectionData;
  vehiclePlate: string | null;
  report: Report | null;
  onUpdate: (data: Partial<Report>) => void;
  disabled: boolean;
  onPlateRegistered: (plate: string) => void;
}) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  // Estado para registro de placa
  const [plateInput, setPlateInput] = useState("");
  const [plateError, setPlateError] = useState("");
  const [savingPlate, setSavingPlate] = useState(false);
  // Usar el prop vehiclePlate (estado del padre) para determinar si hay placa
  const hasPlate = !!vehiclePlate;
  const canRegisterPlate = !hasPlate && inspection.vehicleInspection;
  const isLegalBlocked = inspection.vehicleInspection?.legalStatus === 'BLOQUEADO';

  // Validación formato placa peruana: 3 letras + guión opcional + 3 números
  const validatePlateFormat = (plate: string): boolean => {
    const cleanPlate = plate.replace(/-/g, "").toUpperCase();
    const plateRegex = /^[A-Z]{3}[0-9]{3}$/;
    return plateRegex.test(cleanPlate);
  };

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();

    // Remover caracteres no válidos (solo letras, números y guión)
    value = value.replace(/[^A-Z0-9-]/g, "");

    // Remover guiones para procesar
    const clean = value.replace(/-/g, "");

    // Formatear automáticamente: XXX-XXX
    if (clean.length <= 3) {
      value = clean;
    } else {
      value = clean.slice(0, 3) + "-" + clean.slice(3, 6);
    }

    setPlateInput(value);

    // Solo validar si hay algo escrito
    if (value.trim()) {
      if (!validatePlateFormat(value)) {
        setPlateError("Formato inválido. Usa 3 letras y 3 números (Ej: ABC-123)");
      } else {
        setPlateError("");
      }
    } else {
      setPlateError("");
    }
  };

  // Registrar placa en VehicleInspection
  const handleRegisterPlate = async () => {
    if (!plateInput.trim() || !inspection.vehicleInspection) return;

    // Validar formato antes de enviar
    if (!validatePlateFormat(plateInput)) {
      setPlateError("Formato inválido. Usa 3 letras y 3 números (Ej: ABC-123)");
      return;
    }

    setSavingPlate(true);
    try {
      const res = await fetch(`/api/vehicle-inspections/${inspection.vehicleInspection.id}/mechanic`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register_plate",
          plate: plateInput.trim().toUpperCase(),
        }),
      });

      if (res.ok) {
        const normalizedPlate = plateInput.trim().toUpperCase();
        onPlateRegistered(normalizedPlate);
        setPlateInput("");
        showToast("Placa registrada correctamente. El equipo legal ha sido notificado.", "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Error al registrar placa", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error al registrar placa", "error");
    } finally {
      setSavingPlate(false);
    }
  };

  const handleSave = async () => {
    if (!report) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/reports/${report.id}/sections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "vehicle",
          data: {
            mileageAtInspection: inspection.vehicle.mileage,
          },
        }),
      });

      if (res.ok) {
        onUpdate({
          mileageAtInspection: inspection.vehicle.mileage,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    // Extraer fecha del ISO string y usar mediodía UTC para evitar cambio de día
    const datePart = dateStr.split("T")[0];
    const date = new Date(datePart + "T12:00:00Z");
    return date.toLocaleDateString("es-PE", {
      timeZone: "America/Lima",
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatMileage = (value: number | null) => {
    if (!value) return "No especificado";
    return value.toLocaleString("es-PE") + " km";
  };

  return (
    <div className={styles.section}>
      {/* PRIMERO: Formulario de registro de placa (cuando no hay placa) */}
      {canRegisterPlate && (
        <div className={styles.plateRegisterCardTop}>
          <div className={styles.plateRegisterHeader}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
              <circle cx="6" cy="12" r="1.5" fill="currentColor" />
              <circle cx="18" cy="12" r="1.5" fill="currentColor" />
            </svg>
            <div>
              <h3 className={styles.plateRegisterTitle}>Registrar Placa del Vehículo</h3>
              <p className={styles.plateRegisterSubtitle}>
                {isLegalBlocked
                  ? "El equipo legal está esperando la placa para iniciar la revisión"
                  : "El cliente no ingresó la placa. Regístrala para notificar al administrador"}
              </p>
            </div>
          </div>
          <div className={styles.plateRegisterForm}>
            <div className={styles.plateInputWrapper}>
              <input
                type="text"
                value={plateInput}
                onChange={handlePlateChange}
                placeholder="Ej: ABC-123"
                maxLength={7}
                className={`${styles.plateInput} ${plateError ? styles.plateInputError : ""}`}
                disabled={savingPlate}
              />
              {plateError && (
                <span className={styles.plateErrorText}>{plateError}</span>
              )}
            </div>
            <button
              onClick={handleRegisterPlate}
              disabled={!plateInput.trim() || !!plateError || savingPlate}
              className={styles.plateRegisterButton}
            >
              {savingPlate ? (
                <>
                  <span className={styles.spinner} />
                  Registrando...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M15 4.5L6.75 12.75L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Registrar Placa
                </>
              )}
            </button>
          </div>
          {isLegalBlocked && (
            <span className={styles.legalBlockedBadgeInline}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L1 4v4.5c0 4 3 6.5 7 7.5 4-1 7-3.5 7-7.5V4L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Revisión legal bloqueada hasta registrar placa
            </span>
          )}
        </div>
      )}

      {/* Datos ingresados por el cliente */}
      <h2 className={styles.sectionTitle}>Datos de la Reserva</h2>
      <p className={styles.sectionSubtitle}>Información proporcionada por el cliente</p>

      <div className={styles.infoGrid}>
        {/* Vehículo - Datos del cliente */}
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Vehículo</h3>
          <p className={styles.infoCardValue}>
            {inspection.vehicle.brand} {inspection.vehicle.model}
          </p>
          <p className={styles.infoCardSubvalue}>Año: {inspection.vehicle.year}</p>
        </div>

        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Placa</h3>
          {hasPlate ? (
            <p className={styles.infoCardValue}>{vehiclePlate}</p>
          ) : (
            <p className={styles.infoCardValueMuted}>No especificada por cliente</p>
          )}
        </div>

        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Kilometraje</h3>
          <p className={styles.infoCardValue}>{formatMileage(inspection.vehicle.mileage)}</p>
          <p className={styles.infoCardSubvalue}>Declarado por cliente</p>
        </div>

        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Tipo de Inspección</h3>
          <p className={styles.infoCardValue}>{inspection.inspectionPlan.title}</p>
        </div>
      </div>

      {/* Datos de la cita */}
      <div className={styles.infoGrid} style={{ marginTop: "16px" }}>
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Cliente</h3>
          <p className={styles.infoCardValue}>{inspection.client.name}</p>
          {inspection.client.phone && (
            <a href={`tel:${inspection.client.phone}`} className={styles.infoCardLink}>
              {inspection.client.phone}
            </a>
          )}
        </div>
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Fecha y Hora</h3>
          <p className={styles.infoCardValue}>{formatDate(inspection.date)}</p>
          <p className={styles.infoCardSubvalue}>{formatTime(inspection.timeSlot)}</p>
        </div>
      </div>

      {/* Items del plan */}
      <div className={styles.planItems}>
        <h3 className={styles.planItemsTitle}>Puntos a revisar</h3>
        <ul className={styles.planItemsList}>
          {inspection.inspectionPlan.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

    </div>
  );
}

// ============================================
// Checklist Section - Nuevo sistema de inspección
// ============================================
function ChecklistSection({
  reportId,
  initialResults,
  onUpdate,
  disabled,
  photosByItem,
  onPhotoAdded,
  onPhotoDeleted,
}: {
  reportId: number;
  initialResults: InspectionResults;
  onUpdate: (results: InspectionResults) => void;
  disabled: boolean;
  photosByItem: Record<string, Photo[]>;
  onPhotoAdded: (photo: Photo) => void;
  onPhotoDeleted: (photoId: number) => void;
}) {
  const handleSave = async (results: InspectionResults) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/sections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "checklist",
          data: { checklistResults: results },
        }),
      });

      if (res.ok) {
        onUpdate(results);
      }
    } catch (err) {
      console.error("Error al guardar checklist:", err);
    }
  };

  return (
    <InspectionChecklist
      initialResults={initialResults}
      disabled={disabled}
      onSave={handleSave}
      reportId={reportId}
      photosByItem={photosByItem}
      onPhotoAdded={onPhotoAdded}
      onPhotoDeleted={onPhotoDeleted}
    />
  );
}

// ============================================
// Summary Section
// ============================================
import { calculateScoreByCategory, calculateOverallScore, INSPECTION_CATEGORIES } from "./inspectionData";

// Hook para reconocimiento de voz con texto interim en tiempo real
function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Verificar soporte del navegador
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "es-PE";
      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = (onResult: (text: string) => void) => {
    if (!recognitionRef.current || isListening) return;

    setInterimText("");

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // Resultado final - agregar al texto
          if (transcript.trim()) {
            onResult(transcript.trim());
          }
          setInterimText("");
        } else {
          // Resultado interim - mostrar mientras habla
          interim += transcript;
        }
      }
      if (interim) {
        setInterimText(interim);
      }
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Error de reconocimiento de voz:", event.error);
      // Si es error de "no-speech", reintentar automáticamente
      if (event.error === "no-speech" && isListening) {
        try {
          recognitionRef.current?.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
      setInterimText("");
    };

    recognitionRef.current.onend = () => {
      // Si aún está en modo escucha, reiniciar (Chrome cierra después de ~5s de silencio)
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
      setInterimText("");
    };

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error("Error iniciando reconocimiento:", err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimText("");
    }
  };

  return { isListening, isSupported, interimText, startListening, stopListening };
}

// Componente de textarea con micrófono y texto interim en tiempo real
function VoiceTextarea({
  value,
  onChange,
  placeholder,
  disabled,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
  label: string;
}) {
  const { isListening, isSupported, interimText, startListening, stopListening } = useSpeechRecognition();

  const handleVoiceClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((text) => {
        onChange(value ? `${value} ${text}` : text);
      });
    }
  };

  return (
    <div className={styles.formGroup}>
      <label className={styles.label}>{label}</label>
      <div className={styles.voiceInputWrapper}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={styles.textareaWithVoice}
          rows={4}
          disabled={disabled}
        />
        {isSupported && !disabled && (
          <button
            type="button"
            onClick={handleVoiceClick}
            className={`${styles.voiceButton} ${isListening ? styles["voiceButton--recording"] : ""}`}
            title={isListening ? "Detener grabación" : "Dictar con voz"}
          >
            {isListening ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="6" y="6" width="8" height="8" rx="1" fill="currentColor" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" fill="currentColor" />
                <path d="M5 9a5 5 0 0 0 10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M10 14v4M7 18h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
        )}
      </div>
      {isListening && (
        <div className={`${styles.voiceStatusHint} ${styles["voiceStatusHint--recording"]}`}>
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <circle cx="4" cy="4" r="4" fill="currentColor" />
          </svg>
          {interimText ? (
            <span>Detectando: <em style={{ fontStyle: 'italic', opacity: 0.8 }}>{interimText}</em></span>
          ) : (
            "Escuchando... Habla ahora"
          )}
        </div>
      )}
      {!isSupported && !disabled && (
        <div className={styles.voiceNotSupported}>
          Tu navegador no soporta reconocimiento de voz
        </div>
      )}
    </div>
  );
}

interface SummaryDataState {
  summary: string;
  repairCost: string;
  mileage: string;
  verdict: MechanicalVerdict;
  hasSiniestro: boolean;
  hasKilometrajeAdulterado: boolean;
}

function SummarySection({
  report,
  onUpdate,
  onComplete,
  disabled,
  vehiclePlate,
  summaryData,
  onSummaryDataChange,
}: {
  report: Report;
  onUpdate: (data: Partial<Report>) => void;
  onComplete: () => void;
  disabled: boolean;
  vehiclePlate: string | null;
  summaryData: SummaryDataState;
  onSummaryDataChange: (data: SummaryDataState) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlateModal, setShowPlateModal] = useState(false);

  // Usar valores del estado elevado
  const { summary, repairCost, mileage, verdict, hasSiniestro, hasKilometrajeAdulterado } = summaryData;

  // Funciones para actualizar el estado elevado
  const setSummary = (value: string) => onSummaryDataChange({ ...summaryData, summary: value });
  const setRepairCost = (value: string) => onSummaryDataChange({ ...summaryData, repairCost: value });
  const setMileage = (value: string) => onSummaryDataChange({ ...summaryData, mileage: value });
  const setVerdict = (value: MechanicalVerdict) => onSummaryDataChange({ ...summaryData, verdict: value });
  const setHasSiniestro = (value: boolean) => onSummaryDataChange({ ...summaryData, hasSiniestro: value });
  const setHasKilometrajeAdulterado = (value: boolean) => onSummaryDataChange({ ...summaryData, hasKilometrajeAdulterado: value });

  // Si hay siniestro o kilometraje adulterado, el veredicto es automáticamente NO_APROBADO
  const autoReject = hasSiniestro || hasKilometrajeAdulterado;
  const effectiveVerdict = autoReject ? "NO_APROBADO" : verdict;

  // Calcular scores desde checklistResults
  const checklistResults = report.checklistResults || {};
  const scoresByCategory = calculateScoreByCategory(checklistResults);
  const overallResult = calculateOverallScore(checklistResults);

  // Verificar qué categorías faltan completar
  const incompleteCategories = INSPECTION_CATEGORIES.filter(
    cat => !scoresByCategory[cat.id] || scoresByCategory[cat.id].completed === 0
  );
  const allCategoriesStarted = incompleteCategories.length === 0;
  // Ahora también requiere que se seleccione un veredicto
  const canComplete = allCategoriesStarted && overallResult.status !== "PENDING" && effectiveVerdict !== "PENDING";

  // Configuración de veredictos
  const verdictOptions: { value: MechanicalVerdict; label: string; description: string; icon: string }[] = [
    {
      value: "APROBADO",
      label: "APROBADO",
      description: "El vehículo está en óptimas condiciones, es una buena oportunidad de compra.",
      icon: "✓",
    },
    {
      value: "OBSERVADO",
      label: "OBSERVADO",
      description: "Se encontraron defectos menores en el vehículo. Se sugiere negociar el precio con el vendedor.",
      icon: "!",
    },
    {
      value: "NO_APROBADO",
      label: "NO APROBADO",
      description: "El vehículo ha tenido un siniestro o el vehículo tiene el kilometraje adulterado. No se recomienda comprarlo.",
      icon: "✕",
    },
  ];

  const handleSaveSummary = async () => {
    setSaving(true);
    try {
      await fetch(`/api/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          executiveSummary: summary || null,
          estimatedRepairCost: repairCost ? parseFloat(repairCost) : null,
        }),
      });

      onUpdate({
        executiveSummary: summary || null,
        estimatedRepairCost: repairCost ? parseFloat(repairCost) : null,
      });
    } catch (error) {
      console.error("Error al guardar resumen:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    // Validar que la placa esté registrada
    if (!vehiclePlate) {
      setShowPlateModal(true);
      return;
    }

    if (!canComplete) {
      if (incompleteCategories.length > 0) {
        const names = incompleteCategories.map(c => c.title).join(", ");
        setError(`Falta completar: ${names}`);
      } else if (effectiveVerdict === "PENDING") {
        setError("Debes seleccionar un veredicto antes de finalizar");
      } else {
        setError("Debe completar todas las secciones antes de finalizar");
      }
      return;
    }

    setCompleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/reports/${report.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mechanicalVerdict: effectiveVerdict,
          hasSiniestro,
          hasKilometrajeAdulterado,
          executiveSummary: summary || null,
          estimatedRepairCost: repairCost ? parseFloat(repairCost) : null,
          mileageAtInspection: mileage ? parseInt(mileage) : null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onComplete();
      } else {
        setError(data.error || "Error al finalizar el informe");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setCompleting(false);
    }
  };

  const getStatusLabel = (status: ResultStatus) => {
    const labels: Record<ResultStatus, { text: string; color: string }> = {
      PENDING: { text: "Pendiente", color: "#9CA3AF" },
      OK: { text: "Aprobado", color: "#22C55E" },
      WARNING: { text: "Observaciones", color: "#F59E0B" },
      CRITICAL: { text: "Crítico", color: "#EF4444" },
    };
    return labels[status];
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Resumen de la Inspección</h2>

      {/* Puntaje general */}
      <div className={styles.overallScore}>
        <div className={styles.overallScoreCircle} data-status={overallResult.status}>
          <span className={styles.overallScoreValue}>{overallResult.score}</span>
          <span className={styles.overallScoreLabel}>/ 100</span>
        </div>
        <div className={styles.overallScoreInfo}>
          <span
            className={styles.overallScoreStatus}
            style={{ color: getStatusLabel(overallResult.status).color }}
          >
            {getStatusLabel(overallResult.status).text}
          </span>
          <span className={styles.overallScoreHint}>
            {overallResult.status === "PENDING" && "Completa el checklist para ver el resultado"}
            {overallResult.status === "OK" && "El vehículo está en buen estado"}
            {overallResult.status === "WARNING" && "El vehículo tiene observaciones menores"}
            {overallResult.status === "CRITICAL" && "El vehículo tiene defectos importantes"}
          </span>
        </div>
      </div>

      {/* Resultados por categoría */}
      <div className={styles.resultsGrid}>
        {INSPECTION_CATEGORIES.map(category => {
          const catScore = scoresByCategory[category.id];
          return (
            <div key={category.id} className={styles.resultCard} data-status={catScore?.status}>
              <div className={styles.resultCardHeader}>
                <span className={styles.resultLabel}>{category.title}</span>
                <span className={styles.resultProgress}>
                  {catScore?.completed || 0}/{catScore?.total || 0}
                </span>
              </div>
              <div className={styles.resultCardBody}>
                <span
                  className={styles.resultValue}
                  style={{ color: getStatusLabel(catScore?.status || "PENDING").color }}
                >
                  {getStatusLabel(catScore?.status || "PENDING").text}
                </span>
                {catScore?.status !== "PENDING" && (
                  <span className={styles.resultScore}>{catScore?.score}/100</span>
                )}
              </div>
              {/* Mini desglose */}
              {catScore && catScore.completed > 0 && (
                <div className={styles.resultBreakdown}>
                  {catScore.ok > 0 && <span className={styles.resultOk}>{catScore.ok} OK</span>}
                  {catScore.observaciones > 0 && <span className={styles.resultWarning}>{catScore.observaciones} Obs</span>}
                  {catScore.defectos > 0 && <span className={styles.resultCritical}>{catScore.defectos} Def</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Kilometraje real */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Kilometraje del vehículo (km)</label>
        <input
          type="number"
          value={mileage}
          onChange={(e) => setMileage(e.target.value)}
          placeholder="Ingresa el kilometraje real del tablero"
          className={styles.input}
          disabled={disabled}
        />
        <span className={styles.fieldHint}>Kilometraje real observado en el tablero del vehículo</span>
      </div>

      {/* Resumen ejecutivo con micrófono */}
      <VoiceTextarea
        value={summary}
        onChange={setSummary}
        placeholder="Resumen general de la inspección. Puedes dictar con el micrófono..."
        disabled={disabled}
        label="Resumen ejecutivo"
      />

      {/* Costo estimado */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Costo estimado de reparaciones (S/)</label>
        <input
          type="number"
          value={repairCost}
          onChange={(e) => setRepairCost(e.target.value)}
          placeholder="0.00"
          className={styles.input}
          disabled={disabled}
        />
      </div>

      {/* Selector de Veredicto */}
      {!disabled && (
        <div className={styles.verdictSection}>
          <h3 className={styles.verdictTitle}>Veredicto Final</h3>
          <p className={styles.verdictSubtitle}>
            Selecciona la recomendación para el cliente
          </p>

          {/* Checkboxes de hallazgos críticos */}
          <div className={styles.criticalFindings}>
            <h4 className={styles.criticalFindingsTitle}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5L1.5 15h15L9 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 6.75v3M9 12.75h.007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Hallazgos críticos
            </h4>
            <label className={`${styles.criticalCheckbox} ${disabled ? styles["criticalCheckbox--disabled"] : ""}`}>
              <input
                type="checkbox"
                checked={hasSiniestro}
                onChange={(e) => setHasSiniestro(e.target.checked)}
                disabled={disabled}
              />
              <span>El vehículo ha tenido un siniestro (choque)</span>
            </label>
            <label className={`${styles.criticalCheckbox} ${disabled ? styles["criticalCheckbox--disabled"] : ""}`}>
              <input
                type="checkbox"
                checked={hasKilometrajeAdulterado}
                onChange={(e) => setHasKilometrajeAdulterado(e.target.checked)}
                disabled={disabled}
              />
              <span>El kilometraje está adulterado</span>
            </label>
            {autoReject && (
              <div className={styles.autoRejectWarning}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 5v3M8 10.5h.007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                El veredicto será automáticamente "NO APROBADO" por los hallazgos críticos marcados
              </div>
            )}
          </div>

          {/* Opciones de veredicto */}
          <div className={styles.verdictOptions}>
            {verdictOptions.map((option) => {
              const isSelected = effectiveVerdict === option.value;
              const isDisabledByAutoReject = autoReject && option.value !== "NO_APROBADO";

              return (
                <div
                  key={option.value}
                  onClick={() => !isDisabledByAutoReject && !disabled && setVerdict(option.value)}
                  className={`
                    ${styles.verdictOption}
                    ${isSelected ? styles["verdictOption--selected"] : ""}
                    ${isDisabledByAutoReject ? styles["verdictOption--disabled"] : ""}
                    ${styles[`verdictOption--${option.value.toLowerCase()}`]}
                  `}
                >
                  <div className={styles.verdictRadio}>
                    <div className={styles.verdictRadioInner} />
                  </div>
                  <div className={styles.verdictContent}>
                    <p className={`${styles.verdictLabel} ${styles[`verdictLabel--${option.value.toLowerCase()}`]}`}>
                      <span>{option.icon}</span>
                      {option.label}
                    </p>
                    <p className={styles.verdictDescription}>{option.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mostrar veredicto guardado cuando está completado */}
      {disabled && report.mechanicalVerdict && report.mechanicalVerdict !== "PENDING" && (
        <div className={styles.verdictSection}>
          <h3 className={styles.verdictTitle}>Veredicto Final</h3>
          <div className={`
            ${styles.verdictOption}
            ${styles["verdictOption--selected"]}
            ${styles[`verdictOption--${report.mechanicalVerdict.toLowerCase()}`]}
          `} style={{ cursor: "default" }}>
            <div className={styles.verdictRadio}>
              <div className={styles.verdictRadioInner} />
            </div>
            <div className={styles.verdictContent}>
              <p className={`${styles.verdictLabel} ${styles[`verdictLabel--${report.mechanicalVerdict.toLowerCase()}`]}`}>
                <span>{verdictOptions.find(v => v.value === report.mechanicalVerdict)?.icon}</span>
                {report.mechanicalVerdict === "NO_APROBADO" ? "NO APROBADO" : report.mechanicalVerdict}
              </p>
              <p className={styles.verdictDescription}>
                {verdictOptions.find(v => v.value === report.mechanicalVerdict)?.description}
              </p>
            </div>
          </div>
          {(report.hasSiniestro || report.hasKilometrajeAdulterado) && (
            <div className={styles.criticalFindings} style={{ marginTop: 12 }}>
              <h4 className={styles.criticalFindingsTitle}>Hallazgos críticos detectados:</h4>
              {report.hasSiniestro && (
                <p style={{ fontSize: 14, color: "#7F1D1D", margin: "4px 0" }}>• El vehículo ha tenido un siniestro (choque)</p>
              )}
              {report.hasKilometrajeAdulterado && (
                <p style={{ fontSize: 14, color: "#7F1D1D", margin: "4px 0" }}>• El kilometraje está adulterado</p>
              )}
            </div>
          )}
        </div>
      )}

      {error && <div className={styles.errorMessage}>{error}</div>}

      {!disabled && (
        <div className={styles.summaryActions}>
          <button
            onClick={handleComplete}
            disabled={completing || !canComplete}
            className={styles.completeButton}
          >
            {completing ? "Finalizando..." : "Finalizar inspección"}
          </button>
        </div>
      )}

      {disabled && (
        <div className={styles.completedMessage}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#22C55E" fillOpacity="0.1" />
            <path d="M8 12l3 3 5-6" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Este informe ha sido completado y no puede modificarse</span>
        </div>
      )}

      {/* Modal de placa faltante */}
      {showPlateModal && (
        <div className={styles.plateModalOverlay} onClick={() => setShowPlateModal(false)}>
          <div className={styles.plateModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.plateModalIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                <circle cx="6" cy="12" r="1.5" fill="currentColor" />
                <circle cx="18" cy="12" r="1.5" fill="currentColor" />
                <path d="M9 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className={styles.plateModalTitle}>Placa no registrada</h3>
            <p className={styles.plateModalText}>
              Debes registrar la placa del vehículo antes de finalizar la inspección.
              <br /><br />
              Ve a la sección <strong>"Información"</strong> para registrar la placa.
            </p>
            <button
              className={styles.plateModalButton}
              onClick={() => setShowPlateModal(false)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
