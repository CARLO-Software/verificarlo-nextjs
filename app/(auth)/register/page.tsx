"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./Register.module.css";
import { register } from "@/services/auth/auth.client";
import Link from 'next/link';
import { GoogleButton } from "@/app/components/GoogleButton";
import { useToast } from "@/app/components/Toast";
import Image from "next/image";

// Eye icons for password toggle
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// ============================================
// TYPES
// ============================================

type RegisterFormData = {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
};

type FormErrors = {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
};

type Step = "form" | "verify";

// ============================================
// REGISTER CONTENT (uses searchParams)
// ============================================

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();

    // Leer callbackUrl de los parámetros de la URL
    const callbackUrl = searchParams.get("callbackUrl");

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
    const [step, setStep] = useState<Step>("form");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

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

                // const prisma = new PrismaClient(); 
                // const existingUser = await prisma.user.findUnique({
                //     where: {value},
                // });

                return "";

            case "password":
                if (!value) {
                    return "La contraseña es requerida";
                }
                if (value.length < 8) {
                    return "La contraseña debe tener al menos 8 caracteres";
                }
                if (!/[A-Z]/.test(value)) {
                    return "La contraseña debe tener al menos una letra mayúscula";
                }
                if (!/\d/.test(value)) {
                    return "La contraseña debe tener al menos un número";
                }
                if (!/[!@#$%^&*()_+\-=\[\]{}|;':",./<>?]/.test(value)) {
                    return "La contraseña debe tener al menos un carácter especial (!@#$%^&*)";
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

            // Registro exitoso — pasar al paso de verificación
            setRegisteredEmail(dataToSend.email);
            setStep("verify");
            startResendCooldown();

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
    // VERIFICACIÓN DE EMAIL
    // ------------------------------------------

    function startResendCooldown() {
        setResendCooldown(60);
        const interval = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
    }

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault();
        if (isVerifying || verificationCode.length !== 6) return;

        setIsVerifying(true);
        setVerificationError(null);

        try {
            const res = await fetch("/api/auth/verify-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: registeredEmail, code: verificationCode }),
            });
            const data = await res.json();

            if (!res.ok) {
                setVerificationError(data.error || "Código incorrecto.");
                return;
            }

            showToast("¡Cuenta verificada! Ya puedes iniciar sesión.", "success");
            // Redirigir al login con el callbackUrl si existe
            const loginUrl = callbackUrl
                ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : "/login";
            setTimeout(() => router.push(loginUrl), 1500);
        } catch {
            setVerificationError("Error de conexión. Intenta de nuevo.");
        } finally {
            setIsVerifying(false);
        }
    }

    async function handleResend() {
        if (resendCooldown > 0) return;

        try {
            await fetch("/api/auth/resend-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: registeredEmail }),
            });
            showToast("Código reenviado a tu correo.", "success");
            startResendCooldown();
        } catch {
            showToast("No se pudo reenviar el código.", "error");
        }
    }

    // ------------------------------------------
    // RENDER
    // ------------------------------------------

    // Paso de verificación de email
    if (step === "verify") {
        return (
            <div className={styles.container}>
                <aside className={styles.illustrationSection}>
                    <Image
                        src="/assets/images/login-side.webp"
                        alt=""
                        fill
                        className={styles.illustrationImage}
                        aria-hidden="true"
                        priority
                    />
                    <div className={styles.illustrationContent}>
                        <h2 className={styles.illustrationTitle}>Casi listo</h2>
                        <p className={styles.illustrationDescription}>
                            Verifica tu correo para activar tu cuenta.
                        </p>
                    </div>
                </aside>

                <main className={styles.formSection}>
                    <div className={styles.formCard}>
                        <header className={styles.formHeader}>
                            <h1 className={styles.formTitle}>Verifica tu correo</h1>
                            <p className={styles.formSubtitle}>
                                Enviamos un código de 6 dígitos a{" "}
                                <strong>{registeredEmail}</strong>. Revisa tu bandeja de entrada.
                            </p>
                        </header>

                        {verificationError && (
                            <div className={styles.errorContainer} role="alert">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                    <circle cx="10" cy="10" r="9" stroke="#FF1E39" strokeWidth="2" />
                                    <path d="M10 6v5M10 13.5v.5" stroke="#FF1E39" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                <p>{verificationError}</p>
                            </div>
                        )}

                        <form onSubmit={handleVerify} className={styles.form} noValidate>
                            <div className={styles.formGroup}>
                                <label htmlFor="verificationCode" className={styles.label}>
                                    Código de verificación
                                    <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    id="verificationCode"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={verificationCode}
                                    onChange={(e) => {
                                        setVerificationError(null);
                                        setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                                    }}
                                    placeholder="000000"
                                    className={`${styles.input} ${styles.inputCode}`}
                                    autoComplete="one-time-code"
                                    autoFocus
                                />
                                <span className={styles.helperText}>
                                    El código expira en 15 minutos.
                                </span>
                            </div>

                            <button
                                type="submit"
                                disabled={isVerifying || verificationCode.length !== 6}
                                className={`${styles.submitButton} ${isVerifying ? styles.loading : ""}`}
                            >
                                {isVerifying ? "Verificando..." : "Verificar cuenta"}
                            </button>
                        </form>

                        <p className={styles.loginPrompt}>
                            ¿No recibiste el código?{" "}
                            <button
                                onClick={handleResend}
                                disabled={resendCooldown > 0}
                                className={styles.loginLink}
                                style={{ background: "none", border: "none", cursor: resendCooldown > 0 ? "default" : "pointer", padding: 0, opacity: resendCooldown > 0 ? 0.5 : 1 }}
                            >
                                {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : "Reenviar código"}
                            </button>
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* LEFT SIDE: Illustration Section */}
            <aside className={styles.illustrationSection}>
                <Image
                    src="/assets/images/login-side.webp"
                    alt=""
                    fill
                    className={styles.illustrationImage}
                    aria-hidden="true"
                    priority
                />
                <div className={styles.illustrationContent}>
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
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={showPassword ? "text" : "password"}
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
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                            <span id="password-helper" className={styles.helperText}>
                                Mínimo 8 caracteres, mayúscula, número y símbolo (!@#$%...)
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
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
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
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
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
                            callbackUrl={callbackUrl || "/perfil"}
                        />

                        {/* Login Link */}
                        <p className={styles.loginPrompt}>
                            ¿Ya tienes una cuenta?{" "}
                            <Link
                                href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
                                className={styles.loginLink}
                            >
                                Inicia sesión aquí
                            </Link>
                        </p>
                    </form>
                </div>
            </main>
        </div>
    );
}

// ============================================
// MAIN REGISTER COMPONENT (with Suspense boundary)
// ============================================

export default function Register() {
    return (
        <Suspense fallback={<div className={styles.container}>Cargando...</div>}>
            <RegisterContent />
        </Suspense>
    );
}