//TODO: Subirlo a la base de datos y eliminar este archivo
import { INSPECTION_PLAN } from "@/constants/inspection"

export const inspectionPlans = [
    { id: 1, type: INSPECTION_PLAN.legal, title: "Inspección Legal Express", description: "Cumple requisitos normativos", landingDescription: "Ideal si ya revisaste la mecánica y solo necesitas conocer su historial", price: 49, classType: "first" },
    { id: 2, type: INSPECTION_PLAN.basica, title: "Inspección Completa 360°", description: "Revisión general del vehículo", landingDescription: "Verifica lo esencial antes de firmar. Mecánica, estética y legal", price: 249, classType: "middle" },
    { id: 3, type: INSPECTION_PLAN.completa, title: "Inspección Premium Plus", description: "Revisión técnica y legal", landingDescription: "La verificación más completa y detallada del mercado que incluye videoscopia y asesoría.", price: 299, classType: "last" },
]

export const inspectionPlanItems = [
    { inspectionPlanId: 1, label: ["Siniestros reportados", "Revisión de Gravámenes y Papeletas", "Historial de propietarios", "Boleta informativa"] },
    { inspectionPlanId: 2, label: ["Todo sobre revisión legal", "Revisión mecánica (200+ puntos de verificación)", "Escáner profesional (motor, caja, airbags, ABS, módulos)", "Escaneo de pintura y carrocería (choques)", "Aprobación o desaprobación verbal"] },
    { inspectionPlanId: 3, label: ["Toda la inspección básica", "Videoscopia completa del motor y zonas críticas", "Asesoría en presupuesto de reparación", "Informe técnica y legal documentado"] }
]