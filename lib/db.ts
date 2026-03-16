//Es el punto de conexión con la base de datos

// lib/db.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // Evita múltiples instancias en dev (hot reload)
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ["error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

export const db = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}

// Manejo de desconexión graceful
process.on("beforeExit", async () => {
  await db.$disconnect();
});
