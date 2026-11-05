"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import PromotionalBanner from "@/app/layout/promotionalBanner/PromotionalBanner";
import NavBar from "@/app/layout/navBar/NavBar";
import Footer from "@/app/layout/footer/Footer";
import styles from "./Consultar.module.css";
import demo from "./Result.module.css";

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

function countOwners(consultar: any): number {
  const titulos = getTitulos(consultar);
  return titulos.filter((t: any) => {
    const doc = t?.tipo_doc || "";
    return doc === "Transferencia de Propiedad" || /inscripci[oó]n.*veh[ií]culo|primera\s+inscripci[oó]n/i.test(doc);
  }).length;
}

function isExpired(fechaVcto: string | undefined): boolean {
  if (!fechaVcto) return false;
  const parts = fechaVcto.split("/");
  if (parts.length !== 3) return false;
  const [d, m, y] = parts;
  return new Date(`${y}-${m}-${d}T23:59:59`) < new Date();
}

function getSoatExpiry(consultar: any): string | undefined {
  return consultar?.soat?.Fin;
}

function getSoatCompany(consultar: any): string {
  return consultar?.soat?.["Compañía"] || "";
}

function getSiniestrosCount(consultar: any): number {
  const explicit = consultar?.siniestros_soat || consultar?.sbs_siniestros;
  if (explicit && !explicit.sin_resultados) {
    return explicit.cantidad || explicit.siniestros?.length || 1;
  }
  const soatHist = consultar?.soat?.historial;
  if (Array.isArray(soatHist)) {
    let total = 0;
    for (const h of soatHist) {
      const n = parseInt(h?.["Nro. Accidentes"] || h?.nro_accidentes || "0", 10);
      if (!isNaN(n)) total += n;
    }
    return total;
  }
  return 0;
}

function buildFindings(consultar: any): { icon: string; label: string; variant: "danger" | "green" | "yellow" }[] {
  const findings: { icon: string; label: string; variant: "danger" | "green" | "yellow" }[] = [];

  const soatExpiry = getSoatExpiry(consultar);
  if (soatExpiry) {
    const expired = isExpired(soatExpiry);
    findings.push({ icon: expired ? "/assets/icons/vista-previa-reporte-legal/vencido.svg" : "/assets/icons/vista-previa-reporte-legal/Check.svg", label: expired ? "SOAT Vencido" : "SOAT Vigente", variant: expired ? "danger" : "green" });
  }

  const nSiniestros = getSiniestrosCount(consultar);
  if (nSiniestros > 0) {
    findings.push({ icon: "/assets/icons/vista-previa-reporte-legal/Shield.svg", label: `${nSiniestros} siniestro${nSiniestros > 1 ? "s" : ""} registrado${nSiniestros > 1 ? "s" : ""}`, variant: "danger" });
  }

  const nOwners = countOwners(consultar);
  if (nOwners > 0) {
    findings.push({ icon: "/assets/icons/vista-previa-reporte-legal/propietarios.svg", label: `${nOwners} propietario${nOwners > 1 ? "s" : ""}`, variant: "yellow" });
  }

  const gar = consultar?.sunarp_garantias;
  if (gar && !gar.sin_resultados) {
    findings.push({ icon: "/assets/icons/vista-previa-reporte-legal/Shield.svg", label: "Con gravámenes", variant: "danger" });
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
  const [phase, setPhase] = useState<"loading" | "preview" | "capture" | "verify" | "generating" | "done" | "error">("loading");
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [genStep, setGenStep] = useState(0);
  const [captureForm, setCaptureForm] = useState({ name: "", phone: "" });
  const [otpCode, setOtpCode] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

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

  const handleUnlock = () => {
    setPhase("capture");
    setFormError("");
  };

  const handleSendCode = async () => {
    const { name, phone } = captureForm;
    if (!name.trim() || name.trim().length < 2) { setFormError("Ingresa tu nombre"); return; }
    if (!/^9\d{8}$/.test(phone)) { setFormError("Ingresa un número válido (9 dígitos)"); return; }
    setFormError("");
    setFormLoading(true);
    try {
      const res = await fetch("/api/verify/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone, plate: cleanPlate }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error enviando código");
      }
      setPhase("verify");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error enviando código");
    } finally {
      setFormLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (otpCode.length !== 6) { setFormError("Ingresa el código de 6 dígitos"); return; }
    setFormError("");
    setFormLoading(true);
    try {
      const res = await fetch("/api/verify/check-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: captureForm.phone, code: otpCode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Código incorrecto");
      }
      handleGenerarPdf();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Código incorrecto");
    } finally {
      setFormLoading(false);
    }
  };

  const handleResendCode = async () => {
    setFormError("");
    setFormLoading(true);
    try {
      await fetch("/api/verify/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: captureForm.name.trim(), phone: captureForm.phone, plate: cleanPlate }),
      });
      setFormError("Código reenviado");
    } catch {
      setFormError("Error reenviando código");
    } finally {
      setFormLoading(false);
    }
  };

  const handleGenerarPdf = async () => {
    setPhase("generating");
    setGenStep(0);
    let step = 0;
    const fastTimer = setInterval(() => {
      step++;
      setGenStep(step);
      if (step >= 5) clearInterval(fastTimer);
    }, 400);
    const timer = setTimeout(() => {
      clearInterval(fastTimer);
    }, 2500);
    const slowTimer = setInterval(() => setGenStep(p => Math.min(p + 1, REPORT_SOURCES.length - 1)), 12000);

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
      clearInterval(fastTimer);
      clearTimeout(timer);
      clearInterval(slowTimer);
    }
  };

  const reset = () => {
    window.location.href = "/";
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

  if ((phase === "preview" || phase === "capture" || phase === "verify") && previewData) {
    const vehicle = extractVehicle(previewData.consultar);
    const findings = buildFindings(previewData.consultar);
    const nOwners = countOwners(previewData.consultar);
    const soatExpiry = getSoatExpiry(previewData.consultar);
    const soatCompany = getSoatCompany(previewData.consultar);
    const soatExpired = soatExpiry ? isExpired(soatExpiry) : false;
    const citv = previewData.consultar?.citv;
    const citvExpired = citv ? isExpired(citv.fecha_vcto) : false;
    const nSiniestros = getSiniestrosCount(previewData.consultar);
    return (
      <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <PromotionalBanner />
        <NavBar />

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
                    <Image src="/assets/icons/vista-previa-reporte-legal/twemoji_flag-peru.svg" alt="PE" width={22} height={14} />
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
                    <span key={i} className={`${demo.findingBadge} ${f.variant === "danger" ? demo.findingDanger : f.variant === "green" ? demo.findingGreen : demo.findingYellow}`}>
                      <Image src={f.icon} alt="" width={16} height={16} /> {f.label}
                    </span>
                  ))}
                </div>

                <p className={demo.findingsDesc}>
                  Ya sabes que existen. Qué tan fuerte fue el choque, si el auto tiene deudas o embargos y cuánto pagó el vendedor: eso está en el Reporte Legal Completo.
                </p>

                <p className={demo.launchPromo}>
                  Por Lanzamiento: ¡Genera tu reporte completo gratis por tiempo limitado!
                </p>

                <button className={demo.unlockBtn} onClick={handleUnlock}>
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
                    <div className={demo.ownerIcon}><Image src="/assets/icons/vista-previa-reporte-legal/propietarios.svg" alt="" width={18} height={18} /></div>
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
                        <Image src="/assets/icons/vista-previa-reporte-legal/Lock.svg" alt="" width={18} height={18} className={demo.lockedLock} />
                        <div className={demo.lockedInfo}>
                          <span className={demo.lockedLabel}>PROPIETARIO ACTUAL</span>
                          <span className={demo.lockedValue}>Juan Pérez García</span>
                        </div>
                        <span className={demo.lockedArrow}>
                          <Image src="/assets/icons/vista-previa-reporte-legal/Up Right.svg" alt="" width={14} height={14} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SOAT y revisión técnica */}
                <div className={demo.ownerCard}>
                  <div className={demo.ownerCardHeader}>
                    <div className={demo.ownerIcon}><Image src="/assets/icons/vista-previa-reporte-legal/siniestros.svg" alt="" width={18} height={18} /></div>
                    <h3 className={demo.ownerCardTitle}>SOAT y revisión técnica</h3>
                  </div>

                  {soatExpiry && (
                    <div className={demo.soatRow}>
                      <div>
                        <span className={demo.soatName}>SOAT {soatCompany}</span>
                        <span className={demo.soatDate}>VIGENCIA HASTA {soatExpiry}</span>
                      </div>
                      <span className={`${demo.statusBadge} ${soatExpired ? demo.statusDanger : demo.statusOk}`}>
                        <Image src={soatExpired ? "/assets/icons/vista-previa-reporte-legal/vencido.svg" : "/assets/icons/vista-previa-reporte-legal/Check.svg"} alt="" width={14} height={14} /> {soatExpired ? "Vencido" : "Al día"}
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
                        <Image src={citvExpired ? "/assets/icons/vista-previa-reporte-legal/vencido.svg" : "/assets/icons/vista-previa-reporte-legal/Check.svg"} alt="" width={14} height={14} /> {citvExpired ? "Vencido" : "Al día"}
                      </span>
                    </div>
                  )}

                  <p className={demo.ownerAlert}>
                    Un SOAT vencido suele venir con papeletas pendientes. Y las papeletas se quedan con el auto, no con el vendedor.
                  </p>

                  <div className={demo.lockedSection}>
                    <p className={demo.lockedTitle}>EN EL REPORTE COMPLETO</p>
                    <div className={demo.lockedRow}>
                      <Image src="/assets/icons/vista-previa-reporte-legal/Lock.svg" alt="" width={18} height={18} className={demo.lockedLock} />
                      <div className={demo.lockedInfo}>
                        <span className={demo.lockedLabel}>PAPELETAS PENDIENTES A HOY</span>
                        <span className={demo.lockedValue}>3 papeletas · S/ 1,240</span>
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
                    <div className={demo.ownerIcon}><Image src="/assets/icons/vista-previa-reporte-legal/siniestros.svg" alt="" width={18} height={18} /></div>
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
                      { label: "TIPO DE IMPACTO Y FECHA", value: "Choque frontal · 15/03/2023" },
                      { label: "DENUNCIA POLICIAL Y HERIDOS", value: "Sin heridos registrados" },
                      { label: "DAÑOS REGISTRADOS", value: "Parachoque, faro derecho" },
                    ].map((item, i) => (
                      <div key={i} className={demo.lockedRow}>
                        <Image src="/assets/icons/vista-previa-reporte-legal/Lock.svg" alt="" width={18} height={18} className={demo.lockedLock} />
                        <div className={demo.lockedInfo}>
                          <span className={demo.lockedLabel}>{item.label}</span>
                          <span className={demo.lockedValue}>{item.value}</span>
                        </div>
                        <span className={demo.lockedArrow}>
                          <Image src="/assets/icons/vista-previa-reporte-legal/Up Right.svg" alt="" width={14} height={14} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gravámenes y embargos */}
                <div className={demo.ownerCard}>
                  <div className={demo.ownerCardHeader}>
                    <div className={demo.ownerIcon}><Image src="/assets/icons/vista-previa-reporte-legal/alcancia.svg" alt="" width={18} height={18} /></div>
                    <h3 className={demo.ownerCardTitle}>Gravámenes y embargos</h3>
                  </div>

                  <p className={demo.ownerAlert} style={{ marginBottom: 20 }}>
                    Si el auto tiene un gravamen o embargo, la deuda se queda con el auto, no con el vendedor. Y mientras no se levante, no pasa a tu nombre.
                  </p>

                  <div className={demo.lockedSection}>
                    <p className={demo.lockedTitle}>EN EL REPORTE COMPLETO</p>
                    {[
                      { label: "GRAVÁMENES VIGENTES (SUNARP)", value: "Prenda a favor de BCP" },
                      { label: "EMBARGOS", value: "Sin embargos activos" },
                      { label: "PRENDA VEHICULAR O LEASING", value: "Leasing vigente hasta 2025" },
                    ].map((item, i) => (
                      <div key={i} className={demo.lockedRow}>
                        <Image src="/assets/icons/vista-previa-reporte-legal/Lock.svg" alt="" width={18} height={18} className={demo.lockedLock} />
                        <div className={demo.lockedInfo}>
                          <span className={demo.lockedLabel}>{item.label}</span>
                          <span className={demo.lockedValue}>{item.value}</span>
                        </div>
                        <span className={demo.lockedArrow}>
                          <Image src="/assets/icons/vista-previa-reporte-legal/Up Right.svg" alt="" width={14} height={14} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Papeletas y deudas SAT */}
                <div className={demo.ownerCard}>
                  <div className={demo.ownerCardHeader}>
                    <div className={demo.ownerIcon}><Image src="/assets/icons/vista-previa-reporte-legal/documento.svg" alt="" width={18} height={18} /></div>
                    <h3 className={demo.ownerCardTitle}>Papeletas y deudas SAT</h3>
                  </div>

                  <p className={demo.ownerAlert} style={{ marginBottom: 20 }}>
                    Las papeletas y el impuesto vehicular pendientes los hereda el nuevo dueño. Mejor saberlo antes de negociar el precio.
                  </p>

                  <div className={demo.lockedSection}>
                    <p className={demo.lockedTitle}>EN EL REPORTE COMPLETO</p>
                    {[
                      { label: "PAPELETAS PENDIENTES (DETALLE Y MONTO)", value: "2 papeletas · S/ 860" },
                      { label: "IMPUESTO VEHICULAR PENDIENTE", value: "S/ 320 (2024)" },
                      { label: "DEUDA TOTAL CON EL SAT", value: "S/ 1,180 acumulado" },
                    ].map((item, i) => (
                      <div key={i} className={demo.lockedRow}>
                        <Image src="/assets/icons/vista-previa-reporte-legal/Lock.svg" alt="" width={18} height={18} className={demo.lockedLock} />
                        <div className={demo.lockedInfo}>
                          <span className={demo.lockedLabel}>{item.label}</span>
                          <span className={demo.lockedValue}>{item.value}</span>
                        </div>
                        <span className={demo.lockedArrow}>
                          <Image src="/assets/icons/vista-previa-reporte-legal/Up Right.svg" alt="" width={14} height={14} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Último precio de compra */}
                <div className={demo.ownerCard}>
                  <div className={demo.ownerCardHeader}>
                    <div className={demo.ownerIcon}><Image src="/assets/icons/vista-previa-reporte-legal/Wallet.svg" alt="" width={18} height={18} /></div>
                    <h3 className={demo.ownerCardTitle}>Último precio de compra</h3>
                  </div>

                  <p className={demo.ownerAlert} style={{ marginBottom: 20 }}>
                    Cuánto pagó el vendedor por este auto. Con ese dato negocias con ventaja.
                  </p>

                  <div className={demo.lockedSection}>
                    <p className={demo.lockedTitle}>EN EL REPORTE COMPLETO</p>
                    {[
                      { label: "PRECIO DE LA ÚLTIMA TRANSFERENCIA", value: "US$ 12,500" },
                      { label: "FECHA DE ESA COMPRA", value: "08/11/2022" },
                    ].map((item, i) => (
                      <div key={i} className={demo.lockedRow}>
                        <Image src="/assets/icons/vista-previa-reporte-legal/Lock.svg" alt="" width={18} height={18} className={demo.lockedLock} />
                        <div className={demo.lockedInfo}>
                          <span className={demo.lockedLabel}>{item.label}</span>
                          <span className={demo.lockedValue}>{item.value}</span>
                        </div>
                        <span className={demo.lockedArrow}>
                          <Image src="/assets/icons/vista-previa-reporte-legal/Up Right.svg" alt="" width={14} height={14} />
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
                  <div className={demo.ctaCardItem}><span className={demo.ctaCardIcon}><Image src="/assets/icons/vista-previa-reporte-legal/siniestros.svg" alt="" width={16} height={16} /></span> Historial de siniestros</div>
                  <div className={demo.ctaCardItem}><span className={demo.ctaCardIcon}><Image src="/assets/icons/vista-previa-reporte-legal/alcancia.svg" alt="" width={16} height={16} /></span> Gravámenes y embargos</div>
                  <div className={demo.ctaCardItem}><span className={demo.ctaCardIcon}><Image src="/assets/icons/vista-previa-reporte-legal/Wallet.svg" alt="" width={16} height={16} /></span> Último precio de compra</div>
                  <div className={demo.ctaCardItem}><span className={demo.ctaCardIcon}><Image src="/assets/icons/vista-previa-reporte-legal/documento.svg" alt="" width={16} height={16} /></span> Papeletas, deudas SAT y otros</div>
                </div>

                <p className={`${demo.launchPromo} ${demo.launchPromoDark}`}>
                  Por Lanzamiento: ¡Genera tu reporte completo gratis por tiempo limitado!
                </p>

                <button className={demo.ctaCardBtn} onClick={handleUnlock}>
                  Desbloquear todo por S/ 0.00
                </button>

                <button onClick={handleDownloadExample} className={demo.ctaCardLink}>
                  Ver ejemplo del Reporte Legal
                  <Image src="/assets/icons/vista-previa-reporte-legal/descargar.svg" alt="" width={22} height={22} />
                </button>
              </div>
              </div>
            </div>
          </div>

          {(phase === "capture" || phase === "verify") && (
            <div className={demo.modalOverlay} onClick={() => setPhase("preview")}>
              <div className={demo.modalContent} onClick={e => e.stopPropagation()}>
                <button className={demo.modalClose} onClick={() => setPhase("preview")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                </button>

                <span className={demo.captureVerifiedBadge}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#179d1f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                  Placa verificada
                </span>

                <h2 className={demo.captureTitle}>
                  Placa {formatPlateDisplay(cleanPlate)} verificada
                </h2>

                {phase === "capture" ? (
                  <>
                    <p className={demo.captureSubtitle}>
                      Ingresa tus datos para ver tu reporte gratuito del {vehicle.marca} {vehicle.modelo} {vehicle.anio}
                    </p>

                    <div className={demo.captureField}>
                      <label className={demo.captureLabel}>Nombre *</label>
                      <input
                        type="text"
                        className={demo.captureInput}
                        placeholder="Tu nombre"
                        value={captureForm.name}
                        onChange={e => setCaptureForm(f => ({ ...f, name: e.target.value }))}
                      />
                    </div>

                    <div className={demo.captureField}>
                      <label className={demo.captureLabel}>Número de Celular *</label>
                      <div className={demo.capturePhoneRow}>
                        <span className={demo.capturePhonePrefix}>+51</span>
                        <input
                          type="tel"
                          className={demo.captureInput}
                          placeholder="987 654 321"
                          maxLength={9}
                          value={captureForm.phone}
                          onChange={e => setCaptureForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 9) }))}
                        />
                      </div>
                    </div>

                    {formError && <p className={demo.captureError}>{formError}</p>}

                    <button className={demo.captureBtn} onClick={handleSendCode} disabled={formLoading}>
                      {formLoading ? "Enviando..." : "Verificar número"}
                    </button>
                  </>
                ) : (
                  <>
                    <p className={demo.captureSubtitle}>
                      Ingresa el código de 6 dígitos que enviamos a tu WhatsApp
                    </p>

                    <div className={demo.captureField}>
                      <label className={demo.captureLabel}>Código de verificación *</label>
                      <input
                        type="text"
                        className={demo.captureInput}
                        placeholder="123456"
                        maxLength={6}
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        style={{ textAlign: "center", letterSpacing: "0.5em", fontSize: 20 }}
                      />
                    </div>

                    {formError && <p className={demo.captureError}>{formError}</p>}

                    <button className={demo.captureBtn} onClick={handleVerifyCode} disabled={formLoading}>
                      {formLoading ? "Verificando..." : "Confirmar código"}
                    </button>

                    <button className={demo.captureResend} onClick={handleResendCode} disabled={formLoading}>
                      Reenviar código
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
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
      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
        <PromotionalBanner />
        <NavBar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 20px 80px" }}>
          <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
            <div className={demo.doneIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className={demo.doneTitle}>Reporte Legal generado</h2>
            <p className={demo.doneSubtitle}>Placa {cleanPlate}</p>

            <div style={{ background: "#fff", border: "1.5px solid #e5e5e5", borderRadius: 20, padding: "40px 32px", marginBottom: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
              <Image src="/assets/icons/vista-previa-reporte-legal/documento.svg" alt="" width={56} height={56} style={{ margin: "0 auto 20px", display: "block", opacity: 0.8 }} />
              <p style={{ margin: "0 0 6px", font: "600 18px 'DM Sans', sans-serif", color: "#1c1d22" }}>
                Tu reporte está listo
              </p>
              <p style={{ margin: "0 0 20px", font: "400 14px/1.6 'Inter', sans-serif", color: "#64748b" }}>
                Descárgalo para ver el historial legal completo del vehículo: propietarios, siniestros, gravámenes, papeletas y más.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
                {[
                  { icon: "/assets/icons/vista-previa-reporte-legal/propietarios.svg", label: "Propietarios" },
                  { icon: "/assets/icons/vista-previa-reporte-legal/siniestros.svg", label: "Siniestros" },
                  { icon: "/assets/icons/vista-previa-reporte-legal/alcancia.svg", label: "Gravámenes" },
                  { icon: "/assets/icons/vista-previa-reporte-legal/Wallet.svg", label: "Deudas" },
                ].map((item) => (
                  <span key={item.label} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#f1f5f9", borderRadius: 100, font: "500 13px 'Inter', sans-serif", color: "#475569" }}>
                    <Image src={item.icon} alt="" width={16} height={16} />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <a href={pdfUrl} download={`reporte-legal-${cleanPlate}.pdf`} className={demo.doneDownload}>
              Descargar PDF
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
            </a>
            <button onClick={reset} className={demo.doneReset}>Consultar otra placa</button>
          </div>
        </div>
        <Footer />
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
