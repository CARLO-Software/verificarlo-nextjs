"use client";

import { useEffect, useRef } from "react";
import { X, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart-store";
import CartItemComponent from "../CartItem/CartItem";
import CartSummary from "../CartSummary/CartSummary";
import styles from "./CartDrawer.module.css";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  const handleContinueShopping = () => {
    onClose();
    // Navegar a la seccion de planes
    const planesSection = document.getElementById("planes");
    if (planesSection) {
      planesSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className={styles.overlay} onClick={onClose} />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
      >
        <div className={styles.header}>
          <h2 className={styles.title}>
            <ShoppingBag size={24} />
            Tu Carrito
          </h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        <div className={styles.content}>
          {items.length === 0 ? (
            <div className={styles.emptyState}>
              <ShoppingBag size={64} strokeWidth={1} />
              <p>Tu carrito esta vacio</p>
              <button
                onClick={handleContinueShopping}
                className={styles.continueShopping}
              >
                Ver planes de inspeccion
              </button>
            </div>
          ) : (
            <>
              <div className={styles.itemsList}>
                {items.map((item) => (
                  <CartItemComponent key={item.id} item={item} />
                ))}
              </div>

              <CartSummary />

              <div className={styles.actions}>
                <button
                  className={styles.checkoutBtn}
                  onClick={handleCheckout}
                >
                  Proceder al pago
                </button>
                <button className={styles.clearBtn} onClick={clearCart}>
                  Vaciar carrito
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
