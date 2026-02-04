import { INSPECTION_PLAN } from "@/constants/inspection"

export const inspectionPlans = [
    { id: 1, type: INSPECTION_PLAN.legal, title: "Inspección Legal", description: "Cumple requisitos normativos", landingDescription: "Ideal para quienes saben de mecánica y quieren complementar con la verificación legal.", price: 49, classType: "first" },
    { id: 2, type: INSPECTION_PLAN.basica, title: "Inspección Básica", description: "Revisión general del vehículo", landingDescription: "Revisamos los puntos clave en la mecánica, estética y legal del carro que quieres comprar.", price: 249, classType: "middle" },
    { id: 3, type: INSPECTION_PLAN.completa, title: "Inspección Completa", description: "Revisión técnica y legal", landingDescription: "Para quienes buscan verificar hasta el alma del carro. Incluye soporte en el trámite notarial.", price: 299, classType: "last" },
]

export const inspectionPlanItems = [
    { inspectionPlanId: 1, label: ["Siniestros reportados", "Revisión de Gravámenes y Papeletas", "Historial de propietarios", "Boleta informativa"] },
    { inspectionPlanId: 2, label: ["Todo sobre revisión legal", "Revisión mecánica (200+ puntos de verificación)", "Escáner profesional (motor, caja, airbags, ABS, módulos)", "Escaneo de pintura y carrocería (choques)", "Aprobación o desaprobación verbal"] },
    { inspectionPlanId: 3, label: ["Toda la inspección básica", "Videoscopia completa del motor y zonas críticas", "Asesoría en presupuesto de reparación", "Informe técnica y legal documentado"] }
]