// lib/db.ts - Singleton PrismaClient with connection pool optimization

import { PrismaClient } from "@prisma/client";

// Extend global type to store prisma instance
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

// Singleton pattern using globalThis to survive hot reloads in development
export const db: PrismaClient = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}

// Also export as 'prisma' for compatibility
export const prisma = db;
