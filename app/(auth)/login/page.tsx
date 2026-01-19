"use client";
/**
 * Login.tsx
 *
 * Login Form Component
 *
 * =====================================================
 * LEARNING NOTES FOR REACT/NEXT.JS BEGINNERS
 * =====================================================
 *
 * 1. "use client" DIRECTIVE:
 *    - Next.js 14 uses Server Components by default
 *    - This directive tells Next.js this component needs browser features
 *    - Required when using: useState, useEffect, event handlers, browser APIs
 *
 * 2. COMPONENT STRUCTURE:
 *    - We define TypeScript types first (for type safety)
 *    - Then state variables with useState
 *    - Then handler functions
 *    - Finally the JSX return statement
 *
 * 3. FORM VALIDATION:
 *    - Client-side validation runs in the browser before submission
 *    - Always validate on the server too (not shown here)
 *    - We use the native HTML5 validation attributes + custom logic
 *
 * DESIGN DECISIONS:
 * - Split layout matches IngresarDatosVehiculo for consistency
 * - Uses VerifiCARLO design system: bright-sun (yellow) and shark (gray)
 * - Focus states use brand yellow for consistency
 */

import { useState } from "react";
import styles from "./Login.module.css";

// ============================================
// TYPES - Define the shape of our form data
// ============================================

/**
 * TypeScript Type Definition
 *
 * This defines what properties our form data object will have.
 * TypeScript will warn us if we try to use a property that doesn't exist
 * or if we assign the wrong type of value.
 *
 * Example: formData.email must be a string, not a number
 */
type LoginFormData = {
    email: string;
    password: string;
};

/**
 * Type for tracking which fields have errors
 * Each field can have an error message (string) or no error (empty string)
 */
type FormErrors = {
    email: string;
    password: string;
};

// ============================================
// SVG ILLUSTRATION COMPONENT
// Secure login illustration matching brand style
// ============================================

/**
 * SVG Illustration Component
 *
 * SVGs (Scalable Vector Graphics) are perfect for illustrations because:
 * - They scale without losing quality (unlike PNG/JPG)
 * - File size is small
 * - We can use CSS variables for colors (theming!)
 *
 * The className prop allows the parent component to add styles
 */
function LoginIllustration({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true" // Hides from screen readers (decorative)
        >
            {/* Background circles for visual depth */}
            <circle cx="100" cy="100" r="90" fill="var(--bright-sun--200)" opacity="0.4" />
            <circle cx="100" cy="100" r="70" fill="var(--bright-sun--100)" opacity="0.3" />

            {/* Lock body */}
            <rect x="60" y="90" width="80" height="70" rx="8" fill="var(--shark--950)" />

            {/* Lock shackle (the U-shaped part) */}
            <path
                d="M75 90 V70 A25 25 0 0 1 125 70 V90"
                fill="none"
                stroke="var(--shark--950)"
                strokeWidth="10"
                strokeLinecap="round"
            />

            {/* Keyhole */}
            <circle cx="100" cy="118" r="12" fill="var(--bright-sun--300)" />
            <rect x="96" y="118" width="8" height="20" rx="2" fill="var(--bright-sun--300)" />

            {/* Decorative check mark badge */}
            <circle cx="155" cy="55" r="20" fill="var(--bright-sun--300)" />
            <path
                d="M145 55 L152 62 L165 49"
                stroke="var(--shark--950)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />

            {/* User icon */}
            <circle cx="45" cy="50" r="15" fill="var(--shark--300)" />
            <circle cx="45" cy="42" r="7" fill="var(--shark--950)" />
            <path
                d="M33 62 A12 12 0 0 1 57 62"
                fill="var(--shark--950)"
            />
        </svg>
    );
}

// ============================================
// MAIN LOGIN COMPONENT
// ============================================

export default function Login() {
    // ------------------------------------------
    // STATE VARIABLES
    // ------------------------------------------

    /**
     * useState Hook Explanation
     *
     * useState is a React Hook that lets you add state to functional components.
     *
     * Syntax: const [value, setValue] = useState(initialValue)
     *
     * - value: The current state value
     * - setValue: Function to update the state
     * - initialValue: What the state starts as
     *
     * When you call setValue(), React re-renders the component with the new value.
     */

    // Form data state - stores what the user types
    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: "",
    });

    // Error state - stores validation error messages for each field
    const [errors, setErrors] = useState<FormErrors>({
        email: "",
        password: "",
    });

    // General error message (for API errors, etc.)
    const [generalError, setGeneralError] = useState<string | null>(null);

    // Loading state - true while form is submitting
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ------------------------------------------
    // VALIDATION FUNCTIONS
    // ------------------------------------------

    /**
     * Email Validation
     *
     * This regex (Regular Expression) checks if the email format is valid.
     * It's a simple check - for production, you'd want more robust validation.
     *
     * The regex breakdown:
     * - ^[^\s@]+ : Starts with one or more characters that aren't spaces or @
     * - @        : Must have exactly one @
     * - [^\s@]+  : Followed by characters that aren't spaces or @
     * - \.       : Must have a dot
     * - [^\s@]+$ : Ends with characters that aren't spaces or @
     */
    function isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate a single field
     *
     * This function validates one field at a time and returns the error message.
     * It's called when the user leaves a field (onBlur) and on form submit.
     */
    function validateField(name: keyof LoginFormData, value: string): string {
        switch (name) {
            case "email":
                if (!value.trim()) {
                    return "El correo electrónico es requerido";
                }
                if (!isValidEmail(value)) {
                    return "Ingresa un correo electrónico válido";
                }
                return "";

            case "password":
                if (!value) {
                    return "La contraseña es requerida";
                }
                if (value.length < 6) {
                    return "La contraseña debe tener al menos 6 caracteres";
                }
                return "";

            default:
                return "";
        }
    }

    /**
     * Validate all fields before submission
     *
     * Returns true if all fields are valid, false otherwise.
     * Also updates the errors state to show all error messages.
     */
    function validateForm(): boolean {
        const newErrors: FormErrors = {
            email: validateField("email", formData.email),
            password: validateField("password", formData.password),
        };

        setErrors(newErrors);

        // Check if any error exists
        // Object.values() gets all values from the object
        // .some() returns true if any value matches the condition
        return !Object.values(newErrors).some((error) => error !== "");
    }

    // ------------------------------------------
    // EVENT HANDLERS
    // ------------------------------------------

    /**
     * Handle Input Changes
     *
     * This function runs every time the user types in an input field.
     *
     * event.target gives us the input element that triggered the event.
     * We destructure { name, value } to get the input's name and current value.
     *
     * The spread operator (...formData) copies all existing values,
     * then [name]: value overwrites just the changed field.
     */
    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;

        // Clear errors when user starts typing
        if (generalError) setGeneralError(null);
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }

        setFormData({
            ...formData,
            [name]: value,
        });
    }

    /**
     * Handle Input Blur (when user leaves a field)
     *
     * This validates the field when the user clicks/tabs away from it.
     * Provides immediate feedback without waiting for form submission.
     */
    function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        const error = validateField(name as keyof LoginFormData, value);
        setErrors((prev) => ({
            ...prev,
            [name]: error,
        }));
    }

    function setShowRegisterModal(show: boolean) {
        if (show) {
            alert("Usuario no registrado. Mostrar modal de registro.");
        }
    }
    /**
     * Handle Form Submission
     *
     * async/await explanation:
     * - async: Marks the function as asynchronous (can wait for operations)
     * - await: Pauses execution until the Promise resolves
     *
     * event.preventDefault() stops the browser from doing its default
     * form submission (which would reload the page).
     */
    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        // Don't submit if already submitting
        if (isSubmitting) return;

        // Validate all fields first
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            setGeneralError(null);

            // Prepare data for API
            const dataToSend = {
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            };

            // TODO: Replace with actual API call when backend is ready
            // Example API call:
            const res = await fetch("http://localhost:8000/agendar-vehiculo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // Include cookies for session
                body: JSON.stringify(dataToSend),
            });

            if (res.status === 401) {
                // 👇 UX correcta
                setShowRegisterModal(true);
                return;
            }



            // if (!res.ok) {
            //     const errorData = await res.json();
            //     throw new Error(errorData.message || "Error al iniciar sesión");
            // }
            const userData = await res.json();
            // Handle successful login (redirect, store token, etc.)

            // Simulate API call for demo (remove in production)
            await new Promise((resolve) => setTimeout(resolve, 1500));
            console.log("Login data:", dataToSend);

            // Success - redirect or show success message
            alert("¡Inicio de sesión exitoso!");

        } catch (err) {
            // Handle errors
            setGeneralError(
                err instanceof Error
                    ? err.message
                    : "Error al iniciar sesión. Por favor, intenta nuevamente."
            );
        } finally {
            // This runs whether the try block succeeded or failed
            setIsSubmitting(false);
        }
    }

    // ------------------------------------------
    // RENDER (JSX)
    // ------------------------------------------

    /**
     * JSX Explanation
     *
     * JSX is a syntax extension that lets us write HTML-like code in JavaScript.
     * It gets compiled to React.createElement() calls.
     *
     * Key differences from HTML:
     * - className instead of class (class is reserved in JS)
     * - htmlFor instead of for (for is reserved in JS)
     * - camelCase for attributes (onClick, onChange, etc.)
     * - {} to embed JavaScript expressions
     */

return (
    <div className={styles.container}>
        {/*
              LEFT SIDE: Illustration Section

              This creates visual balance and makes the form feel more welcoming.
              Hidden on small screens where space is limited.
            */}
        <aside className={styles.illustrationSection}>
            <div className={styles.illustrationContent}>
                <LoginIllustration className={styles.illustrationIcon} />
                <h2 className={styles.illustrationTitle}>
                    Accede a tu cuenta
                </h2>
                <p className={styles.illustrationDescription}>
                    Inicia sesión para gestionar tus inspecciones y acceder a tu historial.
                </p>
            </div>
        </aside>

        {/* RIGHT SIDE: Form Section */}
        <main className={styles.formSection}>
            <div className={styles.formCard}>
                {/* Form Header */}
                <header className={styles.formHeader}>
                    <h1 className={styles.formTitle}>Iniciar Sesión</h1>
                    <p className={styles.formSubtitle}>
                        Ingresa tus credenciales para continuar
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

                {/* Login Form */}
                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                    {/*
                          noValidate disables browser's default validation UI
                          We use our own validation logic for better UX
                        */}

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
                        {/* Error message for email */}
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
                            autoComplete="current-password"
                            className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                            aria-describedby="password-error"
                            aria-invalid={errors.password ? "true" : "false"}
                        />
                        {/* Error message for password */}
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

                    {/* Forgot Password Link */}
                    <div className={styles.forgotPassword}>
                        <a href="#" className={styles.forgotPasswordLink}>
                            ¿Olvidaste tu contraseña?
                        </a>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`${styles.submitButton} ${isSubmitting ? styles.loading : ""}`}
                        aria-busy={isSubmitting}
                    >
                        {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
                    </button>

                    {/* Register Link */}
                    <p className={styles.registerPrompt}>
                        ¿No tienes una cuenta?{" "}
                        <a href="#" className={styles.registerLink}>
                            Regístrate aquí
                        </a>
                    </p>
                </form>
            </div>
        </main>
    </div>
);

}