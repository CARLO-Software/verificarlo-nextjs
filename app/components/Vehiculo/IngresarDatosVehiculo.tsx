"use client";
/**
 * IngresarDatosVehiculo.tsx
 *
 * Vehicle Data Entry Form Component
 *
 * DESIGN DECISIONS:
 * - Split layout with illustration (left) and form (right) on desktop
 *   This creates visual balance and makes the form less intimidating
 * - Stacked layout on mobile for optimal scrolling experience
 * - Uses VerifiCARLO design system: bright-sun (yellow) and shark (gray) palette
 * - Subtle entrance animations improve perceived performance
 * - Focus states use brand yellow for consistency
 *
 * UX CONSIDERATIONS:
 * - Form fields are grouped logically (year/brand, model/mileage)
 * - Required fields are marked with red asterisk
 * - Helper text guides users on expected input format
 * - Loading state with spinner prevents double submissions
 * - Error states are clearly visible with shake animation
 *
 * ACCESSIBILITY:
 * - All inputs have associated labels with htmlFor
 * - Focus states are clearly visible
 * - Respects prefers-reduced-motion preference
 * - Semantic HTML structure
 */

import { useState } from "react";
import styles from "./IngresarDatosVehiculo.module.css";

// ============================================
// TYPES - Define the shape of our data
// ============================================

type Brand = {
    id: number;
    name: string;
};

type VehicleFormData = {
    year: string;
    brandId: string;
    model: string;
    mileage: string;
};

// Static brand list for demo - will be replaced with API data
const DEMO_BRANDS: Brand[] = [
    { id: 1, name: "Toyota" },
    { id: 2, name: "Honda" },
    { id: 3, name: "Nissan" },
    { id: 4, name: "Hyundai" },
    { id: 5, name: "Kia" },
    { id: 6, name: "Chevrolet" },
    { id: 7, name: "Ford" },
    { id: 8, name: "Volkswagen" },
    { id: 9, name: "Mazda" },
    { id: 10, name: "Suzuki" },
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
        year: "",
        brandId: "",
        model: "",
        mileage: "",
    });

    // Using demo brands - replace with API fetch when backend is ready
    const [brands] = useState<Brand[]>(DEMO_BRANDS);

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ------------------------------------------
    // HANDLE INPUT CHANGES
    // Generic handler for all form inputs
    // ------------------------------------------

    function handleChange(
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) {
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

        const mileage = parseInt(formData.mileage);
        if (mileage < 0 || mileage > 2000000) {
            setError("El kilometraje debe estar entre 0 y 2,000,000 km");
            return false;
        }

        return true;
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
                year: parseInt(formData.year),
                brand_id: parseInt(formData.brandId),
                model: formData.model.trim(),
                mileage: parseInt(formData.mileage),
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
            setFormData({ year: "", brandId: "", model: "", mileage: "" });

        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al enviar los datos");
        } finally {
            setIsSubmitting(false);
        }
    }

    // ------------------------------------------
    // RENDER
    // ------------------------------------------

    return (
        <div className={styles.container}>
            {/*
              LEFT SIDE: Illustration Section

              UX Decision: Including an illustration here serves multiple purposes:
              1. Creates visual balance and breaks up the "wall of form fields" feeling
              2. Reinforces the brand identity (car inspection theme)
              3. Makes the form feel less transactional and more welcoming
              4. Provides a natural visual hierarchy guiding users to the form

              The illustration is hidden on very small screens (< 480px) where
              vertical space is precious and users expect a form-first experience.
            */}
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
            </aside>

            {/* RIGHT SIDE: Form Section */}
            <main className={styles.formSection}>
                <div className={styles.formCard}>
                    {/* Form Header */}
                    <header className={styles.formHeader}>
                        <h1 className={styles.formTitle}>Datos del Vehículo</h1>
                        <p className={styles.formSubtitle}>
                            Completa todos los campos para registrar tu vehículo
                        </p>
                    </header>

                    {/* Error Alert */}
                    {error && (
                        <div className={styles.errorContainer} role="alert">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                <circle cx="10" cy="10" r="9" stroke="#FF1E39" strokeWidth="2"/>
                                <path d="M10 6v5M10 13.5v.5" stroke="#FF1E39" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Main Form */}
                    <form onSubmit={handleSubmit} className={styles.form} noValidate>
                        {/* Row 1: Year and Brand (side by side on desktop) */}
                        <div className={styles.formRow}>
                            {/* Year Input */}
                            <div className={styles.formGroup}>
                                <label htmlFor="year" className={styles.label}>
                                    Año del vehículo
                                    <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="number"
                                    id="year"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    placeholder="Ej: 2020"
                                    min="1900"
                                    max={new Date().getFullYear() + 1}
                                    maxLength={4}
                                    required
                                    className={styles.input}
                                    aria-describedby="year-helper"
                                />
                                <span id="year-helper" className={styles.helperText}>
                                    Ingresa el año de fabricación
                                </span>
                            </div>

                            {/* Brand Select */}
                            <div className={styles.formGroup}>
                                <label htmlFor="brandId" className={styles.label}>
                                    Marca
                                    <span className={styles.required}>*</span>
                                </label>
                                <select
                                    id="brandId"
                                    name="brandId"
                                    value={formData.brandId}
                                    onChange={handleChange}
                                    required
                                    className={styles.select}
                                    aria-describedby="brand-helper"
                                >
                                    <option value="">Selecciona una marca</option>
                                    {brands.map((brand) => (
                                        <option key={brand.id} value={brand.id}>
                                            {brand.name}
                                        </option>
                                    ))}
                                </select>
                                <span id="brand-helper" className={styles.helperText}>
                                    Elige la marca de tu vehículo
                                </span>
                            </div>
                        </div>

                        {/* Row 2: Model and Mileage (side by side on desktop) */}
                        <div className={styles.formRow}>
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

                            {/* Mileage Input */}
                            <div className={styles.formGroup}>
                                <label htmlFor="mileage" className={styles.label}>
                                    Kilometraje (Opcional)
                                    
                                </label>
                                <input
                                    type="number"
                                    id="mileage"
                                    name="mileage"
                                    value={formData.mileage}
                                    onChange={handleChange}
                                    placeholder="Ej: 50000"
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

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`${styles.submitButton} ${isSubmitting ? styles.loading : ''}`}
                            aria-busy={isSubmitting}
                        >
                            {isSubmitting ? "Guardando..." : "Guardar Vehículo"}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
