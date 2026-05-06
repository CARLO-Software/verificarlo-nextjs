//TODO: Subirlo a la base de datos y eliminar este archivo
import { INSPECTION_PLAN } from "@/constants/inspection"

export const inspectionPlans = [
    { id: 1, type: INSPECTION_PLAN.legal, title: "Inspección Legal Express", description: "Cumple requisitos normativos", landingDescription: "Verificamos antecedentes en SUNARP, SUTRAN y SAT. Detectamos gravámenes, multas e historial de propietarios.", price: 49, classType: "first" },
    { id: 2, type: INSPECTION_PLAN.basica, title: "Inspección Básica", description: "Revisión general del vehículo", landingDescription: "Revisión mecánica de 200+ puntos + escaneo profesional + verificación legal completa. Inspección a domicilio.", price: 249, classType: "middle" },
    { id: 3, type: INSPECTION_PLAN.completa, title: "Inspección Premium", description: "Revisión técnica y legal", landingDescription: "Todo lo de la básica + videoscopía del motor + asesoría en presupuesto de reparación + informe técnico documentado.", price: 299, classType: "last" },
]

export const inspectionPlanItems = [
    { inspectionPlanId: 1, label: [
        "Consulta SUNARP: gravámenes, embargos y cargas",
        "Consulta SUTRAN: papeletas y sanciones pendientes",
        "Consulta SAT: robo, siniestros y accidentes reportados",
        "Historial de propietarios y transferencias",
        "Boleta informativa con resultados"
    ] },
    { inspectionPlanId: 2, label: [
        "Verificación legal completa (SUNARP, SUTRAN y SAT)",
        "Motor: compresión, fugas de aceite, ruidos anormales",
        "Escáner OBD2: códigos de falla en motor, transmisión, airbags, ABS",
        "Frenos: pastillas, discos, líquido y ABS",
        "Suspensión: amortiguadores, rótulas y terminales",
        "Escaneo de pintura: detección de repintado y choques",
        "Diagnóstico verbal con recomendaciones"
    ] },
    { inspectionPlanId: 3, label: [
        "Todo lo de la inspección básica",
        "Videoscopía interna del motor (cilindros y válvulas)",
        "Inspección de zonas críticas ocultas",
        "Estimación de costos de reparación",
        "Informe técnico-legal documentado con fotos",
        "Asesoría personalizada pre-compra"
    ] }
]