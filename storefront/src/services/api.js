import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://192.168.10.246:8000/api",
    

  headers: {
    Accept: "application/json",
  },
});

// Attach the latest authentication token to requests.
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle sessions that Laravel reports as expired.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const responseData = error.response?.data;
    const requestUrl = error.config?.url || "";

    const isLoginOrRegistration =
      /(login|register)(?:\?|$)/.test(requestUrl);

    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    if (
      status === 401 &&
      !isLoginOrRegistration &&
      isAuthenticated
    ) {
      // Clear the frontend authentication state.
      useAuthStore.getState().logout();

      if (responseData?.code === "SESSION_EXPIRED") {
        sessionStorage.setItem(
          "auth_message",
          "Your session expired due to inactivity. Please log in again."
        );
      }

      // Redirect only when not already on the login page.
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  }
);

// Fetch products.
export const getProducts = async (page = 1) => {
  const response = await api.get(`/products?page=${page}`);
  return response.data;
};

// Fetch a single product by ID.
export const getProduct = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

// Fetch categories.
export const getCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
};

// Register a customer.
export const registerCustomer = async (customerData) => {
  const response = await api.post("/register", customerData);
  return response.data;
};

// Log in a customer.
export const loginCustomer = async (credentials) => {
  const response = await api.post("/login", credentials);
  return response.data;
};

// Get the currently authenticated customer.
export const getAuthenticatedCustomer = async () => {
  const response = await api.get("/customer");
  return response.data;
};

// Log out a customer.
export const logoutCustomer = async () => {
  try {
    const response = await api.post("/logout");
    return response.data;
  } finally {
    // Always clear local authentication, even if the API is unavailable.
    useAuthStore.getState().logout();
  }
};

// Submit an order to Laravel.
export const createOrder = async (orderData) => {
  const response = await api.post("/orders", orderData);
  return response.data;
};


// Check the status of a mobile money payment.
export const checkPaymentStatus = async (referenceId) => {
  const response = await api.get(
    `/payments/${encodeURIComponent(referenceId)}/status`
  );

  return response.data;
};
// Fetch homepage banners.
export const getBanners = async () => {
  const response = await api.get("/banners");
  return response.data;
};

// Create a new conversation
export const createChatConversation = async (data) => {
    const response = await api.post("/chat/conversations", data);
    return response.data;
};

// Retrieve conversation history
export const getChatConversation = async (token) => {
    const response = await api.get(`/chat/conversations/${token}`);
    return response.data;
};

// Send a chat message
export const sendChatMessage = async (token, body) => {
    const response = await api.post(
        `/chat/conversations/${token}/messages`,
        { body }
    );

    return response.data;
};

export default api;