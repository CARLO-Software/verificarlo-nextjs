"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore, CartItemData } from "@/lib/store/cart-store";

interface ApiCartItem {
  id: string;
  inspectionPlanId: number;
  inspectionPlan: {
    id: number;
    type: string;
    title: string;
    price: number;
  };
  quantity: number;
  tempVehicleData?: {
    brandId: number;
    brandName: string;
    modelId: number;
    modelName: string;
    year: number;
    plate?: string;
  };
}

export function useCartSync() {
  const { data: session, status } = useSession();
  const items = useCartStore((state) => state.items);
  const setItems = useCartStore((state) => state.setItems);
  const isHydrated = useCartStore((state) => state.isHydrated);
  const hasSynced = useRef(false);

  useEffect(() => {
    // Solo sincronizar una vez cuando el usuario se loguea
    if (
      status === "authenticated" &&
      session?.user?.id &&
      isHydrated &&
      !hasSynced.current
    ) {
      hasSynced.current = true;

      const syncCart = async () => {
        try {
          // Si hay items en localStorage, sincronizar con BD
          if (items.length > 0) {
            const res = await fetch("/api/cart/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ localItems: items }),
            });

            if (res.ok) {
              const data = await res.json();
              // Actualizar store con items mergeados
              const mappedItems: CartItemData[] = data.items.map((item: ApiCartItem) => ({
                id: item.id,
                inspectionPlanId: item.inspectionPlanId,
                inspectionPlan: {
                  id: item.inspectionPlan.id,
                  type: item.inspectionPlan.type,
                  title: item.inspectionPlan.title,
                  price: item.inspectionPlan.price,
                },
                quantity: item.quantity,
                vehicleData: item.tempVehicleData,
              }));
              setItems(mappedItems);
            }
          } else {
            // Si localStorage vacío, cargar desde BD
            const res = await fetch("/api/cart");
            if (res.ok) {
              const data = await res.json();
              if (data.items && data.items.length > 0) {
                const mappedItems: CartItemData[] = data.items.map((item: ApiCartItem) => ({
                  id: item.id,
                  inspectionPlanId: item.inspectionPlanId,
                  inspectionPlan: {
                    id: item.inspectionPlan.id,
                    type: item.inspectionPlan.type,
                    title: item.inspectionPlan.title,
                    price: item.inspectionPlan.price,
                  },
                  quantity: item.quantity,
                  vehicleData: item.tempVehicleData,
                }));
                setItems(mappedItems);
              }
            }
          }
        } catch (error) {
          console.error("Error sincronizando carrito:", error);
        }
      };

      syncCart();
    }

    // Reset sync flag cuando el usuario cierra sesión
    if (status === "unauthenticated") {
      hasSynced.current = false;
    }
  }, [status, session, isHydrated, items, setItems]);
}
