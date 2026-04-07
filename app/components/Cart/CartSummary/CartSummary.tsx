"use client";

import { useCartStore } from "@/lib/store/cart-store";
import styles from "./CartSummary.module.css";

export default function CartSummary() {
  const total = useCartStore((state) => state.getTotal());
  const itemCount = useCartStore((state) => state.getItemCount());

  return (
    <div className={styles.summary}>
      <div className={styles.row}>
        <span>
          Subtotal ({itemCount} {itemCount === 1 ? "inspeccion" : "inspecciones"})
        </span>
        <span>S/ {total.toFixed(2)}</span>
      </div>
      <div className={styles.divider} />
      <div className={`${styles.row} ${styles.total}`}>
        <span>Total</span>
        <span>S/ {total.toFixed(2)}</span>
      </div>
    </div>
  );
}
