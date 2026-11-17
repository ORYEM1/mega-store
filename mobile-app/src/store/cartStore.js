import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],

            addToCart: (product, size = null) => {
                const productId = product.id || product.product_id;

                const existing = get().items.find(
                    (item) =>
                        String(item.productId) === String(productId) &&
                        String(item.size || "") === String(size || "")
                );

                if (existing) {
                    set({
                        items: get().items.map((item) =>
                            item === existing
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        ),
                    });
                } else {
                    set({
                        items: [
                            ...get().items,
                            {
                                productId,
                                product,
                                size,
                                quantity: 1,
                            },
                        ],
                    });
                }
            },

            removeFromCart: (productId, size = null) => {
                set({
                    items: get().items.filter(
                        (item) =>
                            !(
                                String(item.productId) === String(productId) &&
                                String(item.size || "") === String(size || "")
                            )
                    ),
                });
            },

            updateQuantity: (productId, size, quantity) => {
                if (quantity < 1) {
                    get().removeFromCart(productId, size);
                    return;
                }

                set({
                    items: get().items.map((item) =>
                        String(item.productId) === String(productId) &&
                        String(item.size || "") === String(size || "")
                            ? { ...item, quantity }
                            : item
                    ),
                });
            },

            clearCart: () => set({ items: [] }),

            getItemCount: () =>
                get().items.reduce((total, item) => total + item.quantity, 0),

            getTotal: () =>
                get().items.reduce(
                    (total, item) =>
                        total +
                        Number(item.product.price || 0) * item.quantity,
                    0
                ),
        }),
        {
            name: "adrian-mobile-cart",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
