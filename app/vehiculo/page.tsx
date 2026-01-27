"use client";
/**
 * IngresarDatosVehiculo.tsx
 *
 * Vehicle Data Entry Form Component
 */

import { useState, useEffect, useCallback } from "react";
import styles from "./IngresarDatosVehiculo.module.css";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { agendarVehiculo, getBrands, getModelsByBrand, getInspections } from "@/services/vehicle/vehicle.client";
import { Brand, Model, Inspection } from "./types";

// ============================================
// TYPES - Tipos locales del formulario
// ============================================

type VehicleFormData = {
    brandId: number | null;
    model: number | null;
    tipoInspeccion: number | null;
    year: number | null;
    mileage: number | null;
    placa: string;
    fechaEstimada: string;
    horaEstimada: string;
};

// Tipo interno para el modelo con campos en camelCase (mapeado desde BD)
type ModelUI = {
    id: number;
    brandId: number;
    name: string;
    yearFrom: number;
    yearTo: number;
};

const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
];


// ============================================
// SVG ILLUSTRATION COMPONENT
// Custom car inspection illustration matching brand style
// ============================================

function CarInspectionIllustration({ className }: { className?: string }) {

    return (
        <svg
            className={className}
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {/* Background circle */}
            <circle cx="100" cy="100" r="90" fill="var(--bright-sun--200)" opacity="0.4" />
            <circle cx="100" cy="100" r="70" fill="var(--bright-sun--100)" opacity="0.3" />

            {/* Car shadow */}
            <ellipse cx="100" cy="155" rx="55" ry="8" fill="var(--shark--300)" opacity="0.3" />

            {/* Car body - sedan shape */}
            <path
                d="M25 115
                   L25 130
                   Q25 138 33 138
                   L45 138
                   Q48 138 48 135
                   L48 130
                   L152 130
                   L152 135
                   Q152 138 155 138
                   L167 138
                   Q175 138 175 130
                   L175 115
                   L170 105
                   L155 95
                   L140 75
                   Q135 70 125 70
                   L75 70
                   Q65 70 60 75
                   L45 95
                   L30 105
                   Z"
                fill="var(--shark--950)"
            />

            {/* Car roof/cabin */}
            <path
                d="M55 95
                   L68 75
                   Q72 70 78 70
                   L122 70
                   Q128 70 132 75
                   L145 95
                   Z"
                fill="var(--shark--800)"
            />

            {/* Front windshield */}
            <path
                d="M58 93
                   L70 76
                   Q73 73 77 73
                   L95 73
                   L95 93
                   Z"
                fill="var(--bright-sun--100)"
                opacity="0.9"
            />

            {/* Rear windshield */}
            <path
                d="M105 73
                   L123 73
                   Q127 73 130 76
                   L142 93
                   L105 93
                   Z"
                fill="var(--bright-sun--100)"
                opacity="0.9"
            />

            {/* Window divider */}
            <rect x="96" y="73" width="8" height="20" fill="var(--shark--800)" />

            {/* Front wheel */}
            <circle cx="55" cy="130" r="18" fill="var(--shark--950)" />
            <circle cx="55" cy="130" r="14" fill="var(--shark--700)" />
            <circle cx="55" cy="130" r="10" fill="var(--shark--500)" />
            <circle cx="55" cy="130" r="5" fill="var(--shark--700)" />
            {/* Wheel spokes */}
            <line x1="55" y1="120" x2="55" y2="140" stroke="var(--shark--600)" strokeWidth="2" />
            <line x1="45" y1="130" x2="65" y2="130" stroke="var(--shark--600)" strokeWidth="2" />

            {/* Rear wheel */}
            <circle cx="145" cy="130" r="18" fill="var(--shark--950)" />
            <circle cx="145" cy="130" r="14" fill="var(--shark--700)" />
            <circle cx="145" cy="130" r="10" fill="var(--shark--500)" />
            <circle cx="145" cy="130" r="5" fill="var(--shark--700)" />
            {/* Wheel spokes */}
            <line x1="145" y1="120" x2="145" y2="140" stroke="var(--shark--600)" strokeWidth="2" />
            <line x1="135" y1="130" x2="155" y2="130" stroke="var(--shark--600)" strokeWidth="2" />

            {/* Front headlight */}
            <ellipse cx="28" cy="112" rx="4" ry="6" fill="var(--bright-sun--300)" />

            {/* Rear taillight */}
            <ellipse cx="172" cy="112" rx="4" ry="6" fill="#FF4444" />

            {/* Door handle */}
            <rect x="85" y="100" width="12" height="3" rx="1" fill="var(--shark--600)" />

            {/* Side mirror */}
            <ellipse cx="48" cy="90" rx="5" ry="3" fill="var(--shark--950)" />

            {/* Inspection checkmark badge */}
            <circle cx="160" cy="50" r="22" fill="var(--bright-sun--300)" />
            <circle cx="160" cy="50" r="18" fill="var(--bright-sun--400)" />
            <path
                d="M150 50 L157 57 L170 44"
                stroke="var(--shark--950)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />

            {/* Magnifying glass (inspection symbol) */}
            <circle cx="40" cy="45" r="14" fill="var(--basics--white)" opacity="0.9" />
            <circle cx="40" cy="45" r="14" fill="none" stroke="var(--shark--950)" strokeWidth="3" />
            <line x1="50" y1="55" x2="60" y2="65" stroke="var(--shark--950)" strokeWidth="4" strokeLinecap="round" />
            {/* Magnifying glass shine */}
            <path d="M34 40 Q38 36 44 38" stroke="var(--shark--300)" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
    );
}

// ============================================
// LOGIN REQUIRED MODAL COMPONENT
// Beautiful modal to prompt users to log in
// ============================================

type LoginRequiredModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onLogin: () => void;
    onRegister: () => void;
};

function LoginRequiredModal({ isOpen, onClose, onLogin, onRegister }: LoginRequiredModalProps) {
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    return (
        <div
            className={styles.modalOverlay}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    className={styles.modalCloseButton}
                    onClick={onClose}
                    aria-label="Cerrar modal"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {/* Icon */}
                <div className={styles.modalIconWrapper}>
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                        <circle cx="40" cy="40" r="38" fill="var(--bright-sun--100)" />
                        <rect x="25" y="35" width="30" height="24" rx="4" fill="var(--bright-sun--400)" />
                        <path d="M32 35V28C32 23.5817 35.5817 20 40 20C44.4183 20 48 23.5817 48 28V35" stroke="var(--shark--950)" strokeWidth="4" strokeLinecap="round" fill="none" />
                        <circle cx="40" cy="45" r="3" fill="var(--shark--950)" />
                        <path d="M40 48V54" stroke="var(--shark--950)" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                </div>

                {/* Title */}
                <h2 id="modal-title" className={styles.modalTitle}>
                    Inicia sesion para continuar
                </h2>

                {/* Description */}
                <p className={styles.modalDescription}>
                    Para agendar tu inspeccion vehicular necesitas tener una cuenta.
                    Asi podremos enviarte actualizaciones sobre tu cita y guardar tu historial.
                </p>

                {/* Benefits list */}
                <ul className={styles.modalBenefits}>
                    <li>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="8" fill="var(--bright-sun--200)" />
                            <path d="M6 10L9 13L14 7" stroke="var(--shark--950)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Recibe confirmacion de tu cita por email
                    </li>
                    <li>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="8" fill="var(--bright-sun--200)" />
                            <path d="M6 10L9 13L14 7" stroke="var(--shark--950)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Accede a tu historial de inspecciones
                    </li>
                    <li>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="8" fill="var(--bright-sun--200)" />
                            <path d="M6 10L9 13L14 7" stroke="var(--shark--950)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Gestiona tus vehiculos registrados
                    </li>
                </ul>

                {/* Action buttons */}
                <div className={styles.modalActions}>
                    <button className={styles.modalPrimaryButton} onClick={onLogin}>
                        Iniciar Sesion
                    </button>
                    <button className={styles.modalSecondaryButton} onClick={onRegister}>
                        Crear cuenta gratis
                    </button>
                </div>

                {/* Footer text */}
                <p className={styles.modalFooter}>
                    Registrarte solo toma 30 segundos
                </p>
            </div>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function IngresarDatosVehiculos() {
    // ------------------------------------------
    // HOOKS
    // ------------------------------------------
    const { data: session } = useSession();
    const router = useRouter();

    // ------------------------------------------
    // STATE VARIABLES
    // ------------------------------------------

    const [showLoginModal, setShowLoginModal] = useState(false);

    const [formData, setFormData] = useState<VehicleFormData>({
        brandId: null,
        model: null,
        year: null,
        mileage: null,
        placa: "",
        fechaEstimada: "",
        horaEstimada: "",
        tipoInspeccion: null,
    });

    // Marcas cargadas desde la API
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loadingBrands, setLoadingBrands] = useState(true);

    // Tipos de inspección cargados desde la API
    const [inspectionTypes, setInspectionTypes] = useState<Inspection[]>([]);
    const [loadingInspections, setLoadingInspections] = useState(true);

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [plate, setPlate] = useState("");

    //* Para el buscador de marca
    const [brandQuery, setBrandQuery] = useState("");
    const [showBrands, setShowBrands] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

    //* Para el buscador de modelo
    const [modelQuery, setModelQuery] = useState("");
    const [showModels, setShowModels] = useState(false);
    const [selectedModel, setSelectedModel] = useState<ModelUI | null>(null);

    //* Para carga de modelos (preparado para API)
    const [loadingModels, setLoadingModels] = useState(false);
    const [availableModels, setAvailableModels] = useState<ModelUI[]>([]);

    //* Para el selector de año
    const [yearQuery, setYearQuery] = useState("");
    const [showYears, setShowYears] = useState(false);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);

    //* Para el tipo de inspección seleccionado
    const [selectedInspection, setSelectedInspection] = useState<number | null>(null);

    //* Para el mileage (kilometraje) será solo visual, pero su resultado será otro
    const [mileageInput, setMileageInput] = useState("");

    //* Para manejar el estado de las fechas (input data: Calendario)
    const [date, setDate] = useState("");

    //* Para manejar el estado del tiempo (horas)
    const [time, setTime] = useState("");

    // ------------------------------------------
    // FUNCIÓN PARA CERRAR TODOS LOS DROPDOWNS
    // ------------------------------------------
    const closeAllDropdowns = useCallback(() => {
        setShowBrands(false);
        setShowModels(false);
        setShowYears(false);
    }, []);

    // ------------------------------------------
    // CLICK OUTSIDE PARA CERRAR DROPDOWNS
    // ------------------------------------------
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as HTMLElement;
            // Si el clic no fue dentro de un dropdown o input, cerrar todos
            // Verificar ambas clases: la inactiva y la activa
            const isInsideDropdown =
                target.closest(`.${styles.formGroupWithDropdown}`) ||
                target.closest(`.${styles.formGroupWithDropdownActive}`);

            if (!isInsideDropdown) {
                closeAllDropdowns();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [closeAllDropdowns]);

    // ------------------------------------------
    // CARGAR DATOS INICIALES (Marcas e Inspecciones)
    // ------------------------------------------
    useEffect(() => {
        // Cargar marcas
        getBrands()
            .then((data) => {
                setBrands(data);
                setLoadingBrands(false);
            })
            .catch((err) => {
                console.error("Error al cargar marcas:", err);
                setLoadingBrands(false);
            });

        // Cargar tipos de inspección
        getInspections()
            .then((data) => {
                setInspectionTypes(data);
                setLoadingInspections(false);
            })
            .catch((err) => {
                console.error("Error al cargar inspecciones:", err);
                setLoadingInspections(false);
            });
    }, []);

    // ------------------------------------------
    // FORM VALIDATION
    // Client-side validation before submit
    // ------------------------------------------

    function validateForm(): boolean {
        const currentYear = new Date().getFullYear();
        const year = formData.year;
        const model = formData.model;

        if (year === null || year < 1900 || year > currentYear + 1) {
            setError(`El año debe estar entre 1900 y ${currentYear + 1}`);
            return false;
        }

        if (!formData.brandId) {
            setError("Por favor selecciona una marca");
            return false;
        }

        if (model === null || !Number.isInteger(model) || model <= 0) {
            setError("Modelo inválido");
            return false;
        }

        const mileage = formData.mileage ? formData.mileage : null;
        if (mileage !== null && (mileage < 0 || mileage > 2000000)) {
            setError("El kilometraje debe estar entre 0 y 2,000,000 km");
            return false;
        }

        if (!formData.tipoInspeccion) {
            setError("Por favor selecciona un tipo de inspección");
            return false;
        }

        if (!formData.fechaEstimada) {
            setError("Por favor selecciona una fecha");
            return false;
        }

        if (!formData.horaEstimada) {
            setError("Por favor selecciona una hora");
            return false;
        }

        return true;
    }

    /**
     * * FUNCIÓN PARA FORMATOS 
     */

    function formatPlate(value: string) {
        // 1. Normalizamos la entrada:
        //    - Convertimos a mayúsculas
        //    - Eliminamos símbolos, espacios y caracteres inválidos
        const clean = value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "");

        // 2. Si aún no hay suficientes caracteres para insertar el guion,
        //    retornamos el valor tal cual (solo letras/números en mayúscula)
        if (clean.length <= 3) {
            return clean;
        }

        // 3. Cuando hay más de 3 caracteres:
        //    - Los primeros 3 corresponden al prefijo de la placa
        //    - Los siguientes hasta 3 corresponden al número
        //    - Se inserta el guion automáticamente
        return clean.slice(0, 3) + "-" + clean.slice(3, 6);
    }

    function formatMileage(value: string) {
        // Eliminamos cualquier carácter que no sea número
        const clean = value.replace(/\D/g, "");

        // Evitamos valores absurdamente largos
        if (clean.length > 7) return clean.slice(0, 8);

        // Convertimos a número y aplicamos separadores de miles
        return clean === "" ? "" : Number(clean).toLocaleString("en-US");
    }

    // ------------------------------------------
    //* HANDLE FORM SUBMIT
    // ------------------------------------------

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        // Verificar si el usuario esta autenticado
        if (!session) {
            setShowLoginModal(true);
            return;
        }

        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            setError(null);

            // Prepare data (convert strings to numbers for API)
            const dataToSend = {
                brand_id: formData.brandId,
                model: formData.model,
                year: formData.year,
                mileage: formData.mileage,
                plate: formData.placa?.trim() || "",
                fechaEstimada: formData.fechaEstimada,
                horaEstimada: formData.horaEstimada,
                tipoInspeccion: formData.tipoInspeccion,
            };

            // TODO: Replace with actual API call when backend is ready
            await agendarVehiculo(dataToSend);

            // Success - reset form
            alert("¡Vehículo guardado exitosamente!");
            setFormData({ year: null, brandId: null, model: null, mileage: null, placa: "", fechaEstimada: "", tipoInspeccion: null, horaEstimada: "" });

            //* Reset selection states
            setSelectedBrand(null);
            setSelectedModel(null);
            setSelectedYear(null);
            setBrandQuery("");
            setModelQuery("");
            setYearQuery("");
            setAvailableModels([]);
            setPlate("");
            setSelectedInspection(null);
            setDate("");

        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al enviar los datos");
        } finally {
            setIsSubmitting(false);
        }
    }

    //Para realizar filtrado en el buscador de marcas
    const filteredBrands = brands.filter((b) =>
        b.name.toLowerCase().includes(brandQuery.toLowerCase())
    );

    //Para realizar filtrado en el buscador de modelos (usa availableModels filtrados por marca)
    const filteredModels = availableModels.filter((m) =>
        m.name.toLowerCase().includes(modelQuery.toLowerCase())
    );

    //Para realizar filtrado en el buscador de años (basado en el modelo seleccionado)
    const availableYears = selectedModel
        ? Array.from(
            { length: selectedModel.yearTo - selectedModel.yearFrom + 1 },
            (_, i) => selectedModel.yearTo - i // Orden descendente (más reciente primero)
        )
        : [];

    const filteredYears = availableYears.filter((year) =>
        year.toString().includes(yearQuery)
    );

    // ------------------------------------------
    // FETCH MODELS BY BRAND (preparado para API)
    // ------------------------------------------

    async function fetchModelsByBrand(brandId: number): Promise<ModelUI[]> {
        // Llamada a la API real
        const models = await getModelsByBrand(brandId);

        // Mapear de snake_case (BD) a camelCase (UI)
        return models.map((m: Model) => ({
            id: m.id,
            brandId: m.brand_id,
            name: m.name,
            logo: m.logo,
            yearFrom: m.year_from,
            yearTo: m.year_to,
        }));
    }

    // ------------------------------------------
    // HANDLERS DE SELECCIÓN EN CASCADA
    // ------------------------------------------

    async function handleBrandSelect(brand: Brand) {
        // Actualizar estados de marca
        setSelectedBrand(brand);
        setBrandQuery(brand.name);
        setShowBrands(false);
        setFormData(prev => ({ ...prev, brandId: brand.id }));

        // Resetear modelo, año y kilometraje (porque cambió la marca)
        setSelectedModel(null);
        setModelQuery("");
        setSelectedYear(null);
        setYearQuery("");
        setFormData(prev => ({ ...prev, model: null, year: null, mileage: null }));

        // Cargar modelos de esta marca
        setLoadingModels(true);
        const models = await fetchModelsByBrand(brand.id);
        setAvailableModels(models);
        setLoadingModels(false);
    }

    function handleModelSelect(model: ModelUI) {
        setSelectedModel(model);
        setModelQuery(model.name);
        setShowModels(false);
        setFormData(prev => ({ ...prev, model: model.id }));

        // Resetear año y kilometraje (porque cambió el modelo)
        setSelectedYear(null);
        setYearQuery("");
        setFormData(prev => ({ ...prev, year: null, mileage: null }));
    }

    function handleYearSelect(year: number) {
        setSelectedYear(year);
        setYearQuery(year.toString());
        setShowYears(false);
        setFormData(prev => ({ ...prev, year: year, mileage: null }));
    }

    // ------------------------------------------
    // MODAL NAVIGATION HANDLERS
    // ------------------------------------------

    function handleLoginClick() {
        setShowLoginModal(false);
        router.push("/login");
    }

    function handleRegisterClick() {
        setShowLoginModal(false);
        router.push("/register");
    }

    // ------------------------------------------
    // RENDER
    // ------------------------------------------

    return (
        <div className={styles.container}>
            {/* LEFT SIDE: Illustration Section */}
            <aside className={styles.illustrationSection}>
                <div className={styles.illustrationContent}>
                    <CarInspectionIllustration className={styles.illustrationIcon} />
                    <h2 className={styles.illustrationTitle}>
                        Inspección Vehicular
                    </h2>
                    <p className={styles.illustrationDescription}>
                        Ingresa los datos de tu vehículo para comenzar con el proceso de inspección certificada.
                    </p>
                </div>

                <ul className="w-[90%] mt-7 pl-0">
                    {loadingInspections ? (
                        <li className="p-4 text-center text-gray-500">Cargando tipos de inspección...</li>
                    ) : inspectionTypes.map((inspection) => {
                        const isSelected = selectedInspection === inspection.id;

                        return (
                            /*Parte de la izquierda*/
                            <li
                                key={inspection.id}
                                value={Number(formData.tipoInspeccion)}
                                onClick={() => {
                                    setSelectedInspection(inspection.id)
                                    setFormData(prev => ({ ...prev, tipoInspeccion: inspection.id }));
                                }}
                                className={`
                                    p-4 mb-4 rounded-lg shadow-md cursor-pointer
                                    flex items-center justify-between gap-3
                                    transition-all duration-200
                                    ${isSelected
                                        ? 'bg-yellow-50 border-2 border-yellow-400'
                                        : 'bg-white border-2 border-transparent hover:border-gray-200'
                                    }
                                `}
                            >
                                {/* Check icon */}
                                <div className={`
                                    w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                                    transition-all duration-200
                                    ${isSelected ? 'bg-yellow-400' : 'bg-gray-200'}
                                `}>
                                    {isSelected && (
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                            <path
                                                d="M3 7L6 10L11 4"
                                                stroke="#1a1a1a"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <h4 className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {inspection.title}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                        {inspection.description}
                                    </p>
                                </div>

                                {/* Info icon */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        alert(`Ver más información sobre: ${inspection.title}`);
                                    }}
                                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                    aria-label={`Ver más información sobre ${inspection.title}`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <circle cx="10" cy="10" r="8" stroke="#6b7280" strokeWidth="1.5" />
                                        <path d="M10 9V14" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
                                        <circle cx="10" cy="6.5" r="1" fill="#6b7280" />
                                    </svg>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </aside>

            {/* RIGHT SIDE: Form Section */}
            <main className={styles.formSection}>
                <div className={styles.formCard}>
                    {/* Form Header */}
                    <header className={styles.formHeader}>
                        <h1 className={styles.formTitle}>Datos para la inspección</h1>
                        <p className={styles.formSubtitle}>
                            Completa todos los campos para registrar tu vehículo
                        </p>
                    </header>

                    {/* Error Alert */}
                    {error && (
                        <div className={styles.errorContainer} role="alert">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                <circle cx="10" cy="10" r="9" stroke="#FF1E39" strokeWidth="2" />
                                <path d="M10 6v5M10 13.5v.5" stroke="#FF1E39" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Main Form */}
                    <form onSubmit={handleSubmit} className={styles.form} noValidate>
                        {/* Row 1: Brand and Model (side by side on desktop) */}

                        <div className={(showBrands || showModels || showYears) ? styles.formGroupVehicleDataActive : styles.formGroupVehicleData}>
                            <h2 className={styles.sectionTitle}>
                                Datos del Vehículo
                            </h2>
                            <div className={styles.formSectionDivider}>
                                <div className={styles.formRow}>

                                    {/* Brand Select */}
                                    <div className={showBrands ? styles.formGroupWithDropdownActive : styles.formGroupWithDropdown}>
                                        <label htmlFor="brandId" className={styles.label}>
                                            Marca
                                            <span className={styles.required}>*</span>
                                        </label>

                                        <input
                                            type="text"
                                            name="marca"
                                            value={brandQuery}
                                            placeholder="Busca la marca"
                                            onChange={(e) => {
                                                setBrandQuery(e.target.value);
                                                setShowBrands(true);
                                            }}
                                            onFocus={() => {
                                                setShowModels(false);
                                                setShowYears(false);
                                                setShowBrands(true);
                                            }}
                                            className={styles.input}
                                        />

                                        {showBrands && (
                                            <ul className={styles.dropdown}>
                                                {loadingBrands ? (
                                                    <li className={styles.noOption}>
                                                        Cargando marcas...
                                                    </li>
                                                ) : filteredBrands.length > 0 ? (
                                                    filteredBrands.map((brand) => (
                                                        <li
                                                            key={brand.id}
                                                            className={styles.option}
                                                            onClick={() => handleBrandSelect(brand)}
                                                        >
                                                            <img src={brand.logo} alt={brand.name} className={styles.logo} />
                                                            <span>{brand.name}</span>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className={styles.noOption}>
                                                        No se encontraron marcas
                                                    </li>
                                                )}
                                            </ul>
                                        )}

                                        <span id="brand-helper" className={styles.helperText}>
                                            Elige la marca de tu vehículo
                                        </span>
                                    </div>


                                    {/* Model Input */}
                                    <div className={showModels ? styles.formGroupWithDropdownActive : styles.formGroupWithDropdown}>
                                        <label htmlFor="model" className={styles.label}>
                                            Modelo
                                            <span className={styles.required}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="model"
                                            name="model"
                                            value={modelQuery}
                                            onChange={(e) => {
                                                setModelQuery(e.target.value);
                                                setShowModels(true);
                                            }}
                                            onFocus={() => {
                                                setShowBrands(false);
                                                setShowYears(false);
                                                setShowModels(true);
                                            }}
                                            placeholder={
                                                !selectedBrand
                                                    ? "Primero selecciona una marca"
                                                    : loadingModels
                                                        ? "Cargando modelos..."
                                                        : "Busca el modelo"
                                            }
                                            disabled={!selectedBrand || loadingModels}
                                            required
                                            className={styles.input}
                                            aria-describedby="model-helper"
                                        />

                                        {showModels && !loadingModels && selectedBrand && (
                                            <ul className={styles.dropdown}>
                                                {filteredModels.length > 0 ? (
                                                    filteredModels.map((model) => (
                                                        <li
                                                            key={model.id}
                                                            className={styles.option}
                                                            onClick={() => handleModelSelect(model)}
                                                        >
                                                            <span>{model.name}</span>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className={styles.noOption}>
                                                        No se encontraron modelos
                                                    </li>
                                                )}
                                            </ul>
                                        )}

                                        <span id="model-helper" className={styles.helperText}>
                                            {!selectedBrand ? "Selecciona una marca primero" : "Nombre del modelo específico"}
                                        </span>
                                    </div>

                                    {/*Row 2: Year and Mileage*/}
                                    {/* Year Select */}
                                    <div className={showYears ? styles.formGroupWithDropdownActive : styles.formGroupWithDropdown}>
                                        <label htmlFor="year" className={styles.label}>
                                            Año del vehículo
                                            <span className={styles.required}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="year"
                                            name="year"
                                            value={yearQuery}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Solo permitir números
                                                if (/^\d*$/.test(value)) {
                                                    setYearQuery(value);
                                                    setShowYears(true);
                                                }
                                            }}
                                            onFocus={() => {
                                                setShowBrands(false);
                                                setShowModels(false);
                                                setShowYears(true);
                                            }}
                                            placeholder={!selectedModel ? "Primero selecciona un modelo" : "Busca el año"}
                                            disabled={!selectedModel}
                                            required
                                            className={styles.input}
                                            aria-describedby="year-helper"
                                        />

                                        {showYears && selectedModel && (
                                            <ul className={styles.dropdown}>
                                                {filteredYears.length > 0 ? (
                                                    filteredYears.slice(0, 10).map((year) => (
                                                        <li
                                                            key={year}
                                                            className={styles.option}
                                                            onClick={() => handleYearSelect(year)}
                                                        >
                                                            <span>{year}</span>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className={styles.noOption}>
                                                        No se encontraron años
                                                    </li>
                                                )}
                                            </ul>
                                        )}

                                        <span id="year-helper" className={styles.helperText}>
                                            {!selectedModel ? "Selecciona un modelo primero" : "Selecciona el año de fabricación"}
                                        </span>
                                    </div>

                                    {/* Mileage Input */}
                                    <div className={styles.formGroup}>
                                        <label htmlFor="mileage" className={styles.label}>
                                            Kilometraje (Opcional)
                                        </label>
                                        <input
                                            type="text"
                                            id="mileage"
                                            name="mileage"
                                            value={mileageInput}
                                            onChange={(e) => {
                                                const raw = e.target.value;
                                                const clean = raw.replace(/\D/g, "");

                                                const value = clean === "" ? null : Number(clean);

                                                setMileageInput(formatMileage(raw))

                                                setFormData({ ...formData, mileage: value });
                                            }}
                                            placeholder={!selectedYear ? "Primero selecciona el año" : "ej. 50,000"}
                                            title="Ingrese kilometraje ej. 0"
                                            disabled={!selectedYear}
                                            className={styles.input}
                                            aria-describedby="mileage-helper"
                                        />
                                        <span id="mileage-helper" className={styles.helperText}>
                                            {!selectedYear ? "Selecciona el año primero" : "Kilometraje actual en km"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/*Sección de identificación*/}
                        <div className={styles.formGroup}>

                            <label htmlFor="year" className={styles.label}>
                                Nro. Placa <span className={styles.optional}>(opcional)</span>
                            </label>
                            <input
                                type="text"
                                id="placa"
                                name="placa"
                                placeholder="Ej: A1B-234"
                                className={styles.input}
                                aria-describedby="placa-helper"
                                value={plate}
                                onChange={(e) => {
                                    setPlate(formatPlate(e.target.value))
                                    setFormData({ ...formData, placa: e.target.value })
                                }}
                                maxLength={7}
                            />

                            <p className={styles.helperText}>
                                Ayúdanos a identificar mejor tu vehículo
                            </p>

                        </div>

                        <div className={styles.formGroup}>
                            {/*Sección de preferencia de revisión*/}
                            <h2 className={styles.sectionTitle}>
                                Seleccione su fecha y hora
                            </h2>
                            <div className={styles.formSectionDivider}>
                                <label htmlFor="date">Fecha estimada <span className={styles.required}>*</span>
                                </label>
                                <div className={styles.formRow}>
                                    {/*Fecha*/}
                                    <input type="date"
                                        id="date"
                                        name="fechaEstimada"
                                        className="input border border-gray-300 text-center rounded-lg px-4"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={date}
                                        onChange={(e) => {
                                            setDate(e.target.value);
                                            setFormData({ ...formData, fechaEstimada: e.target.value })
                                        }}
                                    />
                                    <p className="text-xs text-gray-400 ">
                                        Esta fecha es referencial. Te confirmaremos según disponibilidad.
                                    </p>
                                </div>

                                <label htmlFor="radio" className="mt-4">Hora estimada
                                    <span className={styles.required}>*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-3 ">
                                    {timeSlots.map((time) => (
                                        <label key={time}>
                                            <input
                                                id="radio"
                                                type="radio"
                                                name="horaEstimada"
                                                value={time}
                                                className="sr-only peer"
                                                checked={formData.horaEstimada === time} //Controlado
                                                onChange={(e) => {
                                                    setFormData({
                                                        ...formData,
                                                        horaEstimada: e.target.value
                                                    })
                                                }}
                                            />

                                            <div className="
        text-center p-3 rounded-lg border cursor-pointer
        border-gray-200
        peer-checked:border-yellow-400
        peer-checked:bg-yellow-50
      ">
                                                {time}
                                            </div>
                                        </label>
                                    ))}
                                </div>

                            </div>
                            <p className={styles.helperText}>
                                Indícanos cuándo te gustaría realizar la revisión
                            </p>
                        </div>


                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`${styles.submitButton} ${isSubmitting ? styles.loading : ''}`}
                            aria-busy={isSubmitting}
                        >
                            {isSubmitting ? "Guardando..." : "Agendar Vehículo"}
                        </button>
                    </form>
                </div>
            </main>

            {/* Login Required Modal */}
            <LoginRequiredModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onLogin={handleLoginClick}
                onRegister={handleRegisterClick}
            />
        </div>
    );
}
