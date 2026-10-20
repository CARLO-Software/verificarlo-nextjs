"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "../consultar/Consultar.module.css";
import demo from "./DemoHero.module.css";

const STEPS = [
  "Consultando SUNARP...",
  "Verificando SOAT y gravámenes...",
  "Consultando papeletas y multas...",
  "Generando informe PDF...",
];

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

/* eslint-disable @typescript-eslint/no-explicit-any */

function getTitulos(consultar: any): any[] {
  const t1 = consultar?.sunarp?.siguelo?.titulos;
  if (Array.isArray(t1) && t1.length > 0) return t1;
  const t2 = consultar?.siguelo?.titulos;
  if (Array.isArray(t2) && t2.length > 0) return t2;
  return [];
}

function extractVehicle(consultar: any) {
  const t = getTitulos(consultar).find((t: any) => t.marca) || {};
  return {
    marca: t.marca || "",
    modelo: t.modelo || "",
    anio: t.anio_fabricacion || t.anio_modelo || "",
    color: t.color || "",
    combustible: t.combustible || "",
    cilindrada: t.cilindrada || "",
    nroMotor: t.nro_motor || "",
  };
}

const SKIP_NAMES = new Set(["COPROPIEDAD", "PROPIEDAD EXCLUSIVA", "PERSONA NATURAL", "PERSONA JURÍDICA", "PERSONA JURIDICA", "SOLTERO", "SOLTERA", "CASADO", "CASADA", "VIUDO", "VIUDA", "DIVORCIADO", "DIVORCIADA"]);

function countOwners(consultar: any): number {
  const titulos = getTitulos(consultar);
  if (titulos.length === 0) return 0;
  const names = new Set<string>();
  for (const t of titulos) {
    if (t?.nombre && typeof t.nombre === "string") {
      t.nombre.split("|").map((n: string) => n.trim()).filter(Boolean)
        .filter((n: string) => !SKIP_NAMES.has(n.toUpperCase()))
        .forEach((n: string) => names.add(n.toUpperCase()));
    }
  }
  return names.size || titulos.length;
}

function isExpired(fechaVcto: string | undefined): boolean {
  if (!fechaVcto) return false;
  const parts = fechaVcto.split("/");
  if (parts.length !== 3) return false;
  const [d, m, y] = parts;
  return new Date(`${y}-${m}-${d}T23:59:59`) < new Date();
}

function buildFindings(consultar: any): { icon: string; label: string; danger: boolean }[] {
  const findings: { icon: string; label: string; danger: boolean }[] = [];

  const soat = consultar?.sbs_soat;
  if (soat) {
    const expired = isExpired(soat.vencimiento);
    findings.push({ icon: "⊘", label: expired ? "SOAT Vencido" : "SOAT Vigente", danger: expired });
  }

  const siniestros = consultar?.siniestros_soat || consultar?.sbs_siniestros;
  if (siniestros && !siniestros.sin_resultados) {
    const count = siniestros.cantidad || siniestros.siniestros?.length || 1;
    findings.push({ icon: "🚗", label: `${count} siniestro${count > 1 ? "s" : ""} registrado${count > 1 ? "s" : ""}`, danger: true });
  }

  const nOwners = countOwners(consultar);
  if (nOwners > 0) {
    findings.push({ icon: "👤", label: `${nOwners} propietario${nOwners > 1 ? "s" : ""}`, danger: false });
  }

  const gar = consultar?.sunarp_garantias;
  if (gar && !gar.sin_resultados) {
    findings.push({ icon: "⚠", label: "Con gravámenes", danger: true });
  }

  return findings;
}

function formatPlateDisplay(plate: string): string {
  const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length <= 3) return clean;
  return clean.slice(0, 3) + "-" + clean.slice(3, 6);
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export default function DemoClient({ initialPlaca }: { initialPlaca: string }) {
  const [placa] = useState(initialPlaca);
  const [phase, setPhase] = useState<"loading" | "preview" | "generating" | "done" | "error">("loading");
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [genStep, setGenStep] = useState(0);

  const cleanPlate = placa.toUpperCase().replace(/-/g, "").replace(/\s/g, "");
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    const stepTimer = setInterval(() => setStep(p => Math.min(p + 1, STEPS.length - 1)), 800);
    const progTimer = setInterval(() => setProgress(p => Math.min(p + 3, 95)), 100);

    fetch("/api/legal-report/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plate: cleanPlate }),
    })
      .then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Error");
        }
        return res.json();
      })
      .then(data => {
        setPreviewData(data);
        setProgress(100);
        setTimeout(() => setPhase("preview"), 400);
      })
      .catch((err) => {
        setError(err.message || "No se pudo consultar la placa. Verifica e intenta de nuevo.");
        setPhase("error");
      })
      .finally(() => {
        clearInterval(stepTimer);
        clearInterval(progTimer);
      });
  }, [cleanPlate]);

  const handleGenerarPdf = async () => {
    setPhase("generating");
    setGenStep(0);
    const timer = setInterval(() => setGenStep(p => Math.min(p + 1, REPORT_SOURCES.length - 1)), 12000);

    try {
      const res = await fetch("/api/legal-report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate: cleanPlate }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Error" }));
        throw new Error(body.error || "Error generando el PDF");
      }
      const blob = await res.blob();
      setPdfUrl(URL.createObjectURL(blob));
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error generando el PDF");
      setPhase("error");
    } finally {
      clearInterval(timer);
    }
  };

  const reset = () => {
    window.location.href = "/demo";
  };

  const handleDownloadExample = async () => {
    const res = await fetch("/api/legal-report/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plate: "ABC123", useMock: true, isExample: true }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ejemplo-reporte-legal.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const genProgress = Math.min(Math.round(((genStep + 1) / REPORT_SOURCES.length) * 95), 95);

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
                Consultando fuentes oficiales para {cleanPlate}
              </h2>
              <p className={styles.loadingSubtitle}>
                Esto toma entre <b>10 y 30 segundos</b>. No cierres esta ventana.
              </p>

              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>

              <div className={styles.stepsList}>
                {STEPS.map((s, i) => (
                  <div
                    key={i}
                    className={`${styles.stepItem} ${
                      i < step ? styles.stepDone : i === step ? styles.stepActive : styles.stepPending
                    }`}
                  >
                    <div className={styles.stepIcon}>
                      {i < step ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C8A0E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                      ) : i === step ? (
                        <div className={styles.stepSpinner} />
                      ) : (
                        <div className={styles.stepDot} />
                      )}
                    </div>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
    );
  }

  if (phase === "preview" && previewData) {
    const vehicle = extractVehicle(previewData.consultar);
    const findings = buildFindings(previewData.consultar);
    const nOwners = countOwners(previewData.consultar);
    const soat = previewData.consultar?.sbs_soat;
    const soatExpired = soat ? isExpired(soat.vencimiento) : false;
    const citv = previewData.consultar?.citv;
    const citvExpired = citv ? isExpired(citv.fecha_vcto) : false;
    const siniestros = previewData.consultar?.siniestros_soat || previewData.consultar?.sbs_siniestros;
    const nSiniestros = siniestros?.cantidad || siniestros?.siniestros?.length || (siniestros && !siniestros.sin_resultados ? 1 : 0);
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f3", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {/* Banner */}
        <div className={demo.promoBanner}>
          🔥 <em>20% de descuento en Inspección Premium</em>
        </div>
        {/* Header */}
        <div className={demo.previewHeader}>
          <span className={demo.previewLogo}>
            <span style={{ color: "#EFC901" }}>VERIFI</span>
            <span style={{ color: "#fff", fontStyle: "italic" }}>CARLO</span>
          </span>
        </div>

        <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px" }}>
          <div className={demo.previewPage}>
              <button className={demo.backBtn} onClick={reset}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                Volver
              </button>

              {/* Vehicle card */}
              <div className={demo.vehicleCard}>
                <div className={demo.vehicleCardTop}>
                  <div>
                    <h2 className={demo.vehicleName}>{vehicle.marca} {vehicle.modelo}</h2>
                    <span className={demo.vehicleYear}>{vehicle.anio}</span>
                  </div>
                  <div className={demo.plateBadge}>
                    <Image src="/assets/images/icons/bandera-peru.png" alt="PE" width={22} height={14} />
                    <span>{formatPlateDisplay(cleanPlate)}</span>
                  </div>
                </div>

                <div className={demo.specsGrid}>
                  {vehicle.color && (
                    <div className={demo.specItem}>
                      <span className={demo.specLabel}>COLOR</span>
                      <span className={demo.specValue}>{vehicle.color}</span>
                    </div>
                  )}
                  {vehicle.combustible && (
                    <div className={demo.specItem}>
                      <span className={demo.specLabel}>COMBUSTIBLE</span>
                      <span className={demo.specValue}>{vehicle.combustible}</span>
                    </div>
                  )}
                  {vehicle.cilindrada && (
                    <div className={demo.specItem}>
                      <span className={demo.specLabel}>CILINDRADA</span>
                      <span className={demo.specValue}>{vehicle.cilindrada} cc</span>
                    </div>
                  )}
                  {vehicle.nroMotor && (
                    <div className={demo.specItem}>
                      <span className={demo.specLabel}>Nº DE MOTOR</span>
                      <span className={demo.specValue}>{vehicle.nroMotor.slice(0, -3)}***</span>
                    </div>
                  )}
                </div>

                <div className={demo.vehicleFooter}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
                  <span>Datos oficiales de SUNARP</span>
                </div>
              </div>

              {/* Findings card */}
              <div className={demo.findingsCard}>
                <span className={demo.findingsLabel}>RESULTADO DE CONSULTA GRATUITA</span>
                <h3 className={demo.findingsTitle}>
                  Encontramos {findings.length} punto{findings.length !== 1 ? "s" : ""} que revisar antes de pagar por este auto
                </h3>

                <div className={demo.findingsBadges}>
                  {findings.map((f, i) => (
                    <span key={i} className={`${demo.findingBadge} ${f.danger ? demo.findingDanger : demo.findingYellow}`}>
                      {f.icon} {f.label}
                    </span>
                  ))}
                </div>

                <p className={demo.findingsDesc}>
                  Ya sabes que existen. Qué tan fuerte fue el choque, si el auto tiene deudas o embargos y cuánto pagó el vendedor: eso está en el Reporte Legal Completo.
                </p>

                <button className={demo.unlockBtn} onClick={handleGenerarPdf}>
                  Desbloquear todo por S/ 0.00
                </button>
              </div>

              {/* Resultados Gratuitos */}
              <div className={demo.gratuitosSection}>
                <h2 className={demo.gratuitosTitle}>Resultados <strong>Gratuitos</strong></h2>
                <p className={demo.gratuitosDesc}>
                  Estás viendo una fracción del historial. Conoce el estado legal completo antes de tomar una decisión financiera.
                </p>

                <div className={demo.ownerCard}>
                  <div className={demo.ownerCardHeader}>
                    <div className={demo.ownerIcon}><span className={demo.emojiBlack}>👥</span></div>
                    <h3 className={demo.ownerCardTitle}>Historial de propietarios</h3>
                  </div>

                  <div className={demo.ownerCount}>
                    <span className={demo.ownerCountNum}>{nOwners}</span>
                    <span className={demo.ownerCountLabel}>PROPIETARIOS REGISTRADOS</span>
                  </div>

                  <p className={demo.ownerAlert}>
                    Varios cambios de dueño en poco tiempo suelen ser una señal de alerta
                  </p>

                  <div className={demo.lockedSection}>
                    <p className={demo.lockedTitle}>EN EL REPORTE COMPLETO</p>
                    {Array.from({ length: Math.min(nOwners || 3, 3) }).map((_, i) => (
                      <div key={i} className={demo.lockedRow}>
                        <svg className={demo.lockedLock} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        <div className={demo.lockedInfo}>
                          <span className={demo.lockedLabel}>PROPIETARIO ACTUAL</span>
                          <span className={demo.lockedValue}>BLANCO BLANCO BLANCO</span>
                        </div>
                        <span className={demo.lockedArrow}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1c1d22" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SOAT y revisión técnica */}
                <div className={demo.ownerCard}>
                  <div className={demo.ownerCardHeader}>
                    <div className={demo.ownerIcon}><span className={demo.emojiBlack}>🚗</span></div>
                    <h3 className={demo.ownerCardTitle}>SOAT y revisión técnica</h3>
                  </div>

                  {soat && (
                    <div className={demo.soatRow}>
                      <div>
                        <span className={demo.soatName}>SOAT {soat.empresa || ""}</span>
                        <span className={demo.soatDate}>VIGENCIA HASTA {soat.vencimiento || "—"}</span>
                      </div>
                      <span className={`${demo.statusBadge} ${soatExpired ? demo.statusDanger : demo.statusOk}`}>
                        {soatExpired ? "⊘ Vencido" : "✓ Al día"}
                      </span>
                    </div>
                  )}

                  {citv && (
                    <div className={demo.soatRow}>
                      <div>
                        <span className={demo.soatName}>Revisión técnica (RTV)</span>
                        <span className={demo.soatDate}>{citvExpired ? "VENCIDA" : "APROBADA Y VIGENTE"}</span>
                      </div>
                      <span className={`${demo.statusBadge} ${citvExpired ? demo.statusDanger : demo.statusOk}`}>
                        {citvExpired ? "⊘ Vencido" : "✓ Al día"}
                      </span>
                    </div>
                  )}

                  <p className={demo.ownerAlert}>
                    Un SOAT vencido suele venir con papeletas pendientes. Y las papeletas se quedan con el auto, no con el vendedor.
                  </p>

                  <div className={demo.lockedSection}>
                    <p className={demo.lockedTitle}>EN EL REPORTE COMPLETO</p>
                    <div className={demo.lockedRow}>
                      <svg className={demo.lockedLock} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      <div className={demo.lockedInfo}>
                        <span className={demo.lockedLabel}>PAPELETAS PENDIENTES A HOY</span>
                        <span className={demo.lockedValue}>BLANCO BLANCO BLANCO</span>
                      </div>
                      <span className={demo.lockedArrow}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1c1d22" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Historial de siniestros */}
                <div className={demo.ownerCard}>
                  <div className={demo.ownerCardHeader}>
                    <div className={demo.ownerIcon}><span className={demo.emojiBlack}>🚗</span></div>
                    <h3 className={demo.ownerCardTitle}>Historial de siniestros</h3>
                  </div>

                  <div className={demo.ownerCount}>
                    <span className={demo.ownerCountNum}>{nSiniestros}</span>
                    <span className={demo.ownerCountLabel}>SINIESTRO{nSiniestros !== 1 ? "S" : ""} REGISTRADO{nSiniestros !== 1 ? "S" : ""} PARA ESTA PLACA</span>
                  </div>

                  <p className={demo.ownerAlert}>
                    Lo que importa es qué tan fuerte fue y cómo lo repararon. Un choque mal reparado baja el precio y sube el riesgo.
                  </p>

                  <div className={demo.lockedSection}>
                    <p className={demo.lockedTitle}>EN EL REPORTE COMPLETO</p>
                    {[
                      "TIPO DE IMPACTO Y FECHA",
                      "DENUNCIA POLICIAL Y HERIDOS",
                      "DAÑOS REGISTRADOS",
                    ].map((label, i) => (
                      <div key={i} className={demo.lockedRow}>
                        <svg className={demo.lockedLock} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        <div className={demo.lockedInfo}>
                          <span className={demo.lockedLabel}>{label}</span>
                          <span className={demo.lockedValue}>BLANCO BLANCO BLANCO</span>
                        </div>
                        <span className={demo.lockedArrow}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1c1d22" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gravámenes y embargos */}
                <div className={demo.ownerCard}>
                  <div className={demo.ownerCardHeader}>
                    <div className={demo.ownerIcon}><span className={demo.emojiBlack}>🚙</span></div>
                    <h3 className={demo.ownerCardTitle}>Gravámenes y embargos</h3>
                  </div>

                  <p className={demo.ownerAlert} style={{ marginBottom: 20 }}>
                    Si el auto tiene un gravamen o embargo, la deuda se queda con el auto, no con el vendedor. Y mientras no se levante, no pasa a tu nombre.
                  </p>

                  <div className={demo.lockedSection}>
                    <p className={demo.lockedTitle}>EN EL REPORTE COMPLETO</p>
                    {[
                      "GRAVÁMENES VIGENTES (SUNARP)",
                      "EMBARGOS",
                      "PRENDA VEHICULAR O LEASING",
                    ].map((label, i) => (
                      <div key={i} className={demo.lockedRow}>
                        <svg className={demo.lockedLock} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        <div className={demo.lockedInfo}>
                          <span className={demo.lockedLabel}>{label}</span>
                          <span className={demo.lockedValue}>BLANCO BLANCO BLANCO</span>
                        </div>
                        <span className={demo.lockedArrow}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1c1d22" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Papeletas y deudas SAT */}
                <div className={demo.ownerCard}>
                  <div className={demo.ownerCardHeader}>
                    <div className={demo.ownerIcon}><span className={demo.emojiBlack}>📋</span></div>
                    <h3 className={demo.ownerCardTitle}>Papeletas y deudas SAT</h3>
                  </div>

                  <p className={demo.ownerAlert} style={{ marginBottom: 20 }}>
                    Las papeletas y el impuesto vehicular pendientes los hereda el nuevo dueño. Mejor saberlo antes de negociar el precio.
                  </p>

                  <div className={demo.lockedSection}>
                    <p className={demo.lockedTitle}>EN EL REPORTE COMPLETO</p>
                    {[
                      "PAPELETAS PENDIENTES (DETALLE Y MONTO)",
                      "IMPUESTO VEHICULAR PENDIENTE",
                      "DEUDA TOTAL CON EL SAT",
                    ].map((label, i) => (
                      <div key={i} className={demo.lockedRow}>
                        <svg className={demo.lockedLock} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        <div className={demo.lockedInfo}>
                          <span className={demo.lockedLabel}>{label}</span>
                          <span className={demo.lockedValue}>BLANCO BLANCO BLANCO</span>
                        </div>
                        <span className={demo.lockedArrow}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1c1d22" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Último precio de compra */}
                <div className={demo.ownerCard}>
                  <div className={demo.ownerCardHeader}>
                    <div className={demo.ownerIcon}><span className={demo.emojiBlack}>💰</span></div>
                    <h3 className={demo.ownerCardTitle}>Último precio de compra</h3>
                  </div>

                  <p className={demo.ownerAlert} style={{ marginBottom: 20 }}>
                    Cuánto pagó el vendedor por este auto. Con ese dato negocias con ventaja.
                  </p>

                  <div className={demo.lockedSection}>
                    <p className={demo.lockedTitle}>EN EL REPORTE COMPLETO</p>
                    {[
                      "PRECIO DE LA ÚLTIMA TRANSFERENCIA",
                      "FECHA DE ESA COMPRA",
                    ].map((label, i) => (
                      <div key={i} className={demo.lockedRow}>
                        <svg className={demo.lockedLock} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        <div className={demo.lockedInfo}>
                          <span className={demo.lockedLabel}>{label}</span>
                          <span className={demo.lockedValue}>BLANCO BLANCO BLANCO</span>
                        </div>
                        <span className={demo.lockedArrow}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1c1d22" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              {/* CTA final */}
              <div className={demo.ctaCard}>
                <h2 className={demo.ctaCardTitle}>
                  Obtén el Reporte Legal Completo en minutos <em>por solo S/ 0.00.</em>
                </h2>
                <p className={demo.ctaCardDesc}>
                  Desbloquea para ver el resto de información legal del carro usado que vas a comprar. Toma de 3 a 5 minutos.
                </p>

                <div className={demo.ctaCardList}>
                  <div className={demo.ctaCardItem}><span className={demo.ctaCardIcon}><span className={demo.emojiBlack}>🚗</span></span> Historial de siniestros</div>
                  <div className={demo.ctaCardItem}><span className={demo.ctaCardIcon}><span className={demo.emojiBlack}>🚙</span></span> Gravámenes y embargos</div>
                  <div className={demo.ctaCardItem}><span className={demo.ctaCardIcon}><span className={demo.emojiBlack}>💰</span></span> Último precio de compra</div>
                  <div className={demo.ctaCardItem}><span className={demo.ctaCardIcon}><span className={demo.emojiBlack}>📋</span></span> Papeletas, deudas SAT y otros</div>
                </div>

                <button className={demo.ctaCardBtn} onClick={handleGenerarPdf}>
                  Desbloquear todo por S/ 0.00
                </button>

                <button onClick={handleDownloadExample} className={demo.ctaCardLink}>
                  Ver ejemplo del Reporte Legal
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
    );
  }

  if (phase === "generating") {
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
              <span className={styles.ringPercent}>{genProgress}%</span>
              <span className={styles.ringLabel}>GENERANDO</span>
            </div>
          </div>

          <h2 className={styles.loadingTitle}>
            Generando Reporte Legal para {cleanPlate}
          </h2>
          <p className={styles.loadingSubtitle}>
            Esto toma entre <b>1 y 4 minutos</b>. No cierres esta ventana.
          </p>

          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${genProgress}%` }} />
          </div>

          <div className={styles.stepsList}>
            {REPORT_SOURCES.map((s, i) => (
              <div
                key={i}
                className={`${styles.stepItem} ${
                  i < genStep ? styles.stepDone : i === genStep ? styles.stepActive : styles.stepPending
                }`}
              >
                <div className={styles.stepIcon}>
                  {i < genStep ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C8A0E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                  ) : i === genStep ? (
                    <div className={styles.stepSpinner} />
                  ) : (
                    <div className={styles.stepDot} />
                  )}
                </div>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "done" && pdfUrl) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f3", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "48px 20px", textAlign: "center" }}>
          <div className={demo.doneIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className={demo.doneTitle}>Reporte Legal generado</h2>
          <p className={demo.doneSubtitle}>Placa {cleanPlate}</p>

          <iframe src={pdfUrl} className={demo.donePdf} title="PDF Preview" />

          <a href={pdfUrl} download={`reporte-legal-${cleanPlate}.pdf`} className={demo.doneDownload}>
            Descargar PDF
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
          </a>
          <button onClick={reset} className={demo.doneReset}>Consultar otra placa</button>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingBgPattern} />
        <div className={styles.loadingContent}>
          <h2 className={styles.loadingTitle}>No pudimos generar el reporte</h2>
          <p className={styles.loadingSubtitle}>{error}</p>
          <button className={demo.ctaCardBtn} style={{ maxWidth: 300, marginTop: 24 }} onClick={reset}>
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return null;
}
