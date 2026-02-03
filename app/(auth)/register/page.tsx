"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Register.module.css";
import { register } from "@/services/auth/auth.client";
import Link from 'next/link';
import { GoogleButton } from "@/app/components/GoogleButton";
import { useToast } from "@/app/components/Toast";
import { PrismaClient } from "@prisma/client";

// ============================================
// TYPES - Define the shape of our form data
// ============================================

/**
 * Form Data Type
 *
 * Notice we have confirmPassword here for validation,
 * but we won't send it to the API (it's just for UI validation)
 */
type RegisterFormData = {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
};

/**
 * Form Errors Type
 *
 * Each field can have its own error message.
 * Empty string means no error.
 */
type FormErrors = {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
};

// ============================================
// SVG ILLUSTRATION COMPONENT
// New user registration illustration
// ============================================

function RegisterIllustration({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {/* Background circles */}
            <circle cx="100" cy="100" r="90" fill="var(--bright-sun--200)" opacity="0.4" />
            <circle cx="100" cy="100" r="70" fill="var(--bright-sun--100)" opacity="0.3" />

            {/* User avatar circle */}
            <circle cx="100" cy="75" r="35" fill="var(--shark--950)" />
            <circle cx="100" cy="65" r="15" fill="var(--bright-sun--100)" />
            <path
                d="M78 90 A22 22 0 0 1 122 90"
                fill="var(--bright-sun--100)"
            />

            {/* Form/clipboard base */}
            <rect x="55" y="105" width="90" height="70" rx="8" fill="var(--shark--950)" />
            <rect x="62" y="112" width="76" height="56" rx="4" fill="var(--basics--white)" />

            {/* Form lines (representing form fields) */}
            <rect x="70" y="122" width="60" height="6" rx="3" fill="var(--shark--200)" />
            <rect x="70" y="136" width="45" height="6" rx="3" fill="var(--shark--200)" />
            <rect x="70" y="150" width="55" height="6" rx="3" fill="var(--shark--200)" />

            {/* Plus badge (add user) */}
            <circle cx="155" cy="55" r="22" fill="var(--bright-sun--300)" />
            <path
                d="M155 45 V65 M145 55 H165"
                stroke="var(--shark--950)"
                strokeWidth="4"
                strokeLinecap="round"
            />

            {/* Decorative sparkles */}
            <circle cx="40" cy="60" r="5" fill="var(--bright-sun--400)" />
            <circle cx="165" cy="120" r="4" fill="var(--bright-sun--400)" />
            <circle cx="35" cy="140" r="3" fill="var(--bright-sun--300)" />
        </svg>
    );
}

// ============================================
// MAIN REGISTER COMPONENT
// ============================================

export default function Register() {
    const router = useRouter();
    const { showToast } = useToast();

    // ------------------------------------------
    // STATE VARIABLES
    // ------------------------------------------

    const [formData, setFormData] = useState<RegisterFormData>({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState<FormErrors>({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [generalError, setGeneralError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ------------------------------------------
    // VALIDATION FUNCTIONS
    // ------------------------------------------

    /**
     * Email Validation
     * Same regex as Login component for consistency
     */
    function isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate a single field
     *
     * Note how confirmPassword validation uses formData.password
     * to compare the two values. This is a common pattern when
     * one field's validation depends on another field's value.
     */
    function validateField(name: keyof RegisterFormData, value: string): string {
        switch (name) {
            case "fullName":
                if (!value.trim()) {
                    return "El nombre completo es requerido";
                }
                if (value.trim().length < 2) {
                    return "El nombre debe tener al menos 2 caracteres";
                }
                // Check for at least two words (first and last name)
                if (value.trim().split(/\s+/).length < 2) {
                    return "Por favor ingresa tu nombre y apellido";
                }
                return "";

            case "email":
                if (!value.trim()) {
                    return "El correo electrónico es requerido";
                }
                if (!isValidEmail(value)) {
                    return "Ingresa un correo electrónico válido";
                }

                const prisma = new PrismaClient(); 
                const existingUser = await prisma.user.findUnique({
                    where: {value},
                });

                return "";

            case "password":
                if (!value) {
                    return "La contraseña es requerida";
                }
                if (value.length < 8) {
                    return "La contraseña debe tener al menos 8 caracteres";
                }
                // Check for at least one number
                if (!/\d/.test(value)) {
                    return "La contraseña debe contener al menos un número";
                }
                // Check for at least one letter
                if (!/[a-zA-Z]/.test(value)) {
                    return "La contraseña debe contener al menos una letra";
                }
                return "";

            case "confirmPassword":
                if (!value) {
                    return "Por favor confirma tu contraseña";
                }
                // Compare with the password field
                if (value !== formData.password) {
                    return "Las contraseñas no coinciden";
                }
                return "";

            default:
                return "";
        }
    }

    /**
     * Validate all fields before submission
     */
    function validateForm(): boolean {
        
        const newErrors: FormErrors = {
            fullName: validateField("fullName", formData.fullName),
            email: validateField("email", formData.email),
            password: validateField("password", formData.password),
            confirmPassword: validateField("confirmPassword", formData.confirmPassword),
        };

        setErrors(newErrors);

        return !Object.values(newErrors).some((error) => error !== "");
    }

    // ------------------------------------------
    // EVENT HANDLERS
    // ------------------------------------------

    /**
     * Handle Input Changes
     *
     * Additional logic here: when password changes and confirmPassword
     * has a value, we re-validate confirmPassword to update the
     * "passwords don't match" error in real-time.
     */
    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        /**
         * const name = event.target.name;
         * const value = event.target.value;
         */
        const { name, value } = event.target;

        // Clear general error when user starts typing
        if (generalError) setGeneralError(null);

        // Clear field-specific error when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }

        // Update form data
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        /**
         * Special case: Re-validate confirmPassword when password changes
         *
         * This provides better UX - if the user has already typed in
         * confirmPassword and then goes back to change password,
         * we immediately show if they no longer match.
         */
        if (name === "password" && formData.confirmPassword) {
            const confirmError = value !== formData.confirmPassword
                ? "Las contraseñas no coinciden"
                : "";
            setErrors((prev) => ({
                ...prev,
                confirmPassword: confirmError,
            }));
        }
    }

    /**
     * Handle Input Blur
     * Validates the field when user leaves it
     */
    function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        const error = validateField(name as keyof RegisterFormData, value);
        setErrors((prev) => ({
            ...prev,
            [name]: error,
        }));
    }

    /**
     * Handle Form Submission
     */
    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (isSubmitting) return;

        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            setGeneralError(null);

            // Prepare data for API
            // Note: We don't send confirmPassword to the server
            const dataToSend = {
                fullName: formData.fullName.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            };

            // TODO: Replace with actual API call when backend is ready
            // Example API call:
            await register(dataToSend);

            // Success - mostrar toast y redirigir al login
            showToast("¡Cuenta creada exitosamente! Ya puedes iniciar sesión.", "success");

            // Reset form
            setFormData({
                fullName: "",
                email: "",
                password: "",
                confirmPassword: "",
            });

            // Redirigir al login después de un momento
            setTimeout(() => {
                router.push("/login");
            }, 1500);

        } catch (err) {
            setGeneralError(
                err instanceof Error
                    ? err.message
                    : "Error al crear la cuenta. Por favor, intenta nuevamente."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    // ------------------------------------------
    // RENDER
    // ------------------------------------------

    return (
        <div className={styles.container}>
            {/* LEFT SIDE: Illustration Section */}
            <aside className={styles.illustrationSection}>
                <div className={styles.illustrationContent}>
                    <RegisterIllustration className={styles.illustrationIcon} />
                    <h2 className={styles.illustrationTitle}>
                        Crea tu cuenta
                    </h2>
                    <p className={styles.illustrationDescription}>
                        Regístrate para acceder a todos los servicios de inspección vehicular.
                    </p>
                </div>
            </aside>

            {/* RIGHT SIDE: Form Section */}
            <main className={styles.formSection}>
                <div className={styles.formCard}>
                    {/* Form Header */}
                    <header className={styles.formHeader}>
                        <h1 className={styles.formTitle}>Registro</h1>
                        <p className={styles.formSubtitle}>
                            Completa tus datos para crear una cuenta
                        </p>
                    </header>

                    {/* General Error Alert */}
                    {generalError && (
                        <div className={styles.errorContainer} role="alert">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                aria-hidden="true"
                            >
                                <circle cx="10" cy="10" r="9" stroke="#FF1E39" strokeWidth="2" />
                                <path
                                    d="M10 6v5M10 13.5v.5"
                                    stroke="#FF1E39"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <p>{generalError}</p>
                        </div>
                    )}

                    {/* Registration Form */}
                    <form onSubmit={handleSubmit} className={styles.form} noValidate>
                        {/* Full Name Field */}
                        <div className={styles.formGroup}>
                            <label htmlFor="fullName" className={styles.label}>
                                Nombre completo
                                <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Juan Pérez García"
                                required
                                autoComplete="name"
                                className={`${styles.input} ${errors.fullName ? styles.inputError : ""}`}
                                aria-describedby="fullName-helper fullName-error"
                                aria-invalid={errors.fullName ? "true" : "false"}
                            />
                            <span id="fullName-helper" className={styles.helperText}>
                                Ingresa tu nombre y apellido
                            </span>
                            {errors.fullName && (
                                <span
                                    id="fullName-error"
                                    className={styles.errorText}
                                    role="alert"
                                >
                                    {errors.fullName}
                                </span>
                            )}
                        </div>

                        {/* Email Field */}
                        <div className={styles.formGroup}>
                            <label htmlFor="email" className={styles.label}>
                                Correo electrónico
                                <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="tucorreo@ejemplo.com"
                                required
                                autoComplete="email"
                                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                                aria-describedby="email-error"
                                aria-invalid={errors.email ? "true" : "false"}
                            />
                            {errors.email && (
                                <span
                                    id="email-error"
                                    className={styles.errorText}
                                    role="alert"
                                >
                                    {errors.email}
                                </span>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className={styles.formGroup}>
                            <label htmlFor="password" className={styles.label}>
                                Contraseña
                                <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="••••••••"
                                required
                                autoComplete="new-password"
                                className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                                aria-describedby="password-helper password-error"
                                aria-invalid={errors.password ? "true" : "false"}
                            />
                            <span id="password-helper" className={styles.helperText}>
                                Mínimo 8 caracteres, incluye letras y números
                            </span>
                            {errors.password && (
                                <span
                                    id="password-error"
                                    className={styles.errorText}
                                    role="alert"
                                >
                                    {errors.password}
                                </span>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div className={styles.formGroup}>
                            <label htmlFor="confirmPassword" className={styles.label}>
                                Confirmar contraseña
                                <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="••••••••"
                                required
                                autoComplete="new-password"
                                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                                aria-describedby="confirmPassword-error"
                                aria-invalid={errors.confirmPassword ? "true" : "false"}
                            />
                            {errors.confirmPassword && (
                                <span
                                    id="confirmPassword-error"
                                    className={styles.errorText}
                                    role="alert"
                                >
                                    {errors.confirmPassword}
                                </span>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`${styles.submitButton} ${isSubmitting ? styles.loading : ""}`}
                            aria-busy={isSubmitting}
                        >
                            {isSubmitting ? "Creando cuenta..." : "Crear Cuenta"}
                        </button>

                        {/* Divider */}
                        <div className={styles.divider}>
                            <span className={styles.dividerLine}></span>
                            <span className={styles.dividerText}>o</span>
                            <span className={styles.dividerLine}></span>
                        </div>

                        {/* Google Button */}
                        <GoogleButton
                            text="Registrarse con Google"
                            callbackUrl="/"
                        />

                        {/* Login Link */}
                        <p className={styles.loginPrompt}>
                            ¿Ya tienes una cuenta?{" "}
                            <Link href="/login" className={styles.loginLink}>
                                Inicia sesión aquí
                            </Link>
                        </p>
                    </form>
                </div>
            </main>
        </div>
    );
}