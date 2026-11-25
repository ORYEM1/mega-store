import { create } from "zustand";

function getSavedSeller() {
  try {
    const seller = sessionStorage.getItem("seller");
    return seller ? JSON.parse(seller) : null;
  } catch {
    return null;
  }
}

function getSavedToken() {
  return sessionStorage.getItem("seller_token");
}

export const useSellerAuthStore = create((set) => ({
  seller: getSavedSeller(),
  token: getSavedToken(),
  isAuthenticated: Boolean(getSavedToken()),

  setAuth: ({ seller, token }) => {
    sessionStorage.setItem("seller_token", token);
    sessionStorage.setItem("seller", JSON.stringify(seller));

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
    sessionStorage.removeItem("seller_token");
    sessionStorage.removeItem("seller");

    set({
      seller: null,
      token: null,
      isAuthenticated: false,
    });
  },
}));
