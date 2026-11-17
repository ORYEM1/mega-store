
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

// Handle expired authentication sessions.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const responseData = error.response?.data;
    const requestUrl = error.config?.url || "";

    const isLoginOrRegistration =
      /(?:login|register)(?:\?.*)?$/.test(requestUrl);

    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    if (
      status === 401 &&
      !isLoginOrRegistration &&
      isAuthenticated
    ) {
      useAuthStore.getState().logout();

      if (responseData?.code === "SESSION_EXPIRED") {
        sessionStorage.setItem(
          "auth_message",
          "Your session expired due to inactivity. Please log in again."
        );
      }

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

// Fetch a single product.
export const getProduct = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

// Fetch categories.
export const getCategories = async () => {
  const response = await api.get("/categories");

  console.log("CATEGORY API RAW RESPONSE:", response.data);

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

// Get authenticated customer.
export const getAuthenticatedCustomer = async () => {
  const response = await api.get("/customer");
  return response.data;
};

// Fetch authenticated customer's order history.
export const getCustomerOrders = async (page = 1) => {
  const response = await api.get(`/orders?page=${page}`);
  return response.data;
};

// Fetch details of one customer's order.
export const getCustomerOrder = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

// Log out a customer.
export const logoutCustomer = async () => {
  try {
    const response = await api.post("/logout");
    return response.data;
  } finally {
    useAuthStore.getState().logout();
  }
};

// Submit an order.
export const createOrder = async (orderData) => {
  const response = await api.post("/orders", orderData);
  return response.data;
};

// Check mobile money payment status.
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

// Create chat conversation.
export const createChatConversation = async (data) => {
  const response = await api.post("/chat/conversations", data);
  return response.data;
};

// Retrieve conversation history.
export const getChatConversation = async (token) => {
  const response = await api.get(`/chat/conversations/${token}`);
  return response.data;
};

// Send chat message.
export const sendChatMessage = async (token, body) => {
  const response = await api.post(
    `/chat/conversations/${token}/messages`,
    { body }
  );

  return response.data;
};

// Fetch reviews for a product.
export const getProductReviews = async (productId, page = 1) => {
  const response = await api.get(
    `/products/${productId}/reviews?page=${page}`
  );

  return response.data;
};

// Submit a new review or update the customer's existing review.
export const submitProductReview = async (productId, reviewData) => {
  const response = await api.post(
    `/products/${productId}/reviews`,
    reviewData
  );

  return response.data;
};

export default api;
