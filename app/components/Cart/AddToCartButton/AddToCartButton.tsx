"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCartStore, InspectionPlanData } from "@/lib/store/cart-store";
import styles from "./AddToCartButton.module.css";

interface AddToCartButtonProps {
  inspectionPlan: InspectionPlanData;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}

export default function AddToCartButton({
  inspectionPlan,
  variant = "primary",
  className,
}: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      inspectionPlanId: inspectionPlan.id,
      inspectionPlan,
      quantity: 1,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const buttonClasses = `
    ${styles.button}
    ${styles[variant]}
    ${added ? styles.added : ""}
    ${className || ""}
  `.trim();

  return (
    <button
      className={buttonClasses}
      onClick={handleAddToCart}
      disabled={added}
      aria-label={added ? "Agregado al carrito" : "Agregar al carrito"}
    >
      {added ? (
        <>
          <Check size={18} />
          <span>Agregado</span>
        </>
      ) : (
        <>
          <ShoppingCart size={18} />
          <span>Agregar al carrito</span>
        </>
      )}
    </button>
  );
}
