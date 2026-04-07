"use client";

import { ReactNode } from "react";
import { useCartSync } from "@/app/hooks/useCartSync";

interface CartSyncProviderProps {
  children: ReactNode;
}

function CartSyncHandler() {
  useCartSync();
  return null;
}

export function CartSyncProvider({ children }: CartSyncProviderProps) {
  return (
    <>
      <CartSyncHandler />
      {children}
    </>
  );
}
