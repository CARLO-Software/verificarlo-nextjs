"use client";

import { useState, useEffect, useRef } from "react";

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

function extractVehicle(consultar: any) {
  const titulos = consultar?.sunarp?.siguelo?.titulos || consultar?.siguelo?.titulos || [];
  const t = titulos.find((t: any) => t.marca) || {};
  return {
    marca: t.marca || "",
    modelo: t.modelo || "",
    anio: t.anio_fabricacion || t.anio_modelo || "",
    color: t.color || "",
    combustible: t.combustible || "",
  };
}

function buildSections(consultar: any) {
  const sections: { title: string; rows: { label: string; value: string }[] }[] = [];
  const titulos = consultar?.sunarp?.siguelo?.titulos || consultar?.siguelo?.titulos || [];
  const t = titulos.find((v: any) => v.marca) || {};

  if (t.marca) {
    const rows: { label: string; value: string }[] = [];
    if (t.marca) rows.push({ label: "Marca", value: t.marca });
    if (t.modelo) rows.push({ label: "Modelo", value: t.modelo });
    if (t.anio_fabricacion) rows.push({ label: "Año", value: t.anio_fabricacion });
    if (t.color) rows.push({ label: "Color", value: t.color });
    if (t.combustible) rows.push({ label: "Combustible", value: t.combustible });
    if (t.nro_motor) rows.push({ label: "N.º Motor", value: t.nro_motor });
    if (t.nro_serie) rows.push({ label: "N.º Serie", value: t.nro_serie });
    sections.push({ title: "Características del vehículo (SUNARP)", rows });
  }

  const owners = titulos.filter((o: any) => o.nombre && o.acto_registral);
  if (owners.length > 0) {
    sections.push({
      title: "Historial de propietarios",
      rows: owners.map((o: any, i: number) => ({
        label: `Propietario ${i + 1}`,
        value: `${(o.nombre || "").split("|")[0].trim()} — ${o.acto_registral || ""} (${o.fecha_asiento || ""})`,
      })),
    });
  }

  const citv = consultar?.citv;
  if (citv) {
    sections.push({
      title: "Revisión técnica (CITV)",
      rows: [
        { label: "Fecha vencimiento", value: citv.fecha_vcto || "—" },
        { label: "Resultado", value: citv.resultado || "—" },
        ...(citv.planta ? [{ label: "Planta", value: citv.planta }] : []),
      ],
    });
  }

  const soat = consultar?.sbs_soat;
  if (soat) {
    sections.push({
      title: "SOAT",
      rows: [
        { label: "Empresa", value: soat.empresa || "—" },
        { label: "Vencimiento", value: soat.vencimiento || soat.seguros?.[0]?.fecha_vcto || "—" },
        { label: "N.º Certificado", value: soat.seguros?.[0]?.nro_certificado || "—" },
      ],
    });
  }

  const gar = consultar?.sunarp_garantias;
  if (gar) {
    sections.push({
      title: "Gravámenes SUNARP",
      rows: [{ label: "Estado", value: gar.sin_resultados ? "Sin gravámenes" : (gar.nota || "Con gravámenes") }],
    });
  }

  const sat = consultar?.sat_papeletas;
  if (sat) {
    sections.push({
      title: "Papeletas SAT Lima",
      rows: [{ label: "Estado", value: sat.sin_papeletas ? "Sin papeletas" : "Presenta papeletas pendientes" }],
    });
  }

  const satCap = consultar?.sat_captura;
  if (satCap) {
    sections.push({
      title: "Orden de Captura SAT",
      rows: [{ label: "Estado", value: (satCap.sin_captura || satCap.sin_resultados) ? "Sin orden de captura" : "Presenta orden de captura" }],
    });
  }

  return sections;
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
      .then(res => { if (!res.ok) throw new Error("Error"); return res.json(); })
      .then(data => {
        setPreviewData(data);
        setProgress(100);
        setTimeout(() => setPhase("preview"), 400);
      })
      .catch(() => {
        setError("No se pudo consultar la placa. Verifica e intenta de nuevo.");
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

  const genProgress = Math.min(Math.round(((genStep + 1) / REPORT_SOURCES.length) * 95), 95);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d", color: "#e5e7eb", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 18 }}>
            <span style={{ color: "#fff" }}>VERIFI</span>
            <span style={{ color: "#BFFF00" }}>CARLO</span>
          </span>
          <span style={{ background: "#7C3AED", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>DEMO</span>
        </div>
        <button onClick={reset} style={{ background: "none", border: "1px solid #374151", color: "#9ca3af", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
          Nueva consulta
        </button>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px" }}>
        {/* LOADING */}
        {phase === "loading" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: "#BFFF00", marginBottom: 8 }}>{progress}%</div>
            <p style={{ color: "#9ca3af", marginBottom: 24 }}>Consultando fuentes para <b style={{ color: "#fff" }}>{cleanPlate}</b>...</p>
            <div style={{ background: "#1f2937", borderRadius: 8, height: 6, overflow: "hidden", marginBottom: 24 }}>
              <div style={{ background: "#BFFF00", height: "100%", width: `${progress}%`, transition: "width 0.3s" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, color: i <= step ? "#BFFF00" : "#6b7280", fontSize: 14 }}>
                  {i < step ? "✓" : i === step ? "●" : "○"} {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PREVIEW */}
        {phase === "preview" && previewData && (() => {
          const vehicle = extractVehicle(previewData.consultar);
          const sections = buildSections(previewData.consultar);
          return (
            <div>
              <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 24, marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#BFFF00", letterSpacing: 1, marginBottom: 4 }}>VEHÍCULO ENCONTRADO</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>
                  {cleanPlate} — {vehicle.marca} {vehicle.modelo} {vehicle.anio}
                </h2>
                <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>
                  {[vehicle.color, vehicle.combustible].filter(Boolean).join(" · ")}
                </p>
              </div>

              {sections.map((sec, si) => (
                <div key={si} style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 20, marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#BFFF00", margin: "0 0 12px", letterSpacing: 0.5 }}>{sec.title}</h3>
                  {sec.rows.map((r, ri) => (
                    <div key={ri} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: ri < sec.rows.length - 1 ? "1px solid #1f2937" : "none" }}>
                      <span style={{ color: "#9ca3af", fontSize: 13 }}>{r.label}</span>
                      <span style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              ))}

              <button
                onClick={handleGenerarPdf}
                style={{ width: "100%", padding: "16px 0", borderRadius: 12, border: "none", background: "#BFFF00", color: "#111", fontWeight: 800, fontSize: 16, cursor: "pointer", marginTop: 16 }}
              >
                Generar PDF Legal Completo
              </button>
            </div>
          );
        })()}

        {/* GENERATING PDF */}
        {phase === "generating" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: "#BFFF00", marginBottom: 8 }}>{genProgress}%</div>
            <p style={{ color: "#9ca3af", marginBottom: 4 }}>Generando PDF para <b style={{ color: "#fff" }}>{cleanPlate}</b>...</p>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>Esto toma entre 1 y 4 minutos.</p>
            <div style={{ background: "#1f2937", borderRadius: 8, height: 6, overflow: "hidden", marginBottom: 24 }}>
              <div style={{ background: "#BFFF00", height: "100%", width: `${genProgress}%`, transition: "width 0.3s" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", maxHeight: 300, overflowY: "auto" }}>
              {REPORT_SOURCES.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, color: i <= genStep ? "#BFFF00" : "#6b7280", fontSize: 13 }}>
                  {i < genStep ? "✓" : i === genStep ? "●" : "○"} {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DONE */}
        {phase === "done" && pdfUrl && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8 }}>PDF generado correctamente</h2>
            <p style={{ color: "#9ca3af", marginBottom: 24 }}>Reporte legal para la placa {cleanPlate}</p>
            <iframe src={pdfUrl} style={{ width: "100%", height: 500, borderRadius: 12, border: "1px solid #1f2937", marginBottom: 16 }} title="PDF Preview" />
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <a
                href={pdfUrl}
                download={`reporte-legal-${cleanPlate}.pdf`}
                style={{ padding: "14px 28px", borderRadius: 12, background: "#BFFF00", color: "#111", fontWeight: 700, fontSize: 15, textDecoration: "none" }}
              >
                Descargar PDF
              </a>
              <button
                onClick={reset}
                style={{ padding: "14px 28px", borderRadius: 12, border: "1px solid #374151", background: "none", color: "#9ca3af", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
              >
                Consultar otra placa
              </button>
            </div>
          </div>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✕</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>Error</h2>
            <p style={{ color: "#9ca3af", marginBottom: 24 }}>{error}</p>
            <button
              onClick={reset}
              style={{ padding: "14px 28px", borderRadius: 12, border: "none", background: "#BFFF00", color: "#111", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
