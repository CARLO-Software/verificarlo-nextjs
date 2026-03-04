"use client";

import styles from "./Login.module.css";
import { useEffect, useState } from "react";
import { useLogin } from "./useLogin";
import { GoogleButton } from "@/app/components/GoogleButton";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// ============================================
// SVG ILLUSTRATION COMPONENT
// Secure login illustration matching brand style
// ============================================

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
      <circle
        cx="100"
        cy="100"
        r="90"
        fill="var(--bright-sun--200)"
        opacity="0.4"
      />
      <circle
        cx="100"
        cy="100"
        r="70"
        fill="var(--bright-sun--100)"
        opacity="0.3"
      />

      {/* Lock body */}
      <rect
        x="60"
        y="90"
        width="80"
        height="70"
        rx="8"
        fill="var(--shark--950)"
      />

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
      <rect
        x="96"
        y="118"
        width="8"
        height="20"
        rx="2"
        fill="var(--bright-sun--300)"
      />

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
      <path d="M33 62 A12 12 0 0 1 57 62" fill="var(--shark--950)" />
    </svg>
  );
}

// ============================================
// MAIN LOGIN COMPONENT
// ============================================

export default function Login() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSuspended = searchParams.get("suspended") === "true";

  useEffect(() => {
    const error = searchParams.get("error");

    if (error === "AccessDenied") {
      setErrorMessage(
        "Tu cuenta no tiene permisos para acceder. Si crees que es un error, contacta al administrador.",
      );
    }
  }, [searchParams]);

  const {
    formData,
    errors,
    generalError,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useLogin();

  return (
    <>
      {errorMessage && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className={styles.container}>
        {/*
              LEFT SIDE: Illustration Section

              This creates visual balance and makes the form feel more welcoming.
              Hidden on small screens where space is limited.
            */}
        <aside className={styles.illustrationSection}>
          <div className={styles.illustrationContent}>
            <LoginIllustration className={styles.illustrationIcon} />
            <h2 className={styles.illustrationTitle}>Accede a tu cuenta</h2>
            <p className={styles.illustrationDescription}>
              Inicia sesión para gestionar tus inspecciones y acceder a tu
              historial.
            </p>
          </div>
        </aside>

        {/* RIGHT SIDE: Form Section */}
        <main className={styles.formSection}>
          <div className={styles.formCard}>
            {/* Suspended Banner */}
            {isSuspended && (
              <div
                className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
                role="alert"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="mt-0.5 shrink-0 text-red-500"
                  aria-hidden="true"
                >
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                  <path d="M10 6v5M10 13.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Tu cuenta ha sido suspendida
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Contacta al administrador para más información.
                  </p>
                </div>
              </div>
            )}

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
                  <circle
                    cx="10"
                    cy="10"
                    r="9"
                    stroke="#FF1E39"
                    strokeWidth="2"
                  />
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

              {/* Divider */}
              <div className={styles.divider}>
                <span className={styles.dividerLine}></span>
                <span className={styles.dividerText}>o</span>
                <span className={styles.dividerLine}></span>
              </div>

              {/* Google Button */}
              <GoogleButton text="Continuar con Google" />

              {/* Register Link */}
              <p className={styles.registerPrompt}>
                ¿No tienes una cuenta?{" "}
                <Link href="/register" className={styles.registerLink}>
                  Regístrate aquí
                </Link>
              </p>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}
