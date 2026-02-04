export const INSPECTION_PLAN = {
    legal: "legal",
    basica: "basica",
    completa: "completa",
} as const

export type InspectionPlanType = typeof INSPECTION_PLAN[keyof typeof INSPECTION_PLAN] 