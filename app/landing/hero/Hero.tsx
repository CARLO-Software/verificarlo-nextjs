"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./Hero.module.css";

const LOADING_STEPS = [
  "Conectando con SUNARP para verificar la Tarjeta de Identificación Vehicular...",
  "Consultando SAT e infracciones de tránsito pendientes...",
  "Buscando requisitorias u órdenes de captura en las bases de datos de la PNP...",
  "Revisando SOAT, revisiones técnicas y posibles embargos o prendas vehiculares...",
  "Redirigiendo a los resultados...",
];

const MOCK_VEHICLE = {
  marca: "MAZDA",
  modelo: "CX-3",
  anio: "2023",
  color: "BLANCO",
  combustible: "GASOLINA",
  cilindrada: "1,998 cc",
  nroMotor: "JM1DKCC77L1XXXXXX",
};

const MOCK_RESULTS = [
  {
    icon: "owners",
    label: "Propietarios registrados",
    value: "3",
    valueColor: "#1c1d22",
    desc: "Tuvo 3 dueños. Revisa que no arrastre deudas de dueños anteriores.**",
  },
  {
    icon: "transfer",
    label: "Transferencia recientes",
    value: "1",
    valueColor: "#1c1d22",
    desc: "Cambió de dueño hace poco. Revisa si tiene gravámenes antes de comprarlo.**",
  },
  {
    icon: "soat",
    label: "Estado del SOAT",
    value: "VIGENTE",
    valueColor: "#16a34a",
    desc: "El SOAT está vencido. Esto suele venir con papeletas pendientes.",
  },
  {
    icon: "rtv",
    label: "Revisión técnica (RTV)",
    value: "AL DÍA",
    valueColor: "#16a34a",
    desc: "Aprobada y vigente. Apto para transitar. Revisa la fecha de vencimiento.",
  },
];

const UPSELL_ITEMS = [
  "Historial de siniestros",
  "Gravámenes y embargos",
  "Último precio de compra",
  "Papeletas, deudas SAT y otros",
];

type Phase = "idle" | "loading" | "results";

export default function Hero() {
  const { data: session } = useSession();
  const router = useRouter();
  const [plate, setPlate] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const submittedPlate = useRef("");

  useEffect(() => {
    if (phase !== "loading") return;
    let cancelled = false;

    const stepTimer = setInterval(() => {
      setStepIdx((i) => (i < LOADING_STEPS.length - 1 ? i + 1 : i));
    }, 1200);

    // TODO: conectar con /api/legal-report/preview cuando esté listo
    const fakeDelay = setTimeout(() => {
      if (cancelled) return;
      setPhase("results");
    }, LOADING_STEPS.length * 1200 + 800);

    return () => {
      cancelled = true;
      clearInterval(stepTimer);
      clearTimeout(fakeDelay);
    };
  }, [phase, session, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = plate.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (cleaned.length >= 5) {
      submittedPlate.current = cleaned;
      setStepIdx(0);
      setPhase("loading");
    }
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
          <div className={styles.left}>
            <h1 className={styles.title}>
              Compra tu próximo auto
              <br />
              usado <em>con total
              <br />
              seguridad</em>
            </h1>
            <p className={styles.subtitle}>
              Empieza verificando gratis la placa antes de comprar y evita
              sorpresas con tu inversión.
            </p>
            <a href="#planes" className={styles.ctaPlanes}>
              Conoce nuestros planes
            </a>
          </div>

          <div className={styles.right}>
            <div className={styles.plateCard}>
              <h2 className={styles.plateTitle}>Consulta la placa gratis aquí</h2>

              <form onSubmit={handleSubmit}>
                <div className={styles.plateInput}>
                  <div className={styles.plateFlag}>
                    <div className={styles.plateFlagStripes}>
                      <span className={styles.stripeRed} />
                      <span className={styles.stripeWhite} />
                      <span className={styles.stripeRed} />
                    </div>
                  </div>
                  <input
                    className={styles.plateInputField}
                    type="text"
                    placeholder="ABC-123"
                    maxLength={7}
                    value={plate}
                    onChange={(e) => {
                      const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                      setPlate(raw.length > 3 ? raw.slice(0, 3) + "-" + raw.slice(3, 6) : raw);
                    }}
                    disabled={phase === "loading"}
                  />
                  <Image
                    src="/assets/images/icons/car.png"
                    alt=""
                    width={22}
                    height={22}
                    className={styles.plateSearchIcon}
                  />
                </div>

                <button
                  type="submit"
                  className={styles.plateBtn}
                  disabled={plate.trim().length < 5 || phase === "loading"}
                >
                  {phase === "loading" ? "Consultando..." : "Ver historial gratis"}
                  {phase !== "loading" && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12h15" />
                      <path d="M13 6l6 6-6 6" />
                    </svg>
                  )}
                </button>
              </form>

              <div className={styles.cardStats}>
                <div className={styles.cardStat}>
                  <div className={styles.cardStatIcon}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1d22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 9v4l3 3" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </div>
                  <span className={styles.cardStatValue}>82%</span>
                  <span className={styles.cardStatLabel}>
                    Autos &quot;perfectos&quot;
                    <br />
                    que ocultaban fallas
                  </span>
                </div>
                <div className={styles.cardStat}>
                  <div className={styles.cardStatIcon}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1d22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 17H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4" />
                      <path d="M12 15l-3 4h6l-3-4z" />
                    </svg>
                  </div>
                  <span className={styles.cardStatValue}>+500</span>
                  <span className={styles.cardStatLabel}>
                    Inspecciones
                    <br />
                    realizadas
                  </span>
                </div>
                <div className={styles.cardStat}>
                  <div className={styles.cardStatIcon}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1d22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                    </svg>
                  </div>
                  <span className={styles.cardStatValue}>S/8,500</span>
                  <span className={styles.cardStatLabel}>
                    Ahorro promedio
                    <br />
                    por cliente
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Loading overlay */}
      {phase === "loading" && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingBox}>
            <div className={styles.spinner}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e5e5" strokeWidth="4" />
                <circle
                  cx="40" cy="40" r="34"
                  fill="none" stroke="#FBD307" strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="160 54"
                  className={styles.spinnerCircle}
                />
              </svg>
              <div className={styles.spinnerIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1c1d22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
            </div>
            <h2 className={styles.loadingTitle}>
              Analizando <strong>el vehículo...</strong>
            </h2>
            <div className={styles.loadingStepWrap}>
              <p className={styles.loadingStep} key={stepIdx}>{LOADING_STEPS[stepIdx]}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results page */}
      {phase === "results" && (
        <div className={styles.resultsOverlay}>
          <div className={styles.resultsPage}>
            {/* Back */}
            <button className={styles.backBtn} onClick={() => setPhase("idle")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Volver
            </button>

            {/* Vehicle header card */}
            <div className={styles.vehicleCard}>
              <div className={styles.vehicleTop}>
                <div className={styles.vehiclePlate}>
                  <div className={styles.plateFlagSmall}>
                    <span className={styles.stripeRed} />
                    <span className={styles.stripeWhite} />
                    <span className={styles.stripeRed} />
                  </div>
                  <span className={styles.vehiclePlateText}>
                    {submittedPlate.current || "DAZ-198"}
                  </span>
                </div>
                <div className={styles.vehicleMotor}>
                  <span className={styles.vehicleMotorLabel}>Número de motor</span>
                  <span className={styles.vehicleMotorValue}>{MOCK_VEHICLE.nroMotor}</span>
                </div>
              </div>
              <div className={styles.vehicleSpecs}>
                <span>Marca: <strong>{MOCK_VEHICLE.marca}</strong></span>
                <span>Modelo: <strong>{MOCK_VEHICLE.modelo}</strong></span>
                <span>Año: <strong>{MOCK_VEHICLE.anio}</strong></span>
                <span>Color: <strong>{MOCK_VEHICLE.color}</strong></span>
                <span>Combustible: <strong>{MOCK_VEHICLE.combustible}</strong></span>
                <span>Cilindrada: <strong>{MOCK_VEHICLE.cilindrada}</strong></span>
              </div>
            </div>

            {/* Green alert */}
            <div className={styles.alertGreen}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
              <span>
                No encontramos observaciones en los datos gratuitos. Te recomendamos
                revisar gravámenes y siniestros antes de pagar por el auto.
              </span>
            </div>

            {/* Results heading */}
            <div className={styles.resultsHeading}>
              <h2>Resultados <em>Gratuitos</em></h2>
              <p>
                Estás viendo una fracción del historial. Conoce el estado legal
                completo antes de tomar una decisión financiera.
              </p>
            </div>

            {/* 4 stat cards */}
            <div className={styles.resultCards}>
              {MOCK_RESULTS.map((r) => (
                <div className={styles.resultCard} key={r.icon}>
                  <div
                    className={styles.resultCardIcon}
                    style={{
                      background:
                        r.icon === "soat" || r.icon === "rtv"
                          ? "#16a34a"
                          : "#FBD307",
                    }}
                  >
                    {r.icon === "owners" && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                      </svg>
                    )}
                    {r.icon === "transfer" && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                    {r.icon === "soat" && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    )}
                    {r.icon === "rtv" && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                      </svg>
                    )}
                  </div>
                  <span className={styles.resultCardLabel}>{r.label}</span>
                  <span
                    className={styles.resultCardValue}
                    style={{ color: r.valueColor }}
                  >
                    {r.value}
                  </span>
                  <span className={styles.resultCardDesc}>{r.desc}</span>
                </div>
              ))}
            </div>

            {/* Yellow upsell banner */}
            <div className={styles.upsellBanner}>
              <div className={styles.upsellLeft}>
                <h3>
                  Obtén el Reporte Legal Completo en minutos{" "}
                  <em>por solo S/ 19.90.</em>
                </h3>
                <p>
                  Desbloquea para ver el resto de información legal del carro
                  usado que vas a comprar. Toma de 3 a 5 minutos.
                </p>
                <div className={styles.upsellActions}>
                  <a href="/consultar" className={styles.upsellBtn}>
                    Desbloquear todo por S/ 19.90
                  </a>
                  <a href="#" className={styles.upsellLink}>
                    Ver ejemplo del Reporte Legal
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className={styles.upsellRight}>
                {UPSELL_ITEMS.map((item) => (
                  <div className={styles.upsellItem} key={item}>
                    <div className={styles.upsellItemIcon}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1c1d22" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12l2 2 4-4" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
