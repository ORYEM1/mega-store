import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

export const useAuthStore = create(
    persist(
        (set, get) => ({
            customer: null,
            token: null,
            isAuthenticated: false,

            register: async (customerData) => {
                const response = await api.post("/register", customerData);

                const { customer, token } = response.data;

                set({
                    customer,
                    token,
                    isAuthenticated: true,
                });

                return response.data;
            },

            login: async (login, password) => {
                const response = await api.post("/login", {
                    login,
                    password,
                });

                const { customer, token } = response.data;

                set({
                    customer,
                    token,
                    isAuthenticated: true,
                });

                return response.data;
            },

            fetchCustomer: async () => {
                if (!get().token) {
                    return null;
                }

                const response = await api.get("/customer");

                set({
                    customer: response.data.customer,
                    isAuthenticated: true,
                });

                return response.data.customer;
            },

            logout: async () => {
                try {
                    if (get().token) {
                        await api.post("/logout");
                    }
                } finally {
                    set({
                        customer: null,
                        token: null,
                        isAuthenticated: false,
                    });
                }
            },

            updateCustomer: (customer) => {
                set({ customer });
            },
        }),
        {
            name: "adrian-auth-storage",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
