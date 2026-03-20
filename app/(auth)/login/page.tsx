"use client";

import styles from "./Login.module.css";
import { Suspense, useEffect, useState } from "react";
import { useLogin } from "./useLogin";
import { GoogleButton } from "@/app/components/GoogleButton";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// ============================================
// LOGIN CONTENT (uses searchParams)
// ============================================

function LoginContent() {
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
          <Image
            src="/assets/images/login-side.png"
            alt=""
            fill
            className={styles.illustrationImage}
            aria-hidden="true"
            priority
          />
          <div className={styles.illustrationContent}>
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
                <a href="/forgot-password" className={styles.forgotPasswordLink}>
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

// ============================================
// MAIN LOGIN COMPONENT (with Suspense boundary)
// ============================================

export default function Login() {
  return (
    <Suspense fallback={<div className={styles.container}>Cargando...</div>}>
      <LoginContent />
    </Suspense>
  );
}
