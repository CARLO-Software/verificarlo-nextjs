export const INSPECTION = {
    legal: "legal",
    basica: "basica",
    completa: "completa",
} as const

export type Inspection = typeof INSPECTION[keyof typeof INSPECTION] 