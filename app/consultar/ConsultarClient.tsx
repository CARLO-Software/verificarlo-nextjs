"use client";

import { useEffect, useState } from "react";
import { inspectionPlans } from "@/prisma/data/inspections";
import styles from "./Consultar.module.css";

const FEATURE_GROUPS = [
  {
    title: "LEGAL",
    rows: [
      { label: "Siniestros y gravámenes", legal: true, basica: true, premium: true },
      { label: "Papeletas e historial de propietarios", legal: true, basica: true, premium: true },
      { label: "Boleta informativa", legal: true, basica: true, premium: true },
    ],
  },
  {
    title: "MECÁNICA",
    rows: [
      { label: "Revisión mecánica 200+ puntos", legal: false, basica: true, premium: true },
      { label: "Escáner profesional", legal: false, basica: true, premium: true },
      { label: "Escaneo de pintura y carrocería", legal: false, basica: true, premium: true },
      { label: "Veredicto verbal", legal: false, basica: true, premium: true },
    ],
  },
  {
    title: "PREMIUM",
    rows: [
      { label: "Videoscopía de motor", legal: false, basica: false, premium: true },
      { label: "Asesoría en presupuesto de reparación", legal: false, basica: false, premium: true },
      { label: "Informe técnico y legal documentado", legal: false, basica: false, premium: true },
    ],
  },
];

const DURATIONS = ["20–30 min", "1 hora", "1 hora +"];

const CheckMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16171b" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const MOCK_STEPS = [
  "Consultando SUNARP...",
  "Revisando historial SUTRAN...",
  "Verificando papeletas SAT...",
  "Consultando siniestros SBS...",
];

const MOCK_VEHICLE = {
  marca: "SUZUKI",
  modelo: "SWIFT",
  anio: "2014",
  color: "PLATA",
  combustible: "GASOLINA",
  uso: "PARTICULAR",
};

const OPEN_SECTIONS = [
  {
    num: "01",
    title: "Historial de propietarios",
    bigValue: "3",
    bigLabel: "propietarios registrados",
    rows: [
      { label: "Propietario actual", value: "Persona natural · desde 2022" },
      { label: "2do propietario", value: "Persona natural · 2020–2022" },
      { label: "1er propietario", value: "Concesionario · 2019" },
    ],
  },
  {
    num: "02",
    title: "Última transferencia",
    bigValue: "2022",
    bigLabel: "hace 4 años",
    rows: [
      { label: "Fecha registrada", value: "14 de marzo, 2022" },
      { label: "Sede registral", value: "Lima" },
      { label: "Tipo", value: "Compraventa" },
    ],
  },
];

const LOCKED_SECTIONS = [
  { num: "03", label: "Siniestros reportados", value: "2 registros", tone: "#C1352A" },
  { num: "04", label: "Gravámenes y embargos", value: "Sin cargas", tone: "#2AAD22" },
  { num: "05", label: "Papeletas pendientes", value: "1 papeleta", tone: "#C1352A" },
  { num: "06", label: "Deudas tributarias", value: "Sin deuda", tone: "#2AAD22" },
  { num: "07", label: "Boleta informativa SUNARP", value: "Disponible", tone: "#1c1d22" },
];

export default function ConsultarClient({ placa }: { placa: string }) {
  const [phase, setPhase] = useState<"loading" | "report">("loading");
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPlans, setShowPlans] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (phase !== "loading") return;

    const duration = 3000;
    const interval = 50;
    const steps = duration / interval;
    let tick = 0;

    const timer = setInterval(() => {
      tick++;
      const pct = Math.min(Math.round((tick / steps) * 100), 100);
      setProgress(pct);
      setCurrentStep(Math.min(Math.floor((pct / 100) * MOCK_STEPS.length), MOCK_STEPS.length - 1));

      if (pct >= 100) {
        clearInterval(timer);
        setTimeout(() => setPhase("report"), 400);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [phase]);

  if (phase === "loading") {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingBgPattern} />
        <div className={styles.loadingGlow} />

        <div className={styles.loadingHeader}>
          <div className={styles.logo}>
            <span className={styles.logoVerifi}>VERIFI</span>
            <span className={styles.logoCarlo}>CARLO</span>
          </div>
        </div>

        <div className={styles.loadingContent}>
          <div className={styles.ringContainer}>
            <div className={styles.ringBg} />
            <div className={styles.ringSpinner} />
            <div className={styles.ringInner}>
              <span className={styles.ringPercent}>{progress}%</span>
              <span className={styles.ringLabel}>GENERANDO</span>
            </div>
          </div>

          <h2 className={styles.loadingTitle}>
            Estamos armando el reporte de tu {placa}
          </h2>
          <p className={styles.loadingSubtitle}>
            Esto toma <b>30 segundos como máximo</b>. No cierres esta ventana.
          </p>

          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>

          <div className={styles.stepsList}>
            {MOCK_STEPS.map((step, i) => (
              <div
                key={i}
                className={`${styles.stepItem} ${
                  i < currentStep ? styles.stepDone : i === currentStep ? styles.stepActive : styles.stepPending
                }`}
              >
                <div className={styles.stepIcon}>
                  {i < currentStep ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C8A0E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                  ) : i === currentStep ? (
                    <div className={styles.stepSpinner} />
                  ) : (
                    <div className={styles.stepDot} />
                  )}
                </div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.reportPage}>
      <div className={styles.reportHeader}>
        <a href="/" className={styles.logo}>
          <span className={styles.logoVerifi}>VERIFI</span>
          <span className={styles.logoCarlo}>CARLO</span>
        </a>
        <div className={styles.reportHeaderRight}>
          <div className={styles.reportStatus}>
            <div className={styles.statusDot} />
            Reporte generado
          </div>
          <div className={styles.sectionsBadge}>2 de 7 secciones desbloqueadas</div>
        </div>
      </div>

      <div className={styles.reportScroll}>
        <div className={styles.reportDocument}>
          {/* Document header */}
          <div className={styles.docHeader}>
            <div className={styles.docHeaderLeft}>
              <div className={styles.logo}>
                <span className={styles.logoVerifi}>VERIFI</span>
                <span className={styles.logoCarlo}>CARLO</span>
              </div>
              <span className={styles.docKicker}>REPORTE LEGAL VEHICULAR</span>
            </div>
            <div className={styles.docHeaderRight}>
              <span className={styles.docPlate}>{placa}</span>
              <span className={styles.docMeta}>Emitido hoy · 2 de 7 secciones</span>
            </div>
          </div>

          {/* Vehicle info */}
          <div className={styles.docVehicle}>
            <h1 className={styles.docVehicleTitle}>
              {MOCK_VEHICLE.marca} {MOCK_VEHICLE.modelo} {MOCK_VEHICLE.anio}
            </h1>
            <p className={styles.docVehicleDesc}>
              Encontramos 7 registros asociados a esta placa. Los dos primeros son visibles.
            </p>
          </div>

          {/* Open sections */}
          {OPEN_SECTIONS.map((section) => (
            <div key={section.num} className={styles.docSection}>
              <div className={styles.docSectionHeader}>
                <div className={styles.docSectionTitle}>
                  <span className={styles.docNum}>{section.num}</span>
                  <span className={styles.docFieldTitle}>{section.title}</span>
                </div>
                <span className={styles.badgeOpen}>ABIERTO</span>
              </div>
              <div className={styles.docBigValue}>
                <span className={styles.bigNum}>{section.bigValue}</span>
                <span className={styles.bigLabel}>{section.bigLabel}</span>
              </div>
              <div className={styles.docRows}>
                {section.rows.map((row, i) => (
                  <div key={i} className={styles.docRow}>
                    <span className={styles.docRowLabel}>{row.label}</span>
                    <span className={styles.docRowValue}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Locked sections */}
          <div className={styles.lockedContainer}>
            <div className={styles.lockedBlur}>
              {LOCKED_SECTIONS.map((section) => (
                <div key={section.num} className={styles.lockedRow}>
                  <div className={styles.docSectionTitle}>
                    <span className={styles.docNum}>{section.num}</span>
                    <span className={styles.docFieldTitle}>{section.label}</span>
                  </div>
                  <span style={{ color: section.tone, fontWeight: 700, fontSize: 14 }}>
                    {section.value}
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.lockedOverlay}>
              <div className={styles.lockIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16171b" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="10.5" width="16" height="10.5" rx="3" />
                  <path d="M8 10.5V7.5a4 4 0 018 0v3" />
                </svg>
              </div>
              <h3 className={styles.lockTitle}>Falta lo que decide la compra</h3>
              <p className={styles.lockDesc}>
                5 secciones bloqueadas: siniestros, gravámenes, papeletas, deudas y boleta informativa.
              </p>
            </div>
          </div>
        </div>

        {/* Sticky CTA */}
        <div className={`${styles.stickyCta} ${showPlans || showCheckout ? styles.stickyCtaHidden : ""}`}>
          <div className={styles.stickyCtaCard}>
            <div className={styles.stickyCtaText}>
              <div className={styles.stickyCtaPriceRow}>
                <span className={styles.stickyCtaLabel}>Desbloquea las 5 secciones por</span>
                <span className={styles.stickyCtaPrice}>S/29</span>
              </div>
              <span className={styles.stickyCtaSubtext}>
                Revisamos los datos en tiempo real y recibes tu informe en 2 minutos.
              </span>
            </div>
            <button type="button" className={styles.stickyCtaBtn} onClick={() => setShowPlans(true)}>
              Ver el reporte completo
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16171b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12h15" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Plans comparison - full screen overlay */}
      {showPlans && (
        <div className={styles.planesOverlay}>
          <div className={styles.planesOverlayHeader}>
            <a href="/" className={styles.logo}>
              <span className={styles.logoVerifi}>VERIFI</span>
              <span className={styles.logoCarlo}>CARLO</span>
            </a>
            <button type="button" className={styles.planesBackBtn} onClick={() => setShowPlans(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 5l-7 7 7 7" />
              </svg>
              Volver al reporte
            </button>
          </div>

          <div className={styles.planesOverlayScroll}>
            <section id="planes" className={styles.planesSection}>
              <div className={styles.planesHeader}>
                <h2 className={styles.planesTitle}>
                  El plan que eliges define cuánto descubres.
                </h2>
                <p className={styles.planesSubtitle}>
                  Cada plan incluye todo lo del anterior. Avanzas desde lo básico hasta obtener la información completa para invertir con total seguridad.
                </p>
              </div>

              {/* Desktop comparison table */}
              <div className={styles.planesTable}>
                <div className={styles.planesTableHead}>
                  <div className={styles.planesTableLabel} />
                  {inspectionPlans.map((plan, i) => (
                    <div key={plan.id} className={`${styles.planesTableCol} ${i === 2 ? styles.planesTableColFeatured : ""}`}>
                      <div className={styles.planColName}>
                        <span>{plan.title.replace("Inspección ", "")}</span>
                        {i === 2 && <span className={styles.planBadge}>9/10 ELIGEN ESTE</span>}
                      </div>
                      <span className={styles.planColPrice}>S/{plan.price}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.planesTableRow}>
                  <div className={styles.planesTableLabel} />
                  {inspectionPlans.map((plan, i) => (
                    <div key={plan.id} className={`${styles.planesTableCell} ${i === 2 ? styles.planesTableCellFeatured : ""}`}>
                      {plan.type === "legal" ? (
                        <button type="button" className={styles.planCtaOutline} onClick={() => { setShowPlans(false); setShowCheckout(true); }}>
                          Elegir este plan
                        </button>
                      ) : (
                        <a href={`/agendar?plan=${plan.type}&placa=${placa}`} className={i === 2 ? styles.planCtaPrimary : styles.planCtaOutline}>
                          Elegir este plan
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                {FEATURE_GROUPS.map((group) => (
                  <div key={group.title} className={styles.planesGroup}>
                    <div className={styles.planesGroupTitle}>{group.title}</div>
                    {group.rows.map((row) => (
                      <div key={row.label} className={styles.planesTableRow}>
                        <div className={styles.planesTableLabel}>{row.label}</div>
                        <div className={styles.planesTableCell}>
                          {row.legal ? <CheckMark /> : <span className={styles.dash}>—</span>}
                        </div>
                        <div className={styles.planesTableCell}>
                          {row.basica ? <CheckMark /> : <span className={styles.dash}>—</span>}
                        </div>
                        <div className={`${styles.planesTableCell} ${styles.planesTableCellFeatured}`}>
                          {row.premium ? <CheckMark /> : <span className={styles.dash}>—</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                <div className={styles.planesTableRow}>
                  <div className={`${styles.planesTableLabel} ${styles.planDurationLabel}`}>Duración estimada</div>
                  {DURATIONS.map((d, i) => (
                    <div key={i} className={`${styles.planesTableCell} ${styles.planDurationCell} ${i === 2 ? styles.planesTableCellFeatured : ""}`}>
                      {d}
                    </div>
                  ))}
                </div>
              </div>

              <MobilePlans placa={placa} onLegalClick={() => { setShowPlans(false); setShowCheckout(true); }} />

              <div className={styles.planesNudge}>
                <h3 className={styles.nudgeTitle}>¿No estás seguro de cuál elegir?</h3>
                <p className={styles.nudgeDesc}>
                  Si vas a pagar por un auto usado, S/299 es menos del 0.5% de una compra promedio de S/60,000. No te arriesgues a perder dinero.
                </p>
                <a href={`/agendar?plan=${inspectionPlans[2].type}&placa=${placa}`} className={styles.nudgeCta}>
                  Elegir Premium →
                </a>
              </div>
            </section>
          </div>
        </div>
      )}

      {showCheckout && (
        <CheckoutOverlay placa={placa} vehicle={MOCK_VEHICLE} onBack={() => { setShowCheckout(false); setShowPlans(true); }} />
      )}
    </div>
  );
}

function MobilePlans({ placa, onLegalClick }: { placa: string; onLegalClick: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(2);

  const plans = [
    { plan: inspectionPlans[0], items: ["Siniestros y gravámenes", "Papeletas e historial de propietarios", "Boleta informativa SUNARP"] },
    { plan: inspectionPlans[1], items: ["Todo lo del Legal Express", "Revisión mecánica 200+ puntos", "Escáner profesional OBD2", "Escaneo de pintura y carrocería"] },
    { plan: inspectionPlans[2], items: ["Todo lo de la Básica", "Videoscopía de motor", "Asesoría en presupuesto de reparación", "Informe técnico y legal documentado"], badge: true },
  ];

  return (
    <div className={styles.mobilePlans}>
      {plans.map(({ plan, items, badge }, i) => (
        <div key={plan.id} className={styles.mobilePlanCard} data-expanded={expanded === i ? "true" : "false"}>
          <button type="button" className={`${styles.mobilePlanHead} ${badge ? styles.mobilePlanHeadFeatured : ""}`} onClick={() => setExpanded(expanded === i ? null : i)}>
            <div className={styles.mobilePlanInfo}>
              <div className={styles.mobilePlanNameRow}>
                <span className={styles.mobilePlanName}>{plan.title.replace("Inspección ", "")}</span>
                {badge && <span className={styles.planBadge}>9/10 ELIGEN ESTE</span>}
              </div>
              <span className={styles.mobilePlanPrice}>S/{plan.price}</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(26,27,31,.68)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={expanded === i ? styles.chevronUp : ""}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {expanded === i && (
            <div className={styles.mobilePlanBody}>
              {items.map((item, j) => (
                <div key={j} className={styles.mobilePlanItem}>
                  <CheckMark />
                  <span>{item}</span>
                </div>
              ))}
              {plan.type === "legal" ? (
                <button type="button" className={styles.planCtaOutline} onClick={onLegalClick}>
                  COMPRAR LEGAL AHORA
                </button>
              ) : (
                <a href={`/agendar?plan=${plan.type}&placa=${placa}`} className={badge ? styles.planCtaPrimary : styles.planCtaOutline}>
                  Elegir este plan
                </a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function getAvailableSlots(dateStr: string): string[] {
  if (!dateStr) return [];
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  if (day === 0) return [];
  if (day === 6) return ["09:00", "10:00", "11:00", "12:00"];
  return ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
}

const REPORT_SOURCES = [
  "Consultando SUNARP (partidas registrales)...",
  "Verificando gravámenes y garantías...",
  "Consultando SOAT (APESEG)...",
  "Verificando historial de siniestros (SBS)...",
  "Consultando papeletas SAT Lima...",
  "Verificando impuesto vehicular...",
  "Consultando orden de captura SAT...",
  "Verificando inspección técnica (CITV)...",
  "Consultando infracciones SUTRAN...",
  "Verificando papeletas ATU...",
  "Consultando Municipalidad del Callao...",
  "Verificando conversión a GNV (OSINERGMIN)...",
  "Consultando subsidio FISE...",
  "Generando análisis del informe...",
];

function CheckoutOverlay({ placa, vehicle, onBack }: { placa: string; vehicle: typeof MOCK_VEHICLE; onBack: () => void }) {
  const [bump, setBump] = useState<"none" | "basica" | "premium">("none");
  const [payMethod, setPayMethod] = useState<"yape" | "transfer">("yape");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [paying, setPaying] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const legalPrice = inspectionPlans[0].price;
  const basicaPrice = inspectionPlans[1].price;
  const premiumPrice = inspectionPlans[2].price;

  const total = bump === "premium" ? premiumPrice : bump === "basica" ? basicaPrice : legalPrice;
  const hasBump = bump !== "none";
  const availableSlots = getAvailableSlots(date);

  const handleBump = (selected: "basica" | "premium") => {
    setBump(bump === selected ? "none" : selected);
    setTime("");
  };

  const handlePay = async () => {
    if (hasBump) {
      // Básica/Premium → redirect to /agendar (existing flow)
      const planType = bump === "premium" ? inspectionPlans[2].type : inspectionPlans[1].type;
      window.location.href = `/agendar?plan=${planType}&placa=${placa}`;
      return;
    }
    setPaying(true);
    setError(null);
    setLoadingStep(0);

    // Animar pasos cada ~12s para cubrir ~3 min de espera
    const stepTimer = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < REPORT_SOURCES.length - 1) return prev + 1;
        return prev;
      });
    }, 12000);

    try {
      const res = await fetch("/api/legal-report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate: placa }),
      });
      if (!res.ok) throw new Error("Error generando el reporte");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch {
      setError("Hubo un error generando tu reporte. Intenta de nuevo.");
    } finally {
      clearInterval(stepTimer);
      setPaying(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const loadingProgress = Math.min(Math.round(((loadingStep + 1) / REPORT_SOURCES.length) * 95), 95);

  if (paying) {
    return (
      <div className={styles.planesOverlay}>
        <div className={styles.loadingBgPattern} />
        <div className={styles.loadingGlow} />

        <div className={styles.planesOverlayHeader}>
          <div className={styles.logo}>
            <span className={styles.logoVerifi}>VERIFI</span>
            <span className={styles.logoCarlo}>CARLO</span>
          </div>
        </div>

        <div className={styles.loadingContent}>
          <div className={styles.ringContainer}>
            <div className={styles.ringBg} />
            <div className={styles.ringSpinner} />
            <div className={styles.ringInner}>
              <span className={styles.ringPercent}>{loadingProgress}%</span>
              <span className={styles.ringLabel}>ESCANEANDO</span>
            </div>
          </div>

          <h2 className={styles.loadingTitle}>
            Escaneando 14 fuentes oficiales para {placa}
          </h2>
          <p className={styles.loadingSubtitle}>
            Esto toma entre <b>1 y 4 minutos</b>. No cierres esta ventana.
          </p>

          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${loadingProgress}%` }} />
          </div>

          <div className={styles.stepsList}>
            {REPORT_SOURCES.map((step, i) => (
              <div
                key={i}
                className={`${styles.stepItem} ${
                  i < loadingStep ? styles.stepDone : i === loadingStep ? styles.stepActive : styles.stepPending
                }`}
              >
                <div className={styles.stepIcon}>
                  {i < loadingStep ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C8A0E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                  ) : i === loadingStep ? (
                    <div className={styles.stepSpinner} />
                  ) : (
                    <div className={styles.stepDot} />
                  )}
                </div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (pdfUrl) {
    return (
      <div className={styles.planesOverlay}>
        <div className={styles.planesOverlayHeader}>
          <a href="/" className={styles.logo}>
            <span className={styles.logoVerifi}>VERIFI</span>
            <span className={styles.logoCarlo}>CARLO</span>
          </a>
          <a href="/" className={styles.planesBackBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 5l-7 7 7 7" />
            </svg>
            Volver al inicio
          </a>
        </div>
        <div className={styles.pdfSuccess}>
          <div className={styles.pdfSuccessIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className={styles.pdfSuccessTitle}>¡Tu reporte legal está listo!</h2>
          <p className={styles.pdfSuccessDesc}>Reporte legal express para la placa {placa}</p>
          <iframe src={pdfUrl} className={styles.pdfViewer} title="Reporte Legal Express" />
          <a href={pdfUrl} download={`reporte-legal-${placa}.pdf`} className={styles.checkoutCta}>
            Descargar PDF
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.planesOverlay}>
      <div className={styles.planesOverlayHeader}>
        <a href="/" className={styles.logo}>
          <span className={styles.logoVerifi}>VERIFI</span>
          <span className={styles.logoCarlo}>CARLO</span>
        </a>
        <button type="button" className={styles.planesBackBtn} onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 5l-7 7 7 7" />
          </svg>
          Volver a planes
        </button>
      </div>

      <div className={styles.checkoutScroll}>
        <div className={styles.checkoutGrid}>
          {/* LEFT COLUMN */}
          <div className={styles.checkoutLeft}>
            {/* Vehicle found */}
            <div className={styles.checkoutVehicle}>
              <div className={styles.checkoutVehicleIcon}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#16171b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className={styles.checkoutVehicleInfo}>
                <span className={styles.checkoutVehicleKicker}>PLACA ENCONTRADA</span>
                <span className={styles.checkoutVehicleName}>{placa} · {vehicle.marca} {vehicle.modelo} {vehicle.anio}</span>
              </div>
            </div>

            {/* Upsell */}
            <div className={styles.checkoutUpsell}>
              <div className={styles.upsellWarning}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FBD40A" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3 6 6 1-4.5 4.5L17.5 20 12 17l-5.5 3 1-6.5L3 9l6-1z" />
                </svg>
                <span className={styles.upsellWarningText}>¡Cuidado! El informe legal ayuda, pero no te dice si el motor y la carrocería están bien.</span>
              </div>
              <p className={styles.upsellStats}>
                <b className={styles.upsellHighlight}>82%</b> de los autos aparentemente perfectos ocultaban una falla.
                <br />
                <b className={styles.upsellHighlight}>8 de 10</b> casos tienen fallas mecánicas invisibles a simple vista.
              </p>

              <button type="button" className={`${styles.bumpOption} ${bump === "basica" ? styles.bumpSelected : ""}`} onClick={() => handleBump("basica")}>
                <div className={`${styles.bumpCheck} ${bump === "basica" ? styles.bumpCheckActive : ""}`}>
                  {bump === "basica" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16171b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className={styles.bumpInfo}>
                  <span className={styles.bumpName}>Agregar inspección básica <span className={styles.bumpOldPrice}>S/350</span> +S/{basicaPrice - legalPrice}</span>
                  <span className={styles.bumpDesc}>200+ puntos, escáner profesional, escaneo de pintura</span>
                  {bump === "basica" && <span className={styles.bumpTotal}>Total S/{basicaPrice}</span>}
                </div>
              </button>

              <button type="button" className={`${styles.bumpOption} ${bump === "premium" ? styles.bumpSelected : ""}`} onClick={() => handleBump("premium")}>
                <span className={styles.bumpBadge}>9/10 ELIGEN ESTE</span>
                <div className={`${styles.bumpCheck} ${bump === "premium" ? styles.bumpCheckActive : ""}`}>
                  {bump === "premium" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16171b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className={styles.bumpInfo}>
                  <span className={styles.bumpName}>Agregar Inspección premium <span className={styles.bumpOldPrice}>S/400</span> +S/{premiumPrice - legalPrice}</span>
                  <span className={styles.bumpDesc}>+ videoscopía de motor y asesoría de presupuesto</span>
                  {bump === "premium" && <span className={styles.bumpTotal}>Total S/{premiumPrice}</span>}
                </div>
              </button>

              {/* Address & scheduling form */}
              {hasBump && (
                <div className={styles.scheduleForm}>
                  <div className={styles.scheduleFormHeader}>
                    <span className={styles.scheduleFormTitle}>¿Dónde está el auto?</span>
                    <span className={styles.scheduleFormDesc}>Coordinamos la visita del técnico.</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Dirección"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={styles.scheduleInput}
                  />
                  <input
                    type="text"
                    placeholder="Distrito"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className={styles.scheduleInput}
                  />
                  <div className={styles.scheduleDateRow}>
                    <div className={styles.scheduleDateWrap}>
                      <label className={styles.scheduleLabel}>Fecha preferida</label>
                      <input
                        type="date"
                        value={date}
                        min={todayStr}
                        onChange={(e) => { setDate(e.target.value); setTime(""); }}
                        className={styles.scheduleInput}
                      />
                    </div>
                    <div className={styles.scheduleDateWrap}>
                      <label className={styles.scheduleLabel}>Hora preferida</label>
                      <select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className={styles.scheduleInput}
                        disabled={availableSlots.length === 0}
                      >
                        <option value="">{date ? (availableSlots.length ? "Seleccionar hora" : "No disponible") : "Elige fecha primero"}</option>
                        {availableSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order summary */}
            <div className={styles.checkoutSummary}>
              <h3 className={styles.summaryTitle}>Resumen del pedido</h3>
              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>Informe Legal Express</span>
                  <span>S/{legalPrice}</span>
                </div>
                {bump === "basica" && (
                  <div className={`${styles.summaryRow} ${styles.summaryRowHighlight}`}>
                    <span>Inspección Básica</span>
                    <span>+S/{basicaPrice - legalPrice}</span>
                  </div>
                )}
                {bump === "premium" && (
                  <div className={`${styles.summaryRow} ${styles.summaryRowHighlight}`}>
                    <span>Upgrade Premium</span>
                    <span>+S/{premiumPrice - legalPrice}</span>
                  </div>
                )}
                <div className={styles.summaryDivider} />
                <div className={styles.summaryTotal}>
                  <span>Total a pagar hoy</span>
                  <span>S/{total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Payment */}
          <div className={styles.checkoutRight}>
            <div className={styles.paymentSection}>
              <span className={styles.paymentTitle}>Métodos de pago</span>

              <button type="button" className={`${styles.payOption} ${payMethod === "yape" ? styles.payOptionActive : ""}`} onClick={() => setPayMethod("yape")}>
                <div className={`${styles.payRadio} ${payMethod === "yape" ? styles.payRadioActive : ""}`}>
                  {payMethod === "yape" && <div className={styles.payRadioDot} />}
                </div>
                <div className={styles.payBrandYape}>yape</div>
                <div className={styles.payBrandPlin}>plin</div>
                <div className={styles.payOptionInfo}>
                  <span className={styles.payOptionName}>Yape / Plin</span>
                  <span className={styles.payOptionDesc}>QR en segundos</span>
                </div>
              </button>

              <button type="button" className={`${styles.payOption} ${payMethod === "transfer" ? styles.payOptionActive : ""}`} onClick={() => setPayMethod("transfer")}>
                <div className={`${styles.payRadio} ${payMethod === "transfer" ? styles.payRadioActive : ""}`}>
                  {payMethod === "transfer" && <div className={styles.payRadioDot} />}
                </div>
                <div className={styles.payBrandBcp}>BCP</div>
                <div className={styles.payOptionInfo}>
                  <span className={styles.payOptionName}>Transferencia bancaria</span>
                  <span className={styles.payOptionDesc}>Subes el voucher</span>
                </div>
              </button>
            </div>

            <button
              type="button"
              className={styles.checkoutCta}
              onClick={handlePay}
              disabled={paying}
            >
              {paying ? "Generando reporte…" : `Pagar S/${total}`}
            </button>
            {error && <p className={styles.checkoutError}>{error}</p>}
            <div className={styles.paySecure}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(26,27,31,.68)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l7 3v6c0 5-3 8-7 11-4-3-7-6-7-11V5z" />
              </svg>
              Pago 100% seguro
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
