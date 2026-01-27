export const ROLES = {
    USER: "USER",
    ADMIN: "ADMIN",
    SUPERADMIN: "SUPERADMIN",
} as const

export type Role = typeof ROLES[keyof typeof ROLES] 