import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Generate a unique identity for each product and size combination.
function getCartKey(item) {
  const productId = item.id;
  const selectedSize = item.selected_size || "";

  return `${productId}::${selectedSize}`;
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      // Add a product or increase its quantity if it already exists.
      addItem: (product, quantity = 1) => {
        const amount = Math.max(
          1,
          Math.floor(Number(quantity) || 1)
        );

        const cartKey = getCartKey(product);

        set((state) => {
          const existingItem = state.items.find(
            (item) => getCartKey(item) === cartKey
          );

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                getCartKey(item) === cartKey
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
                cart_key: cartKey,
                quantity: amount,
              },
            ],
          };
        });
      },

      // Set the quantity of a specific cart item.
      // Accepts cart_key or the old product ID.
      updateQuantity: (itemKey, quantity) => {
        const amount = Math.floor(Number(quantity));

        if (!Number.isFinite(amount) || amount <= 0) {
          get().removeItem(itemKey);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            const matches =
              item.cart_key === itemKey ||
              getCartKey(item) === itemKey ||
              String(item.id) === String(itemKey);

            return matches
              ? { ...item, quantity: amount }
              : item;
          }),
        }));
      },

      // Remove a specific cart item.
      // Accepts cart_key or the old product ID.
      removeItem: (itemKey) => {
        set((state) => ({
          items: state.items.filter((item) => {
            const matches =
              item.cart_key === itemKey ||
              getCartKey(item) === itemKey ||
              String(item.id) === String(itemKey);

            return !matches;
          }),
        }));
      },

      // Empty the cart.
      clearCart: () => set({ items: [] }),

      // Total units across all products and sizes.
      getTotalQuantity: () =>
        get().items.reduce(
          (total, item) =>
            total + (Number(item.quantity) || 0),
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

      // Restore cart keys for previously saved cart items.
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        items: (persistedState?.items || []).map((item) => ({
          ...item,
          cart_key: getCartKey(item),
        })),
      }),
    }
  )
);