"use client";
/**
 * VehiculoForm.tsx
 * Client Component - Receives pre-loaded data from server
 */

import { useState, useEffect, useCallback } from "react";
import styles from "./IngresarDatosVehiculo.module.css";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { agendarVehiculo, getModelsByBrand } from "@/services/vehicle/vehicle.client";
import { Brand, Model, Inspection } from "./types";
import { useToast } from "@/app/components/Toast";

// ============================================
// TYPES
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

type ModelUI = {
    id: number;
    brandId: number;
    name: string;
    yearFrom: number;
    yearTo: number;
};

type VehiculoFormProps = {
    initialBrands: Brand[];
    initialInspections: Inspection[];
};

const timeSlots = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

// ============================================
// SVG ILLUSTRATION COMPONENT
// ============================================

function CarInspectionIllustration({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="100" cy="100" r="90" fill="var(--bright-sun--200)" opacity="0.4" />
            <circle cx="100" cy="100" r="70" fill="var(--bright-sun--100)" opacity="0.3" />
            <ellipse cx="100" cy="155" rx="55" ry="8" fill="var(--shark--300)" opacity="0.3" />
            <path d="M25 115 L25 130 Q25 138 33 138 L45 138 Q48 138 48 135 L48 130 L152 130 L152 135 Q152 138 155 138 L167 138 Q175 138 175 130 L175 115 L170 105 L155 95 L140 75 Q135 70 125 70 L75 70 Q65 70 60 75 L45 95 L30 105 Z" fill="var(--shark--950)" />
            <path d="M55 95 L68 75 Q72 70 78 70 L122 70 Q128 70 132 75 L145 95 Z" fill="var(--shark--800)" />
            <path d="M58 93 L70 76 Q73 73 77 73 L95 73 L95 93 Z" fill="var(--bright-sun--100)" opacity="0.9" />
            <path d="M105 73 L123 73 Q127 73 130 76 L142 93 L105 93 Z" fill="var(--bright-sun--100)" opacity="0.9" />
            <rect x="96" y="73" width="8" height="20" fill="var(--shark--800)" />
            <circle cx="55" cy="130" r="18" fill="var(--shark--950)" />
            <circle cx="55" cy="130" r="14" fill="var(--shark--700)" />
            <circle cx="55" cy="130" r="10" fill="var(--shark--500)" />
            <circle cx="55" cy="130" r="5" fill="var(--shark--700)" />
            <line x1="55" y1="120" x2="55" y2="140" stroke="var(--shark--600)" strokeWidth="2" />
            <line x1="45" y1="130" x2="65" y2="130" stroke="var(--shark--600)" strokeWidth="2" />
            <circle cx="145" cy="130" r="18" fill="var(--shark--950)" />
            <circle cx="145" cy="130" r="14" fill="var(--shark--700)" />
            <circle cx="145" cy="130" r="10" fill="var(--shark--500)" />
            <circle cx="145" cy="130" r="5" fill="var(--shark--700)" />
            <line x1="145" y1="120" x2="145" y2="140" stroke="var(--shark--600)" strokeWidth="2" />
            <line x1="135" y1="130" x2="155" y2="130" stroke="var(--shark--600)" strokeWidth="2" />
            <ellipse cx="28" cy="112" rx="4" ry="6" fill="var(--bright-sun--300)" />
            <ellipse cx="172" cy="112" rx="4" ry="6" fill="#FF4444" />
            <rect x="85" y="100" width="12" height="3" rx="1" fill="var(--shark--600)" />
            <ellipse cx="48" cy="90" rx="5" ry="3" fill="var(--shark--950)" />
            <circle cx="160" cy="50" r="22" fill="var(--bright-sun--300)" />
            <circle cx="160" cy="50" r="18" fill="var(--bright-sun--400)" />
            <path d="M150 50 L157 57 L170 44" stroke="var(--shark--950)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="40" cy="45" r="14" fill="var(--basics--white)" opacity="0.9" />
            <circle cx="40" cy="45" r="14" fill="none" stroke="var(--shark--950)" strokeWidth="3" />
            <line x1="50" y1="55" x2="60" y2="65" stroke="var(--shark--950)" strokeWidth="4" strokeLinecap="round" />
            <path d="M34 40 Q38 36 44 38" stroke="var(--shark--300)" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
    );
}

// ============================================
// LOGIN MODAL COMPONENT
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
        <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.modalCloseButton} onClick={onClose} aria-label="Cerrar modal">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <div className={styles.modalIconWrapper}>
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                        <circle cx="40" cy="40" r="38" fill="var(--bright-sun--100)" />
                        <rect x="25" y="35" width="30" height="24" rx="4" fill="var(--bright-sun--400)" />
                        <path d="M32 35V28C32 23.5817 35.5817 20 40 20C44.4183 20 48 23.5817 48 28V35" stroke="var(--shark--950)" strokeWidth="4" strokeLinecap="round" fill="none" />
                        <circle cx="40" cy="45" r="3" fill="var(--shark--950)" />
                        <path d="M40 48V54" stroke="var(--shark--950)" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                </div>
                <h2 id="modal-title" className={styles.modalTitle}>Inicia sesion para continuar</h2>
                <p className={styles.modalDescription}>Para agendar tu inspeccion vehicular necesitas tener una cuenta. Asi podremos enviarte actualizaciones sobre tu cita y guardar tu historial.</p>
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
                <div className={styles.modalActions}>
                    <button className={styles.modalPrimaryButton} onClick={onLogin}>Iniciar Sesion</button>
                    <button className={styles.modalSecondaryButton} onClick={onRegister}>Crear cuenta gratis</button>
                </div>
                <p className={styles.modalFooter}>Registrarte solo toma 30 segundos</p>
            </div>
        </div>
    );
}

// ============================================
// MAIN FORM COMPONENT
// ============================================

export default function VehiculoForm({ initialBrands, initialInspections }: VehiculoFormProps) {
    const {showToast} = useToast();
    const { data: session } = useSession();
    const router = useRouter();

    // State - Data pre-loaded from server (no loading states needed)
    const [brands] = useState<Brand[]>(initialBrands);
    const [inspectionTypes] = useState<Inspection[]>(initialInspections);

    const [showLoginModal, setShowLoginModal] = useState(false);
    const [formData, setFormData] = useState<VehicleFormData>({
        brandId: null, model: null, year: null, mileage: null,
        placa: "", fechaEstimada: "", horaEstimada: "", tipoInspeccion: null,
    });

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [plate, setPlate] = useState("");

    // Brand search
    const [brandQuery, setBrandQuery] = useState("");
    const [showBrands, setShowBrands] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

    // Model search
    const [modelQuery, setModelQuery] = useState("");
    const [showModels, setShowModels] = useState(false);
    const [selectedModel, setSelectedModel] = useState<ModelUI | null>(null);
    const [loadingModels, setLoadingModels] = useState(false);
    const [availableModels, setAvailableModels] = useState<ModelUI[]>([]);

    // Year search
    const [yearQuery, setYearQuery] = useState("");
    const [showYears, setShowYears] = useState(false);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);

    // Inspection & mileage
    const [selectedInspection, setSelectedInspection] = useState<number | null>(null);
    const [mileageInput, setMileageInput] = useState("");
    const [date, setDate] = useState("");

    // Close dropdowns
    const closeAllDropdowns = useCallback(() => {
        setShowBrands(false);
        setShowModels(false);
        setShowYears(false);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as HTMLElement;
            const isInsideDropdown =
                target.closest(`.${styles.formGroupWithDropdown}`) ||
                target.closest(`.${styles.formGroupWithDropdownActive}`);
            if (!isInsideDropdown) closeAllDropdowns();
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [closeAllDropdowns]);

    // Validation
    function validateForm(): boolean {
        const currentYear = new Date().getFullYear();
        if (formData.year === null || formData.year < 1900 || formData.year > currentYear + 1) {
            setError(`El año debe estar entre 1900 y ${currentYear + 1}`);
            return false;
        }
        if (!formData.brandId) { setError("Por favor selecciona una marca"); return false; }
        if (formData.model === null || !Number.isInteger(formData.model) || formData.model <= 0) {
            setError("Modelo inválido"); return false;
        }
        if (formData.mileage !== null && (formData.mileage < 0 || formData.mileage > 2000000)) {
            setError("El kilometraje debe estar entre 0 y 2,000,000 km"); return false;
        }
        if (!formData.tipoInspeccion) { setError("Por favor selecciona un tipo de inspección"); return false; }
        if (!formData.fechaEstimada) { setError("Por favor selecciona una fecha"); return false; }
        if (!formData.horaEstimada) { setError("Por favor selecciona una hora"); return false; }
        return true;
    }

    // Formatters
    function formatPlate(value: string) {
        const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (clean.length <= 3) return clean;
        return clean.slice(0, 3) + "-" + clean.slice(3, 6);
    }

    function formatMileage(value: string) {
        const clean = value.replace(/\D/g, "");
        if (clean.length > 7) return clean.slice(0, 8);
        return clean === "" ? "" : Number(clean).toLocaleString("en-US");
    }

    // Submit
    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!session) { setShowLoginModal(true); return; }
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            setError(null);
            await agendarVehiculo({
                brand_id: formData.brandId, model: formData.model, year: formData.year,
                mileage: formData.mileage, plate: formData.placa?.trim() || "",
                fechaEstimada: formData.fechaEstimada, horaEstimada: formData.horaEstimada,
                tipoInspeccion: formData.tipoInspeccion,
            });
            alert("¡Vehículo guardado exitosamente!");
            showToast("¡Vehículo guardado exitosamente!", "success");
            // Reset
            setFormData({ year: null, brandId: null, model: null, mileage: null, placa: "", fechaEstimada: "", tipoInspeccion: null, horaEstimada: "" });
            setSelectedBrand(null); setSelectedModel(null); setSelectedYear(null);
            setBrandQuery(""); setModelQuery(""); setYearQuery("");
            setAvailableModels([]); setPlate(""); setSelectedInspection(null); setDate("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al enviar los datos");
        } finally {
            setIsSubmitting(false);
        }
    }

    // Filtered data
    const filteredBrands = brands.filter((b) => b.name.toLowerCase().includes(brandQuery.toLowerCase()));
    const filteredModels = availableModels.filter((m) => m.name.toLowerCase().includes(modelQuery.toLowerCase()));
    const availableYears = selectedModel
        ? Array.from({ length: selectedModel.yearTo - selectedModel.yearFrom + 1 }, (_, i) => selectedModel.yearTo - i)
        : [];
    const filteredYears = availableYears.filter((year) => year.toString().includes(yearQuery));

    // Fetch models by brand
    async function fetchModelsByBrand(brandId: number): Promise<ModelUI[]> {
        const models = await getModelsByBrand(brandId);
        return models.map((m: Model) => ({
            id: m.id, brandId: m.brand_id, name: m.name,
            yearFrom: m.year_from, yearTo: m.year_to,
        }));
    }

    // Handlers
    async function handleBrandSelect(brand: Brand) {
        setSelectedBrand(brand);
        setBrandQuery(brand.name);
        setShowBrands(false);
        setFormData(prev => ({ ...prev, brandId: brand.id }));
        setSelectedModel(null); setModelQuery(""); setSelectedYear(null); setYearQuery("");
        setFormData(prev => ({ ...prev, model: null, year: null, mileage: null }));
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
        setSelectedYear(null); setYearQuery("");
        setFormData(prev => ({ ...prev, year: null, mileage: null }));
    }

    function handleYearSelect(year: number) {
        setSelectedYear(year);
        setYearQuery(year.toString());
        setShowYears(false);
        setFormData(prev => ({ ...prev, year: year, mileage: null }));
    }

    function handleLoginClick() { setShowLoginModal(false); router.push("/login"); }
    function handleRegisterClick() { setShowLoginModal(false); router.push("/register"); }

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className={styles.container}>
            {/* LEFT SIDE: Illustration Section */}
            <aside className={styles.illustrationSection}>
                <div className={styles.illustrationContent}>
                    <CarInspectionIllustration className={styles.illustrationIcon} />
                    <h2 className={styles.illustrationTitle}>Inspección Vehicular</h2>
                    <p className={styles.illustrationDescription}>
                        Ingresa los datos de tu vehículo para comenzar con el proceso de inspección certificada.
                    </p>
                </div>

                {/* Sección de Tipos de Inspección */}
                <div className={styles.inspectionTypesSection}>
                    <div className={styles.inspectionTypesHeader}>
                        <div className={styles.inspectionTypesIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                        </div>
                        <div>
                            <h3 className={styles.inspectionTypesTitle}>Elige tu tipo de inspección</h3>
                            <p className={styles.inspectionTypesSubtitle}>Selecciona el servicio que mejor se adapte a tus necesidades</p>
                        </div>
                    </div>

                    <ul className={styles.inspectionTypesList}>
                        {inspectionTypes.map((inspection, index) => {
                            const isSelected = selectedInspection === inspection.id;
                            return (
                                <li
                                    key={inspection.id}
                                    onClick={() => {
                                        setSelectedInspection(inspection.id);
                                        setFormData(prev => ({ ...prev, tipoInspeccion: inspection.id }));
                                    }}
                                    className={isSelected ? styles.inspectionCardSelected : styles.inspectionCard}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className={styles.inspectionCardInner}>
                                        <div className={isSelected ? styles.checkCircleSelected : styles.checkCircle}>
                                            {isSelected && (
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                    <path d="M3 7L6 10L11 4" stroke="var(--shark--950)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className={styles.inspectionContent}>
                                            <h4 className={isSelected ? styles.inspectionTitleSelected : styles.inspectionTitle}>{inspection.title}</h4>
                                            <p className={styles.inspectionDescription}>{inspection.description}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); alert(`Ver más información sobre: ${inspection.title}`); }}
                                        className={styles.infoButton} aria-label={`Ver más información sobre ${inspection.title}`}>
                                        <svg className={styles.infoIcon} viewBox="0 0 20 20" fill="none">
                                            <circle cx="10" cy="10" r="8" strokeWidth="1.5" />
                                            <path d="M10 9V14" strokeWidth="1.5" strokeLinecap="round" />
                                            <circle className={styles.infoDot} cx="10" cy="6.5" r="1" />
                                        </svg>
                                    </button>
                                    {isSelected && <div className={styles.selectedBadge}>Seleccionado</div>}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </aside>

            {/* RIGHT SIDE: Form Section */}
            <main className={styles.formSection}>
                <div className={styles.formCard}>
                    <header className={styles.formHeader}>
                        <h1 className={styles.formTitle}>Datos para la inspección</h1>
                        <p className={styles.formSubtitle}>Completa todos los campos para registrar tu vehículo</p>
                    </header>

                    {error && (
                        <div className={styles.errorContainer} role="alert">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                <circle cx="10" cy="10" r="9" stroke="#FF1E39" strokeWidth="2" />
                                <path d="M10 6v5M10 13.5v.5" stroke="#FF1E39" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form} noValidate>
                        <div className={(showBrands || showModels || showYears) ? styles.formGroupVehicleDataActive : styles.formGroupVehicleData}>
                            <h2 className={styles.sectionTitle}>Datos del Vehículo</h2>
                            <div className={styles.formSectionDivider}>
                                <div className={styles.formRow}>
                                    {/* Brand Select */}
                                    <div className={showBrands ? styles.formGroupWithDropdownActive : styles.formGroupWithDropdown}>
                                        <label htmlFor="brandId" className={styles.label}>Marca<span className={styles.required}>*</span></label>
                                        <input type="text" name="marca" value={brandQuery} placeholder="Busca la marca"
                                            onChange={(e) => { setBrandQuery(e.target.value); setShowBrands(true); }}
                                            onFocus={() => { setShowModels(false); setShowYears(false); setShowBrands(true); }}
                                            className={styles.input} />
                                        {showBrands && (
                                            <ul className={styles.dropdown}>
                                                {filteredBrands.length > 0 ? (
                                                    filteredBrands.map((brand) => (
                                                        <li key={brand.id} className={styles.option} onClick={() => handleBrandSelect(brand)}>
                                                            <img src={brand.logo} alt={brand.name} className={styles.logo} />
                                                            <span>{brand.name}</span>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className={styles.noOption}>No se encontraron marcas</li>
                                                )}
                                            </ul>
                                        )}
                                        <span className={styles.helperText}>Elige la marca de tu vehículo</span>
                                    </div>

                                    {/* Model Select */}
                                    <div className={showModels ? styles.formGroupWithDropdownActive : styles.formGroupWithDropdown}>
                                        <label htmlFor="model" className={styles.label}>Modelo<span className={styles.required}>*</span></label>
                                        <input type="text" id="model" name="model" value={modelQuery}
                                            onChange={(e) => { setModelQuery(e.target.value); setShowModels(true); }}
                                            onFocus={() => { setShowBrands(false); setShowYears(false); setShowModels(true); }}
                                            placeholder={!selectedBrand ? "Primero selecciona una marca" : loadingModels ? "Cargando modelos..." : "Busca el modelo"}
                                            disabled={!selectedBrand || loadingModels} required className={styles.input} />
                                        {showModels && !loadingModels && selectedBrand && (
                                            <ul className={styles.dropdown}>
                                                {filteredModels.length > 0 ? (
                                                    filteredModels.map((model) => (
                                                        <li key={model.id} className={styles.option} onClick={() => handleModelSelect(model)}>
                                                            <span>{model.name}</span>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className={styles.noOption}>No se encontraron modelos</li>
                                                )}
                                            </ul>
                                        )}
                                        <span className={styles.helperText}>{!selectedBrand ? "Selecciona una marca primero" : "Nombre del modelo específico"}</span>
                                    </div>

                                    {/* Year Select */}
                                    <div className={showYears ? styles.formGroupWithDropdownActive : styles.formGroupWithDropdown}>
                                        <label htmlFor="year" className={styles.label}>Año del vehículo<span className={styles.required}>*</span></label>
                                        <input type="text" id="year" name="year" value={yearQuery}
                                            onChange={(e) => { if (/^\d*$/.test(e.target.value)) { setYearQuery(e.target.value); setShowYears(true); } }}
                                            onFocus={() => { setShowBrands(false); setShowModels(false); setShowYears(true); }}
                                            placeholder={!selectedModel ? "Primero selecciona un modelo" : "Busca el año"}
                                            disabled={!selectedModel} required className={styles.input} />
                                        {showYears && selectedModel && (
                                            <ul className={styles.dropdown}>
                                                {filteredYears.length > 0 ? (
                                                    filteredYears.slice(0, 10).map((year) => (
                                                        <li key={year} className={styles.option} onClick={() => handleYearSelect(year)}>
                                                            <span>{year}</span>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className={styles.noOption}>No se encontraron años</li>
                                                )}
                                            </ul>
                                        )}
                                        <span className={styles.helperText}>{!selectedModel ? "Selecciona un modelo primero" : "Selecciona el año de fabricación"}</span>
                                    </div>

                                    {/* Mileage Input */}
                                    <div className={styles.formGroup}>
                                        <label htmlFor="mileage" className={styles.label}>Kilometraje (Opcional)</label>
                                        <input type="text" id="mileage" name="mileage" value={mileageInput}
                                            onChange={(e) => {
                                                const clean = e.target.value.replace(/\D/g, "");
                                                setMileageInput(formatMileage(e.target.value));
                                                setFormData({ ...formData, mileage: clean === "" ? null : Number(clean) });
                                            }}
                                            placeholder={!selectedYear ? "Primero selecciona el año" : "ej. 50,000"}
                                            disabled={!selectedYear} className={styles.input} />
                                        <span className={styles.helperText}>{!selectedYear ? "Selecciona el año primero" : "Kilometraje actual en km"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Plate */}
                        <div className={styles.formGroup}>
                            <label htmlFor="placa" className={styles.label}>Nro. Placa <span className={styles.optional}>(opcional)</span></label>
                            <input type="text" id="placa" name="placa" placeholder="Ej: A1B-234" className={styles.input}
                                value={plate} onChange={(e) => { setPlate(formatPlate(e.target.value)); setFormData({ ...formData, placa: e.target.value }); }} maxLength={7} />
                            <p className={styles.helperText}>Ayúdanos a identificar mejor tu vehículo</p>
                        </div>

                        {/* Date & Time */}
                        <div className={styles.formGroup}>
                            <h2 className={styles.sectionTitle}>Seleccione su fecha y hora</h2>
                            <div className={styles.formSectionDivider}>
                                <label htmlFor="date">Fecha estimada <span className={styles.required}>*</span></label>
                                <div className={styles.formRow}>
                                    <input type="date" id="date" name="fechaEstimada" className="input border border-gray-300 text-center rounded-lg px-4"
                                        min={new Date().toISOString().split('T')[0]} value={date}
                                        onChange={(e) => { setDate(e.target.value); setFormData({ ...formData, fechaEstimada: e.target.value }); }} />
                                    <p className="text-xs text-gray-400">Esta fecha es referencial. Te confirmaremos según disponibilidad.</p>
                                </div>
                                <label htmlFor="radio" className="mt-4">Hora estimada<span className={styles.required}>*</span></label>
                                <div className="grid grid-cols-3 gap-3">
                                    {timeSlots.map((t) => (
                                        <label key={t}>
                                            <input type="radio" name="horaEstimada" value={t} className="sr-only peer"
                                                checked={formData.horaEstimada === t}
                                                onChange={(e) => setFormData({ ...formData, horaEstimada: e.target.value })} />
                                            <div className="text-center p-3 rounded-lg border cursor-pointer border-gray-200 peer-checked:border-yellow-400 peer-checked:bg-yellow-50">{t}</div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <p className={styles.helperText}>Indícanos cuándo te gustaría realizar la revisión</p>
                        </div>

                        <button type="submit" disabled={isSubmitting} className={`${styles.submitButton} ${isSubmitting ? styles.loading : ''}`}>
                            {isSubmitting ? "Guardando..." : "Agendar Vehículo"}
                        </button>
                    </form>
                </div>
            </main>

            <LoginRequiredModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLoginClick} onRegister={handleRegisterClick} />
        </div>
    );
}
