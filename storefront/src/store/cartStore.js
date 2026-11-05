import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      // Add a product or increase its quantity if it already exists.
      addItem: (product, quantity = 1) => {
        const amount = Math.max(1, Number(quantity) || 1);
        const productId = product.id;

        set((state) => {
          const existingItem = state.items.find(
            (item) => item.id === productId
          );

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === productId
                  ? {
                      ...item,
                      quantity: item.quantity + amount,
                    }
                  : item
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...product,
                quantity: amount,
              },
            ],
          };
        });
      },

      // Set a product's quantity.
      updateQuantity: (productId, quantity) => {
        const amount = Number(quantity);

        if (!Number.isFinite(amount) || amount <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId
              ? { ...item, quantity: amount }
              : item
          ),
        }));
      },

      // Remove a product completely.
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => item.id !== productId
          ),
        }));
      },

      // Empty the cart.
      clearCart: () => set({ items: [] }),

      // Total units across all products.
      getTotalQuantity: () =>
        get().items.reduce(
          (total, item) => total + (Number(item.quantity) || 0),
          0
        ),

      // Total price of all cart items.
      getTotalPrice: () =>
        get().items.reduce(
          (total, item) =>
            total +
            (Number(item.price) || 0) *
              (Number(item.quantity) || 0),
          0
        ),
    }),
    {
      name: "adrian-cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);