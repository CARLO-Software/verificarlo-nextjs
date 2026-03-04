//Es el punto de conexión con la base de datos

// lib/db.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // Evita múltiples instancias en dev (hot reload)
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const db =
  global.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}
