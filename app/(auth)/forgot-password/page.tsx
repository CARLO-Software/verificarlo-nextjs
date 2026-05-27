"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ForgotPassword.module.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al enviar el correo.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

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
          <h2 className={styles.illustrationTitle}>¿Olvidaste tu contraseña?</h2>
          <p className={styles.illustrationDescription}>
            Te enviamos un enlace para que puedas restablecerla fácilmente.
          </p>
        </div>
      </aside>

      <main className={styles.formSection}>
        <div className={styles.formCard}>
          {submitted ? (
            <>
              <div className={styles.successIcon}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="16" fill="#dcfce7" />
                  <path d="M10 16l4 4 8-8" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className={styles.formTitle}>Revisa tu correo</h1>
              <p className={styles.formSubtitle}>
                Si <strong>{email}</strong> está registrado, recibirás un enlace
                para restablecer tu contraseña en los próximos minutos.
              </p>
              <Link href="/login" className={styles.backLink}>
                Volver al inicio de sesión
              </Link>
            </>
          ) : (
            <>
              <header className={styles.formHeader}>
                <h1 className={styles.formTitle}>Restablecer contraseña</h1>
                <p className={styles.formSubtitle}>
                  Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
                </p>
              </header>

              {error && (
                <div className={styles.errorContainer} role="alert">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" stroke="#FF1E39" strokeWidth="2" />
                    <path d="M10 6v5M10 13.5v.5" stroke="#FF1E39" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className={styles.form} noValidate>
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Correo electrónico <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => { setError(null); setEmail(e.target.value); }}
                    placeholder="tucorreo@ejemplo.com"
                    required
                    autoComplete="email"
                    autoFocus
                    className={styles.input}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className={`${styles.submitButton} ${loading ? styles.loading : ""}`}
                >
                  {loading ? "Enviando..." : "Enviar enlace"}
                </button>
              </form>

              <p className={styles.loginPrompt}>
                <Link href="/login" className={styles.loginLink}>
                  ← Volver al inicio de sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
