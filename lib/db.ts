//Es el punto de conexión con la base de datos

// lib/db.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // Evita múltiples instancias en dev (hot reload)
  var prisma: PrismaClient | undefined;
}

export const db =
  global.prisma ||
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}
