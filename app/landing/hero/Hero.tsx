"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Hero.module.css";

function formatPlate(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length <= 3) return clean;
  return clean.slice(0, 3) + "-" + clean.slice(3, 6);
}

function cleanPlate(formatted: string): string {
  return formatted.replace(/-/g, "");
}

export default function Hero() {
  const [plate, setPlate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const router = useRouter();

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    const clean = raw.replace(/-/g, "");
    if (clean.length <= 6) {
      setPlate(formatPlate(clean));
    }
  };

  const handleConsultar = () => {
    if (cleanPlate(plate).length < 6) return;
    setShowModal(true);
    document.body.style.overflow = "hidden";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConsultar();
  };

  const closeModal = () => {
    setShowModal(false);
    document.body.style.overflow = "";
  };

  const goToConsultar = () => {
    closeModal();
    router.push(`/consultar?placa=${encodeURIComponent(cleanPlate(plate))}`);
  };

  const handleSubmitEmail = () => {
    // TODO: guardar email en backend
    goToConsultar();
  };

  const handleSubmitWhatsApp = () => {
    // TODO: guardar teléfono en backend
    goToConsultar();
  };

  return (
    <>
      <header className={styles.hero} id="hero">
        <div className={styles.videoContainer}>
          <video
            autoPlay
            muted
            loop
            playsInline
            className={styles.videoBackground}
            poster="/assets/images/frame-hero.webp"
          >
            <source src="/assets/videos/hero-video-2.mp4" type="video/mp4" />
          </video>
          <div className={styles.videoOverlay} aria-hidden="true" />
        </div>

        <div className={styles.content}>
          <h1 className={styles.title}>
            ¿Vas a comprar
            <br />
            un auto usado?
          </h1>
          <p className={styles.subtitle}>
            Verifica gratis cualquier placa antes de comprar
          </p>

          <div className={styles.plateBox}>
            <div className={styles.plateInput}>
              <div className={styles.plateFlag}>
                <span className={styles.plateFlagCode}>PE</span>
                <div className={styles.plateFlagStripes}>
                  <div className={styles.stripeRed} />
                  <div className={styles.stripeWhite} />
                  <div className={styles.stripeRed} />
                </div>
              </div>
              <div className={styles.plateDivider} />
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8A8A8F"
                strokeWidth="2.1"
                strokeLinecap="round"
                className={styles.plateSearchIcon}
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M16.5 16.5L21 21" />
              </svg>
              <input
                type="text"
                value={plate}
                onChange={handlePlateChange}
                onKeyDown={handleKeyDown}
                placeholder="Ingresa tu placa"
                maxLength={7}
                className={styles.plateInputField}
                aria-label="Número de placa del vehículo"
              />
            </div>
            <button
              onClick={handleConsultar}
              className={styles.plateBtn}
              disabled={cleanPlate(plate).length < 6}
            >
              Consultar
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16171b"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12h15" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>

          <div className={styles.heroCtas}>
          <a href="/agendar" className={styles.ctaAgendar}>
            Agendar inspección
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h15" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </a>
          <a href="#planes" className={styles.ctaPlanes}>
            Ver planes
          </a>
        </div>

        <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>+500</span>
              <span className={styles.statLabel}>inspecciones</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statValue}>S/8,500</span>
              <span className={styles.statLabel}>de ahorro promedio</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statValue}>5.0 ★</span>
              <span className={styles.statLabel}>Google Reviews</span>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de captura de datos */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalCloseBtn}
              onClick={closeModal}
              aria-label="Cerrar"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(26,27,31,.6)" strokeWidth="2.6" strokeLinecap="round">
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            </button>

            <div className={styles.modalGlow} aria-hidden="true" />

            <div className={styles.modalInner}>
              <div className={styles.modalBadge}>PLACA {plate} ENCONTRADA</div>

              <h2 className={styles.modalTitle}>¿A dónde enviamos tu reporte?</h2>
              <p className={styles.modalDesc}>
                Selecciona por qué medio quieres recibir el reporte legal para
                que lo consultes cuando quieras.
              </p>

              {/* Channel toggle */}
              <div className={styles.channelToggle}>
                <button
                  type="button"
                  className={`${styles.channelBtn} ${channel === "email" ? styles.channelActive : ""}`}
                  onClick={() => setChannel("email")}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="3" />
                    <path d="M4 7l8 6 8-6" />
                  </svg>
                  Correo
                </button>
                <button
                  type="button"
                  className={`${styles.channelBtn} ${channel === "whatsapp" ? styles.channelActive : ""}`}
                  onClick={() => setChannel("whatsapp")}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.5 12a8.5 8.5 0 01-12.6 7.4L3.5 20.5l1.2-4.3A8.5 8.5 0 1120.5 12z" />
                  </svg>
                  WhatsApp
                </button>
              </div>

              {/* Email input */}
              {channel === "email" && (
                <div className={styles.channelForm}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className={styles.formInput}
                  />
                  <button
                    className={styles.submitBtn}
                    onClick={handleSubmitEmail}
                  >
                    Enviarme el reporte por correo
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16171b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12h15" />
                      <path d="M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
              )}

              {/* WhatsApp input */}
              {channel === "whatsapp" && (
                <div className={styles.channelForm}>
                  <div className={styles.phoneInputWrap}>
                    <div className={styles.phonePrefix}>
                      <div className={styles.phoneFlagStripes}>
                        <div className={styles.stripeRed} />
                        <div className={styles.stripeWhite} />
                        <div className={styles.stripeRed} />
                      </div>
                      <span className={styles.phonePrefixText}>+51</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9 ]/g, "");
                        if (v.replace(/ /g, "").length <= 9) setPhone(v);
                      }}
                      placeholder="987 654 321"
                      maxLength={11}
                      className={styles.phoneInput}
                    />
                  </div>
                  <button
                    className={styles.submitBtnWa}
                    onClick={handleSubmitWhatsApp}
                  >
                    Enviarme por WhatsApp
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12h15" />
                      <path d="M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
              )}

              <button className={styles.skipBtn} onClick={goToConsultar}>
                Continuar sin dejar mis datos
              </button>

              <div className={styles.privacyNote}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(26,27,31,.6)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l7 3v6c0 5-3 8-7 11-4-3-7-6-7-11V5z" />
                </svg>
                Sin spam. Solo el reporte de esta placa.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
