"use client";

import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import { ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
  session?: Session | null; // Sesión inicial del servidor
}

/**
 * AuthProvider optimizado:
 * - Si recibe `session`, NO muestra estado "loading" al inicio
 * - refetchOnWindowFocus: actualiza sesión al volver a la pestaña
 */
export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={true}
      refetchInterval={5 * 60} // Refrescar cada 5 minutos
    >
      {children}
    </SessionProvider>
  );
}
