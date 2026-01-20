"use client";

import { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { ToastProvider } from "@/app/components/Toast";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
