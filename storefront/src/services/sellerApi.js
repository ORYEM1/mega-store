import axios from "axios";
import { useSellerAuthStore } from "../store/sellerAuthStore";

const sellerApi = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://192.168.10.246:8000/api",

  headers: {
    Accept: "application/json",
  },
});

// Attach seller authentication token.
sellerApi.interceptors.request.use(
  (config) => {
    const token = useSellerAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired seller sessions.
sellerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    const isLoginOrRegistration =
      /(?:login|register)(?:\?.*)?$/.test(requestUrl);

    const isAuthenticated =
      useSellerAuthStore.getState().isAuthenticated;

    if (status === 401 && !isLoginOrRegistration && isAuthenticated) {
      useSellerAuthStore.getState().logout();

      sessionStorage.setItem(
        "seller_auth_message",
        "Your seller session has expired. Please log in again."
      );

      if (!window.location.pathname.startsWith("/seller/login")) {
        window.location.assign("/seller/login");
      }
    }

    return Promise.reject(error);
  }
);

// Seller registration.
export const registerSeller = async (sellerData) => {
  const response = await sellerApi.post(
    "/seller/register",
    sellerData
  );

  return response.data;
};

// Seller login.
export const loginSeller = async (credentials) => {
  const response = await sellerApi.post(
    "/seller/login",
    credentials
  );

  return response.data;
};

// Get authenticated seller profile.
export const getSellerProfile = async () => {
  const response = await sellerApi.get("/seller/profile");
  return response.data;
};

// Seller logout.
export const logoutSeller = async () => {
  try {
    const response = await sellerApi.post("/seller/logout");
    return response.data;
  } finally {
    useSellerAuthStore.getState().logout();
  }
};

// Get seller categories.
export const getSellerCategories = async () => {
  const response = await sellerApi.get("/seller/categories");
  return response.data;
};

// Get seller products.
export const getSellerProducts = async (page = 1) => {
  const response = await sellerApi.get(
    `/seller/products?page=${page}`
  );

  return response.data;
};

// Get a single seller product.
export const getSellerProduct = async (id) => {
  const response = await sellerApi.get(`/seller/products/${id}`);
  return response.data;
};

// Create seller product.
export const createSellerProduct = async (productData) => {
  const response = await sellerApi.post(
    "/seller/products",
    productData
  );

  return response.data;
};

// Update seller product.
export const updateSellerProduct = async (id, productData) => {
  const response = await sellerApi.post(
    `/seller/products/${id}`,
    productData
  );

  return response.data;
};

// Delete seller product.
export const deleteSellerProduct = async (id) => {
  const response = await sellerApi.delete(
    `/seller/products/${id}`
  );

  return response.data;
};

export default sellerApi;
