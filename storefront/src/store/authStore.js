import { create } from "zustand";

function getSavedCustomer() {
  try {
    const customer = sessionStorage.getItem("customer");
    return customer ? JSON.parse(customer) : null;
  } catch {
    return null;
  }
}

function getSavedToken() {
  return sessionStorage.getItem("customer_token");
}

export const useAuthStore = create((set) => ({
  customer: getSavedCustomer(),
  token: getSavedToken(),
  isAuthenticated: Boolean(getSavedToken()),

  setAuth: ({ customer, token }) => {
    sessionStorage.setItem("customer_token", token);
    sessionStorage.setItem("customer", JSON.stringify(customer));

    set({
      customer,
      token,
      isAuthenticated: true,
    });
  },

  setCustomer: (customer) => {
    sessionStorage.setItem("customer", JSON.stringify(customer));
    set({ customer });
  },

  logout: () => {
    sessionStorage.removeItem("customer_token");
    sessionStorage.removeItem("customer");

    set({
      customer: null,
      token: null,
      isAuthenticated: false,
    });
  },
}));