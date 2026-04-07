"use client";

import { useState, useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import CartDrawer from "../CartDrawer/CartDrawer";
import styles from "./CartIcon.module.css";

export default function CartIcon() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((state) => state.getItemCount());
  const isHydrated = useCartStore((state) => state.isHydrated);

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const showBadge = mounted && isHydrated && itemCount > 0;

  return (
    <>
      <button
        className={styles.cartButton}
        onClick={() => setIsDrawerOpen(true)}
        aria-label={`Carrito de compras${showBadge ? `, ${itemCount} items` : ""}`}
      >
        <ShoppingCart size={22} strokeWidth={2} />
        {showBadge && (
          <span className={styles.badge}>
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </button>

      <CartDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
