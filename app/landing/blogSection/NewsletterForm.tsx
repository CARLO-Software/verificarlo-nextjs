"use client";

import { useState } from "react";
import styles from "./NewsletterForm.module.css";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      setStatus("error");
      setMessage("Por favor ingresa tu email");
      return;
    }

    if (!accepted) {
      setStatus("error");
      setMessage("Debes aceptar los términos y condiciones");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("/api/blog/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message);
        setEmail("");
        setAccepted(false);
      } else {
        setStatus("error");
        setMessage(data.error || "Error al suscribirse");
      }
    } catch {
      setStatus("error");
      setMessage("Error de conexión. Intenta nuevamente.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputGroup}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Tu correo electrónico"
          className={styles.input}
          disabled={status === "loading"}
        />
        <button
          type="submit"
          className={styles.button}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Enviando..." : "Suscribirme"}
        </button>
      </div>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          disabled={status === "loading"}
        />
        <span>
          Acepto recibir información y promociones de Verificarlo
        </span>
      </label>

      {message && (
        <p className={`${styles.message} ${styles[status]}`}>
          {message}
        </p>
      )}
    </form>
  );
}
