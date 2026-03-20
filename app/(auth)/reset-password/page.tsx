"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "../forgot-password/ForgotPassword.module.css";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function validate(): string | null {
    if (password.length < 8) return "Mínimo 8 caracteres.";
    if (!/[A-Z]/.test(password)) return "Debe incluir al menos una mayúscula.";
    if (!/\d/.test(password)) return "Debe incluir al menos un número.";
    if (!/[!@#$%^&*()_+\-=\[\]{}|;':",./<>?]/.test(password))
      return "Debe incluir al menos un carácter especial (!@#$%...).";
    if (password !== confirmPassword) return "Las contraseñas no coinciden.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    if (loading || !token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al restablecer la contraseña.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className={styles.formCard}>
        <h1 className={styles.formTitle}>Enlace inválido</h1>
        <p className={styles.formSubtitle}>
          Este enlace no es válido o ha expirado.
        </p>
        <Link href="/forgot-password" className={styles.backLink}>
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.formCard}>
      {success ? (
        <>
          <div className={styles.successIcon}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="#dcfce7" />
              <path d="M10 16l4 4 8-8" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className={styles.formTitle}>¡Contraseña actualizada!</h1>
          <p className={styles.formSubtitle}>
            Redirigiendo al inicio de sesión...
          </p>
        </>
      ) : (
        <>
          <header className={styles.formHeader}>
            <h1 className={styles.formTitle}>Nueva contraseña</h1>
            <p className={styles.formSubtitle}>
              Elige una contraseña segura para tu cuenta.
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
              <label htmlFor="password" className={styles.label}>
                Nueva contraseña <span className={styles.required}>*</span>
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => { setError(null); setPassword(e.target.value); }}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                autoFocus
                className={styles.input}
              />
              <span className={styles.helperText}>
                Mínimo 8 caracteres, mayúscula, número y símbolo (!@#$%...)
              </span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirmar contraseña <span className={styles.required}>*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => { setError(null); setConfirmPassword(e.target.value); }}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className={`${styles.submitButton} ${loading ? styles.loading : ""}`}
            >
              {loading ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div className={styles.container}>
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
          <h2 className={styles.illustrationTitle}>Nueva contraseña</h2>
          <p className={styles.illustrationDescription}>
            Elige una contraseña segura para proteger tu cuenta.
          </p>
        </div>
      </aside>
      <main className={styles.formSection}>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </main>
    </div>
  );
}
