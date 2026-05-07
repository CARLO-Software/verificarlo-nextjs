//TODO: Subirlo a la base de datos y eliminar este archivo
import { INSPECTION_PLAN } from "@/constants/inspection"

export const inspectionPlans = [
    { id: 1, type: INSPECTION_PLAN.legal, title: "Inspección Legal Express", description: "Cumple requisitos normativos", landingDescription: "Verificamos antecedentes en SUNARP, SUTRAN y SAT. Detectamos gravámenes, multas e historial de propietarios.", price: 49, classType: "first" },
    { id: 2, type: INSPECTION_PLAN.basica, title: "Inspección Básica", description: "Revisión general del vehículo", landingDescription: "Revisión mecánica de 200+ puntos + escaneo profesional + verificación legal completa. Inspección a domicilio.", price: 249, classType: "middle" },
    { id: 3, type: INSPECTION_PLAN.completa, title: "Inspección Premium", description: "Revisión técnica y legal", landingDescription: "Todo lo de la básica + videoscopía del motor + asesoría en presupuesto de reparación + informe técnico documentado.", price: 299, classType: "last" },
]

export const inspectionPlanItems = [
    { inspectionPlanId: 1, label: [
        "Consulta SUNARP (gravámenes y embargos)",
        "Consulta SAT y SUTRAN (papeletas)",
        "Consulta SBS (robos y siniestros)",
        "Historial de propietarios"
    ] },
    { inspectionPlanId: 2, label: [
        "Revisión mecánica de 100 puntos + inspección legal",
        "Motor: compresión, fugas y ruidos",
        "Escáner OBD2 (motor, caja, airbags, ABS)",
        "Frenos y suspensión",
        "Escaneo de pintura (choques ocultos)",
        "Diagnóstico visualizable en el APP de Verificarlo al instante"
    ] },
    { inspectionPlanId: 3, label: [
        "Todo lo de la básica",
        "Videoscopía del motor",
        "Inspección de zonas ocultas",
        "Estimación de costos de reparación",
        "Visualización al instante por el app de Verificarlo"
    ] }
]