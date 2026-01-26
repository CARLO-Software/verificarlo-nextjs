"use client";

import { ReactNode } from "react";
import { Session } from "next-auth";
import { AuthProvider } from "./AuthProvider";
import { ToastProvider } from "@/app/components/Toast";

interface ProvidersProps {
  children: ReactNode;
  session?: Session | null; // Recibe la sesión del servidor
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <AuthProvider session={session}>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
