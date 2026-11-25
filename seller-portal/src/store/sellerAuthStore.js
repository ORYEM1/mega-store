import { create } from "zustand";

const getStoredSeller = () => {
    try {
        return JSON.parse(sessionStorage.getItem("seller")) || null;
    } catch {
        return null;
    }
};

const getStoredToken = () => {
    return sessionStorage.getItem("seller_token") || null;
};

const useSellerAuthStore = create((set) => ({
    seller: getStoredSeller(),
    token: getStoredToken(),

    isAuthenticated: Boolean(getStoredToken()),

    setAuth: (seller, token) => {
        sessionStorage.setItem("seller", JSON.stringify(seller));
        sessionStorage.setItem("seller_token", token);

        set({
            seller,
            token,
            isAuthenticated: true,
        });
    },

    setSeller: (seller) => {
        sessionStorage.setItem("seller", JSON.stringify(seller));

        set({ seller });
    },

    logout: () => {
        sessionStorage.removeItem("seller");
        sessionStorage.removeItem("seller_token");

        set({
            seller: null,
            token: null,
            isAuthenticated: false,
        });
    },
}));

export default useSellerAuthStore;
