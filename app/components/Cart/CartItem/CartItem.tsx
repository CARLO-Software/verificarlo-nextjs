"use client";

import { Trash2, Minus, Plus } from "lucide-react";
import { useCartStore, CartItemData } from "@/lib/store/cart-store";
import styles from "./CartItem.module.css";

interface CartItemProps {
  item: CartItemData;
}

export default function CartItem({ item }: CartItemProps) {
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const subtotal = item.inspectionPlan.price * item.quantity;

  // Mapear tipo a un label mas amigable
  const getPlanTypeLabel = (type: string) => {
    switch (type) {
      case "legal":
        return "Legal";
      case "basica":
        return "Basica";
      case "completa":
        return "Completa";
      default:
        return type;
    }
  };

  return (
    <div className={styles.cartItem}>
      <div className={styles.info}>
        <div className={styles.header}>
          <span className={styles.badge}>{getPlanTypeLabel(item.inspectionPlan.type)}</span>
          <button
            className={styles.removeBtn}
            onClick={() => removeItem(item.id)}
            aria-label="Eliminar del carrito"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <h4 className={styles.title}>{item.inspectionPlan.title}</h4>
        {item.vehicleData && (
          <p className={styles.vehicle}>
            {item.vehicleData.brandName} {item.vehicleData.modelName}{" "}
            {item.vehicleData.year}
            {item.vehicleData.plate && ` - ${item.vehicleData.plate}`}
          </p>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.quantity}>
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            aria-label="Reducir cantidad"
          >
            <Minus size={14} />
          </button>
          <span>{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            aria-label="Aumentar cantidad"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className={styles.pricing}>
          <p className={styles.unitPrice}>S/ {item.inspectionPlan.price} c/u</p>
          <p className={styles.subtotal}>S/ {subtotal}</p>
        </div>
      </div>
    </div>
  );
}
