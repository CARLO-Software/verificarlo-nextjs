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

const LOADING_STEPS = [
  "Consultando SUNARP...",
  "Verificando SOAT...",
  "Consultando revisión técnica...",
  "Procesando resultados...",
];

const STATUS_COLORS: Record<string, string> = {
  OK: "#2AAD22",
  WARNING: "#D97706",
  CRITICAL: "#C1352A",
  PENDING: "#6B7280",
  verde: "#2AAD22",
  amarillo: "#D97706",
  rojo: "#C1352A",
  gris: "#6B7280",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ApiPreviewResponse {
  consultar: any;
  informe: any;
  plate: string;
}

interface VehicleInfo {
  marca: string;
  modelo: string;
  anio: string;
  color: string;
  combustible: string;
  uso: string;
}

interface OpenSection {
  num: string;
  title: string;
  rows: { label: string; value: string }[];
}

interface LockedSection {
  num: string;
  label: string;
  desc: string;
  value: string;
  tone: string;
}

function getTitulos(consultar: any): any[] {
  const t1 = consultar?.sunarp?.siguelo?.titulos;
  if (Array.isArray(t1) && t1.length > 0) return t1;
  const t2 = consultar?.siguelo?.titulos;
  if (Array.isArray(t2) && t2.length > 0) return t2;
  return [];
}

function getVehicleTitulo(consultar: any) {
  const titulos = getTitulos(consultar);
  return titulos.find((t: any) => t.marca) || null;
}

function extractVehicle(consultar: any): VehicleInfo {
  const t = getVehicleTitulo(consultar) || {};
  return {
    marca: t.marca || "",
    modelo: t.modelo || "",
    anio: t.anio_fabricacion || t.anio_modelo || "",
    color: t.color || "",
    combustible: t.combustible || "",
    uso: t.tipo_uso || "",
  };
}

const SKIP_NAMES = new Set(["COPROPIEDAD", "PROPIEDAD EXCLUSIVA", "PERSONA NATURAL", "PERSONA JURÍDICA", "PERSONA JURIDICA", "SOLTERO", "SOLTERA", "CASADO", "CASADA", "VIUDO", "VIUDA", "DIVORCIADO", "DIVORCIADA"]);

function countOwners(consultar: any): number {
  const titulos = getTitulos(consultar);
  if (titulos.length === 0) return 0;
  const ownerNames = new Set<string>();
  for (const t of titulos) {
    if (t?.nombre && typeof t.nombre === "string") {
      t.nombre.split("|").map((n: string) => n.trim()).filter(Boolean)
        .filter((n: string) => !SKIP_NAMES.has(n.toUpperCase()))
        .forEach((n: string) => ownerNames.add(n.toUpperCase()));
    }
  }
  return ownerNames.size || titulos.length;
}

function isVigente(fechaVcto: string | undefined): string {
  if (!fechaVcto) return "Sin información";
  const parts = fechaVcto.split("/");
  if (parts.length !== 3) return fechaVcto;
  const [d, m, y] = parts;
  const expiry = new Date(`${y}-${m}-${d}T23:59:59`);
  return expiry >= new Date() ? "VIGENTE" : "NO VIGENTE";
}

function buildOpenFromConsultar(consultar: any): OpenSection[] {
  const sections: OpenSection[] = [];

  const t = getVehicleTitulo(consultar);
  if (t) {
    const rows: { label: string; value: string }[] = [];
    if (t.marca) rows.push({ label: "Marca", value: t.marca });
    if (t.modelo) rows.push({ label: "Modelo", value: t.modelo });
    if (t.anio_fabricacion) rows.push({ label: "Año", value: t.anio_fabricacion });
    if (t.color) rows.push({ label: "Color", value: t.color });
    if (t.tipo_carroceria) rows.push({ label: "Carrocería", value: t.tipo_carroceria });
    if (t.combustible) rows.push({ label: "Combustible", value: t.combustible });
    if (t.cilindrada) rows.push({ label: "Cilindrada", value: t.cilindrada });
    if (t.nro_motor) rows.push({ label: "N.º Motor", value: t.nro_motor });
    if (rows.length > 0) {
      sections.push({ num: "01", title: "Características del vehículo (SUNARP)", rows });
    }
  }

  const nOwners = countOwners(consultar);
  if (nOwners > 0) {
    sections.push({
      num: "02",
      title: "Propietarios registrados",
      rows: [{ label: "N.º de propietarios", value: String(nOwners) }],
    });
  }

  const citv = consultar?.citv;
  if (citv) {
    const estado = isVigente(citv.fecha_vcto);
    sections.push({
      num: "03",
      title: "Revisión técnica (RTV)",
      rows: [{ label: "Estado", value: estado }],
    });
  }

  const soat = consultar?.sbs_soat;
  if (soat) {
    const estado = isVigente(soat.vencimiento);
    sections.push({
      num: "04",
      title: "SOAT",
      rows: [{ label: "Estado", value: estado }],
    });
  }

  return sections;
}

function buildLockedFromInforme(informe: any, startNum: number): LockedSection[] {
  const items = [
    { key: "gravamenes", label: "Gravámenes y embargos", desc: "Si el auto tiene cargas activas", fallback: "Verificar cargas" },
    { key: "ultimo_precio", label: "Último precio de compra", desc: "Referencia para negociar", fallback: "Ver precio" },
    { key: "siniestros_soat", label: "Historial de siniestros reportados", desc: "Choques y eventos registrados", fallback: "Ver historial" },
    { key: "deudas_multas_capturas", label: "Papeletas y deudas", desc: "Papeletas pendientes y multas", fallback: "Ver deudas" },
  ];

  return items.map((m, i) => {
    const num = String(startNum + i).padStart(2, "0");
    if (!informe?.[m.key]) {
      return { num, label: m.label, desc: m.desc, value: m.fallback, tone: "#6B7280" };
    }
    const section = informe[m.key];
    const semaforo = section.semaforo || section.estado || "gris";
    const badge = section.badge_text || section.etiqueta || section.estado || m.fallback;
    return {
      num,
      label: m.label,
      desc: m.desc,
      value: typeof badge === "string" ? badge.toUpperCase() : m.fallback,
      tone: STATUS_COLORS[semaforo] || "#6B7280",
    };
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function ConsultarClient({ placa }: { placa: string }) {
  const [phase, setPhase] = useState<"loading" | "report" | "error">("loading");
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPlans, setShowPlans] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiPreviewResponse | null>(null);

  useEffect(() => {
    if (phase !== "loading") return;
    let cancelled = false;

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => prev < LOADING_STEPS.length - 1 ? prev + 1 : prev);
    }, 800);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 3, 95));
    }, 80);

    fetch("/api/legal-report/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plate: placa }),
    })
      .then(res => { if (!res.ok) throw new Error("Error"); return res.json(); })
      .then((data: ApiPreviewResponse) => {
        if (cancelled) return;
        setApiResponse(data);
        setProgress(100);
        setCurrentStep(LOADING_STEPS.length - 1);
        setTimeout(() => setPhase("report"), 500);
      })
      .catch(() => { if (!cancelled) setPhase("error"); })
      .finally(() => {
        clearInterval(stepInterval);
        clearInterval(progressInterval);
      });

    return () => { cancelled = true; clearInterval(stepInterval); clearInterval(progressInterval); };
  }, [phase, placa]);

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
              <span className={styles.ringLabel}>CONSULTANDO</span>
            </div>
          </div>

          <h2 className={styles.loadingTitle}>
            Consultando fuentes oficiales para {placa}
          </h2>
          <p className={styles.loadingSubtitle}>
            Esto toma entre <b>10 y 30 segundos</b>. No cierres esta ventana.
          </p>

          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>

          <div className={styles.stepsList}>
            {LOADING_STEPS.map((step, i) => (
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

  if (phase === "error") {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingBgPattern} />
        <div className={styles.loadingGlow} />
        <div className={styles.loadingContent}>
          <h2 className={styles.loadingTitle}>No pudimos consultar esta placa</h2>
          <p className={styles.loadingSubtitle}>
            Hubo un error consultando las fuentes. Intenta de nuevo.
          </p>
          <button className={styles.generatePdfBtn} onClick={() => { setPhase("loading"); setProgress(0); setCurrentStep(0); }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const vehicle = apiResponse ? extractVehicle(apiResponse.consultar) : null;
  const openSections = apiResponse ? buildOpenFromConsultar(apiResponse.consultar) : [];
  const startNum = openSections.length + 1;
  const lockedSections = buildLockedFromInforme(apiResponse?.informe, startNum);
  const totalSections = openSections.length + lockedSections.length;

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
            Vistazo gratuito
          </div>
          <div className={styles.sectionsBadge}>{openSections.length} de {totalSections} secciones visibles</div>
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
              <span className={styles.docKicker}>CONSULTA VEHICULAR GRATUITA</span>
            </div>
            <div className={styles.docHeaderRight}>
              <span className={styles.docPlate}>{placa}</span>
              <span className={styles.docMeta}>Vistazo gratuito · {openSections.length} de {totalSections} secciones</span>
            </div>
          </div>

          {/* Vehicle info */}
          <div className={styles.docVehicle}>
            <h1 className={styles.docVehicleTitle}>
              {vehicle ? `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio}` : placa}
            </h1>
            <p className={styles.docVehicleDesc}>
              Encontramos {totalSections} registros asociados a esta placa. Las primeras secciones son gratuitas.
            </p>
          </div>

          {/* Open sections */}
          {openSections.map((section) => (
            <div key={section.num} className={styles.docSection}>
              <div className={styles.docSectionHeader}>
                <div className={styles.docSectionTitle}>
                  <span className={styles.docNum}>{section.num}</span>
                  <span className={styles.docFieldTitle}>{section.title}</span>
                </div>
                <span className={styles.badgeOpen}>GRATIS</span>
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

          {/* Locked sections — light blur so content peeks through */}
          <div className={styles.lockedContainer}>
            <div className={styles.lockedBlur}>
              {lockedSections.map((section) => (
                <div key={section.num} className={styles.lockedRow}>
                  <div className={styles.lockedRowLeft}>
                    <div className={styles.docSectionTitle}>
                      <span className={styles.docNum}>{section.num}</span>
                      <span className={styles.docFieldTitle}>{section.label}</span>
                    </div>
                    <span className={styles.lockedRowDesc}>{section.desc}</span>
                  </div>
                  <span className={styles.lockedRowBadge} style={{ color: section.tone }}>
                    {section.value}
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.lockedOverlay}>
              <div className={styles.lockIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16171b" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="10.5" width="16" height="10.5" rx="3" />
                  <path d="M8 10.5V7.5a4 4 0 018 0v3" />
                </svg>
              </div>
              <h3 className={styles.lockTitle}>Desbloquea el informe completo</h3>
              <p className={styles.lockDesc}>
                Gravámenes, precio de compra, siniestros y papeletas detallados con PDF descargable.
              </p>
              <button type="button" className={styles.lockBtn} onClick={() => setShowCheckout(true)}>
                Desbloquear por S/19.90
              </button>
            </div>
          </div>
        </div>

        {/* Sticky CTA */}
        <div className={`${styles.stickyCta} ${showPlans || showCheckout ? styles.stickyCtaHidden : ""}`}>
          <div className={styles.stickyCtaCard}>
            <div className={styles.stickyCtaText}>
              <div className={styles.stickyCtaPriceRow}>
                <span className={styles.stickyCtaLabel}>Desbloquea el informe legal completo por</span>
                <span className={styles.stickyCtaPrice}>S/19.90</span>
              </div>
              <span className={styles.stickyCtaSubtext}>
                Análisis de 14 fuentes oficiales con PDF descargable.
              </span>
            </div>
            <button type="button" className={styles.stickyCtaBtn} onClick={() => setShowCheckout(true)}>
              Desbloquear por S/19.90
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16171b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12h15" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          {process.env.NODE_ENV === "development" && (
            <button
              type="button"
              disabled={generatingPdf}
              style={{ marginTop: 8, width: "100%", padding: "12px 0", background: "#7C3AED", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: generatingPdf ? 0.5 : 1 }}
              onClick={async () => {
                setGeneratingPdf(true);
                try {
                  const res = await fetch("/api/legal-report/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plate: placa }),
                  });
                  if (!res.ok) throw new Error("Error generando PDF");
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `reporte-legal-${placa}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch {
                  alert("Error generando el reporte.");
                } finally {
                  setGeneratingPdf(false);
                }
              }}
            >
              {generatingPdf ? "Generando PDF..." : "Generar PDF (DEV)"}
            </button>
          )}
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
        <CheckoutOverlay placa={placa} vehicle={vehicle || { marca: "", modelo: "", anio: "", color: "", combustible: "", uso: "" }} onBack={() => setShowCheckout(false)} />
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

function CheckoutOverlay({ placa, vehicle, onBack }: { placa: string; vehicle: VehicleInfo; onBack: () => void }) {
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

  const legalPrice = 19.9;
  const basicaPrice = inspectionPlans[1].price;
  const premiumPrice = inspectionPlans[2].price;

  const total = bump === "premium" ? premiumPrice : bump === "basica" ? basicaPrice : legalPrice;
  const fmt = (n: number) => n % 1 === 0 ? String(n) : n.toFixed(2);
  const hasBump = bump !== "none";
  const availableSlots = getAvailableSlots(date);

  const handleBump = (selected: "basica" | "premium") => {
    setBump(bump === selected ? "none" : selected);
    setTime("");
  };

  const handlePay = async () => {
    if (hasBump) {
      const planType = bump === "premium" ? inspectionPlans[2].type : inspectionPlans[1].type;
      window.location.href = `/agendar?plan=${planType}&placa=${placa}`;
      return;
    }
    setPaying(true);
    setError(null);
    setLoadingStep(0);

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
          Volver
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
                  <span className={styles.bumpName}>Agregar inspección básica <span className={styles.bumpOldPrice}>S/350</span> +S/{fmt(basicaPrice - legalPrice)}</span>
                  <span className={styles.bumpDesc}>200+ puntos, escáner profesional, escaneo de pintura</span>
                  {bump === "basica" && <span className={styles.bumpTotal}>Total S/{fmt(basicaPrice)}</span>}
                </div>
              </button>

              <button type="button" className={`${styles.bumpOption} ${bump === "premium" ? styles.bumpSelected : ""}`} onClick={() => handleBump("premium")}>
                <span className={styles.bumpBadge}>9/10 ELIGEN ESTE</span>
                <div className={`${styles.bumpCheck} ${bump === "premium" ? styles.bumpCheckActive : ""}`}>
                  {bump === "premium" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16171b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className={styles.bumpInfo}>
                  <span className={styles.bumpName}>Agregar Inspección premium <span className={styles.bumpOldPrice}>S/400</span> +S/{fmt(premiumPrice - legalPrice)}</span>
                  <span className={styles.bumpDesc}>+ videoscopía de motor y asesoría de presupuesto</span>
                  {bump === "premium" && <span className={styles.bumpTotal}>Total S/{fmt(premiumPrice)}</span>}
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
                      <label className={styles.scheduleLabel}>Fecha</label>
                      <input type="date" min={todayStr} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} className={styles.scheduleInput} />
                    </div>
                    <div className={styles.scheduleDateWrap}>
                      <label className={styles.scheduleLabel}>Hora</label>
                      <select value={time} onChange={(e) => setTime(e.target.value)} className={styles.scheduleInput} disabled={!date}>
                        <option value="">Seleccionar</option>
                        {availableSlots.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className={styles.checkoutRight}>
            <div className={styles.checkoutSummary}>
              <h3 className={styles.summaryTitle}>Resumen</h3>
              <div className={styles.summaryRow}>
                <span>Informe Legal Express</span>
                <span>S/{fmt(legalPrice)}</span>
              </div>
              {bump === "basica" && (
                <div className={styles.summaryRow}>
                  <span>Inspección Básica</span>
                  <span>+S/{fmt(basicaPrice - legalPrice)}</span>
                </div>
              )}
              {bump === "premium" && (
                <div className={styles.summaryRow}>
                  <span>Inspección Premium</span>
                  <span>+S/{fmt(premiumPrice - legalPrice)}</span>
                </div>
              )}
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>Total</span>
                <span>S/{fmt(total)}</span>
              </div>
            </div>

            {!hasBump && (
              <div className={styles.payMethods}>
                <h4 className={styles.payMethodTitle}>Método de pago</h4>
                <button type="button" className={`${styles.payMethodBtn} ${payMethod === "yape" ? styles.payMethodActive : ""}`} onClick={() => setPayMethod("yape")}>
                  Yape / Plin
                </button>
                <button type="button" className={`${styles.payMethodBtn} ${payMethod === "transfer" ? styles.payMethodActive : ""}`} onClick={() => setPayMethod("transfer")}>
                  Transferencia
                </button>
              </div>
            )}

            {error && <p style={{ color: "#DC2626", fontSize: 14, marginTop: 8 }}>{error}</p>}

            <button
              type="button"
              className={styles.checkoutCta}
              onClick={handlePay}
              disabled={hasBump && (!address || !district || !date || !time)}
            >
              {hasBump ? `Pagar S/${fmt(total)} y agendar` : `Pagar S/${fmt(total)} y generar reporte`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
