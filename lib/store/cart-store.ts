import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Tipos
export interface InspectionPlanData {
  id: number;
  type: string;
  title: string;
  price: number;
}

export interface VehicleData {
  brandId: number;
  brandName: string;
  modelId: number;
  modelName: string;
  year: number;
  plate?: string;
}

export interface CartItemData {
  id: string;
  inspectionPlanId: number;
  inspectionPlan: InspectionPlanData;
  quantity: number;
  vehicleData?: VehicleData;
}

interface CartStore {
  // Estado
  items: CartItemData[];
  isHydrated: boolean;

  // Acciones
  addItem: (item: Omit<CartItemData, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateVehicleData: (itemId: string, vehicleData: VehicleData) => void;
  clearCart: () => void;

  // Getters computados
  getItemCount: () => number;
  getTotal: () => number;

  // Sincronización
  setItems: (items: CartItemData[]) => void;
  setHydrated: (state: boolean) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isHydrated: false,

      addItem: (item) => {
        const id = crypto.randomUUID();
        set((state) => {
          // Verificar si ya existe el mismo plan (sin vehículo específico)
          const existing = state.items.find(
            (i) =>
              i.inspectionPlanId === item.inspectionPlanId &&
              !i.vehicleData &&
              !item.vehicleData
          );

          if (existing) {
            // Incrementar cantidad si existe
            return {
              items: state.items.map((i) =>
                i.id === existing.id
                  ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                  : i
              ),
            };
          }

          return { items: [...state.items, { ...item, id }] };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity < 1) {
          get().removeItem(itemId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === itemId ? { ...i, quantity } : i
          ),
        }));
      },

      updateVehicleData: (itemId, vehicleData) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === itemId ? { ...i, vehicleData } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },

      getTotal: () => {
        return get().items.reduce(
          (acc, item) => acc + item.inspectionPlan.price * item.quantity,
          0
        );
      },

      setItems: (items) => set({ items }),
      setHydrated: (state) => set({ isHydrated: state }),
    }),
    {
      name: 'verificarlo-cart',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
