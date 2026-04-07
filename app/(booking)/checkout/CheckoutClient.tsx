"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Trash2, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import styles from "./Checkout.module.css";

interface Brand {
  id: number;
  name: string;
}

interface InspectionPlan {
  id: number;
  type: string;
  title: string;
  price: number;
}

interface CheckoutClientProps {
  brands: Brand[];
  inspectionPlans: InspectionPlan[];
  userEmail: string;
  userName: string;
}

export default function CheckoutClient({
  brands,
  inspectionPlans,
  userEmail,
  userName,
}: CheckoutClientProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotal = useCartStore((state) => state.getTotal);
  const getItemCount = useCartStore((state) => state.getItemCount);
  const isHydrated = useCartStore((state) => state.isHydrated);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sincronizar carrito con BD cuando el componente se monta
  useEffect(() => {
    if (isHydrated && items.length > 0) {
      // Sincronizar con la BD
      fetch("/api/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localItems: items }),
      }).catch(console.error);
    }
  }, [isHydrated, items]);

  const handleProceedToPayment = () => {
    // Por ahora redirigir a agendar con el primer plan
    // En el futuro, esto deberia abrir un modal de pago o ir a una pagina de pago
    if (items.length > 0) {
      router.push("/agendar");
    }
  };

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

  if (!mounted || !isHydrated) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando carrito...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <ShoppingBag size={64} strokeWidth={1} />
          <h2>Tu carrito esta vacio</h2>
          <p>Agrega inspecciones para continuar</p>
          <Link href="/#planes" className={styles.backToPlans}>
            Ver planes de inspeccion
          </Link>
        </div>
      </div>
    );
  }

  const total = getTotal();
  const itemCount = getItemCount();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Volver</span>
        </Link>
        <h1 className={styles.title}>Checkout</h1>
      </div>

      <div className={styles.content}>
        {/* Columna izquierda - Items del carrito */}
        <div className={styles.cartSection}>
          <div className={styles.sectionHeader}>
            <h2>Tu carrito ({itemCount} {itemCount === 1 ? "item" : "items"})</h2>
            <button onClick={clearCart} className={styles.clearButton}>
              Vaciar carrito
            </button>
          </div>

          <div className={styles.itemsList}>
            {items.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemBadge}>
                    {getPlanTypeLabel(item.inspectionPlan.type)}
                  </span>
                  <h3 className={styles.itemTitle}>{item.inspectionPlan.title}</h3>
                  <p className={styles.itemPrice}>S/ {item.inspectionPlan.price} c/u</p>
                </div>

                <div className={styles.itemControls}>
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

                  <p className={styles.itemSubtotal}>
                    S/ {item.inspectionPlan.price * item.quantity}
                  </p>

                  <button
                    onClick={() => removeItem(item.id)}
                    className={styles.removeButton}
                    aria-label="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha - Resumen y pago */}
        <div className={styles.summarySection}>
          <div className={styles.summaryCard}>
            <h2>Resumen del pedido</h2>

            <div className={styles.summaryDetails}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>S/ {total.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Descuento</span>
                <span>S/ 0.00</span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>Total</span>
                <span>S/ {total.toFixed(2)}</span>
              </div>
            </div>

            <div className={styles.userInfo}>
              <p><strong>Cliente:</strong> {userName}</p>
              <p><strong>Email:</strong> {userEmail}</p>
            </div>

            <button
              onClick={handleProceedToPayment}
              className={styles.payButton}
            >
              Continuar con el pago
            </button>

            <p className={styles.secureNote}>
              Pago seguro procesado por Culqi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
