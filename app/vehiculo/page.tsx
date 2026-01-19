"use client";
/**
 * IngresarDatosVehiculo.tsx
 *
 * Vehicle Data Entry Form Component
 */

import { useState } from "react";
import styles from "./IngresarDatosVehiculo.module.css";

// ============================================
// TYPES - Define the shape of our data
// ============================================

type Brand = {
    id: number;
    name: string;
    logo: string;
};

type VehicleFormData = {
    brandId: string;
    model: string;
    year: string;
    mileage: string | null;
    placa: string | null;
    fechaEstimada: string | null;
    horaEstimada: string;
    tipoInspeccion: string;
};

type InspectionType = {
    id: string;
    title: string;
    description: string;
};

const INSPECTION_TYPES: InspectionType[] = [
    { id: "legal", title: "Inspección Legal", description: "Cumple requisitos normativos" },
    { id: "basica", title: "Inspección Básica", description: "Revisión general del vehículo" },
    { id: "completa", title: "Inspección Completa", description: "Revisión técnica y legal" },
];

// Static brand list for demo - will be replaced with API data
const DEMO_BRANDS: Brand[] = [
    { id: 1, name: "Toyota", logo: "assets/logos/toyota.jpg" },
    { id: 2, name: "Honda", logo: "assets/logos/honda.svg" },
    { id: 3, name: "Nissan", logo: "assets/logos/nissan.svg" },
    { id: 4, name: "Hyundai", logo: "assets/logos/hyundai.svg" },
    { id: 5, name: "Kia", logo: "assets/logos/kia.svg" },
    { id: 6, name: "Chevrolet", logo: "assets/logos/chevrolet.svg" },
    { id: 7, name: "Ford", logo: "assets/logos/ford.svg" },
    { id: 8, name: "Volkswagen", logo: "assets/logos/volkswagen.svg" },
    { id: 9, name: "Mazda", logo: "assets/logos/mazda.svg" },
    { id: 10, name: "Suzuki", logo: "assets/logos/suzuki.svg" },
];
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
// MAIN COMPONENT
// ============================================

export default function IngresarDatosVehiculos() {
    // ------------------------------------------
    // STATE VARIABLES
    // ------------------------------------------

    const [formData, setFormData] = useState<VehicleFormData>({
        brandId: "",
        model: "",
        year: "",
        mileage: "",
        placa: "",
        fechaEstimada: null,
        horaEstimada: "",
        tipoInspeccion: "",
    });

    // Using demo brands - replace with API fetch when backend is ready
    const [brands] = useState<Brand[]>(DEMO_BRANDS);

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [plate, setPlate] = useState("");

    //* Para el buscador de marca
    const [brandQuery, setBrandQuery] = useState("");
    const [showBrands, setShowBrands] = useState(false);

    //* Para el tipo de inspección seleccionado
    const [selectedInspection, setSelectedInspection] = useState<string | null>(null);

    // ------------------------------------------
    // HANDLE INPUT CHANGES
    // Generic handler for all form inputs
    // ------------------------------------------

    function handleChange(
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) {
        //* Se llama al name y al value (importante)
        const { name, value } = event.target;

        // Clear error when user starts typing
        if (error) setError(null);

        setFormData({
            ...formData,
            [name]: value,
        });
    }

    // ------------------------------------------
    // FORM VALIDATION
    // Client-side validation before submit
    // ------------------------------------------

    function validateForm(): boolean {
        const currentYear = new Date().getFullYear();
        const year = parseInt(formData.year);

        if (year < 1900 || year > currentYear + 1) {
            setError(`El año debe estar entre 1900 y ${currentYear + 1}`);
            return false;
        }

        if (!formData.brandId) {
            setError("Por favor selecciona una marca");
            return false;
        }

        if (formData.model.trim().length < 2) {
            setError("El modelo debe tener al menos 2 caracteres");
            return false;
        }

        const mileage = formData.mileage ? parseInt(formData.mileage) : null;
        if (mileage !== null && (mileage < 0 || mileage > 2000000)) {
            setError("El kilometraje debe estar entre 0 y 2,000,000 km");
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
    // HANDLE FORM SUBMIT
    // ------------------------------------------

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            setError(null);

            // Prepare data (convert strings to numbers for API)
            const dataToSend = {
                brand_id: parseInt(formData.brandId),
                model: formData.model.trim(),
                year: parseInt(formData.year),
                mileage: formData.mileage ? parseInt(formData.mileage) : null,
                placa: formData.placa?.trim() || null,
                fechaEstimada: formData.fechaEstimada,
                horaEstimada: formData.horaEstimada,
                tipoInspeccion: selectedInspection,
            };

            // TODO: Replace with actual API call when backend is ready
            // const response = await fetch("http://localhost:8000/api/vehicles", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify(dataToSend),
            // });
            // if (!response.ok) throw new Error("Error al guardar el vehículo");

            // Simulate API call for demo
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log("Vehicle data to send:", dataToSend);

            // Success - reset form
            alert("¡Vehículo guardado exitosamente!");
            setFormData({ year: "", brandId: "", model: "", mileage: "", placa: "", fechaEstimada: "", tipoInspeccion: "", horaEstimada: "" });

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
                    {INSPECTION_TYPES.map((inspection) => {
                        const isSelected = selectedInspection === inspection.id;
                        return (
                            <li
                                key={inspection.id}
                                onClick={() => setSelectedInspection(inspection.id)}
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

                        <div className={styles.formGroup}>
                            <h2 className={styles.sectionTitle}>
                                Datos del Vehículo
                            </h2>
                            <div className={styles.formSectionDivider}>
                                <div className={styles.formRow}>

                                    {/* Brand Select */}
                                    <div className={styles.formGroup} style={{ zIndex: '99' }}>
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
                                            onFocus={() => setShowBrands(true)}
                                            className={styles.input}
                                        />

                                        {showBrands && (
                                            <ul className={styles.dropdown}>
                                                {filteredBrands.length > 0 ? (
                                                    filteredBrands.map((brand) => (
                                                        <li
                                                            key={brand.id}
                                                            className={styles.option}
                                                            onClick={() => {
                                                                setBrandQuery(brand.name);
                                                                setShowBrands(false);
                                                            }}
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
                                    <div className={styles.formGroup}>
                                        <label htmlFor="model" className={styles.label}>
                                            Modelo
                                            <span className={styles.required}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="model"
                                            name="model"
                                            value={formData.model}
                                            onChange={handleChange}
                                            placeholder="Ej: Corolla, Civic, Sentra"
                                            required
                                            className={styles.input}
                                            aria-describedby="model-helper"
                                        />
                                        <span id="model-helper" className={styles.helperText}>
                                            Nombre del modelo específico
                                        </span>
                                    </div>

                                    {/*Row 2: Year and Mileage*/}
                                    {/* Year Input */}
                                    <div className={styles.formGroup}>
                                        <label htmlFor="year" className={styles.label}>
                                            Año del vehículo
                                            <span className={styles.required}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="year"
                                            name="year"
                                            value={formData.year}
                                            inputMode="numeric"
                                            placeholder="Ej: 2020"
                                            maxLength={4}
                                            required
                                            className={styles.input}
                                            aria-describedby="year-helper"
                                            onChange={(e) => {
                                                const value = e.target.value
                                                // Solo números y máximo 4 dígitos
                                                if (/^\d{0,4}$/.test(value)) {
                                                    setFormData({
                                                        ...formData,
                                                        year: value
                                                    })
                                                }
                                            }}
                                        />
                                        <span id="year-helper" className={styles.helperText}>
                                            Ingresa el año de fabricación
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
                                            value={formData.mileage ? formData.mileage : ""}
                                            onChange={(e) => {
                                                setFormData({
                                                    ...formData,
                                                    mileage: formatMileage(e.target.value)
                                                })
                                            }}
                                            placeholder="Ej: 2,000,000"
                                            min="0"
                                            max="2000000"
                                            className={styles.input}
                                            aria-describedby="mileage-helper"
                                        />
                                        <span id="mileage-helper" className={styles.helperText}>
                                            Kilometraje actual en km
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/*Sección de identificación*/}
                        <div className={styles.formGroup}>

                            <div>
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
                                    onChange={(e) => setPlate(formatPlate(e.target.value))}
                                    maxLength={7}
                                />
                            </div>

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
                                        min={new Date().toISOString().split('T')[0]} />
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

                        <input type="hidden" />

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

        </div>
    );
}
