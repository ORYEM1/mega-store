import api from "./api";

// Seller registration
export const registerSeller = async (sellerData) => {
    const response = await api.post("/seller/register", sellerData);
    return response.data;
};

// Seller login
export const loginSeller = async (credentials) => {
    const response = await api.post("/seller/login", credentials);
    return response.data;
};

// Get logged-in seller profile
export const getSellerProfile = async () => {
    const response = await api.get("/seller/profile");
    return response.data;
};

// Seller logout
export const logoutSeller = async () => {
    try {
        const response = await api.post("/seller/logout");
        return response.data;
    } finally {
        sessionStorage.removeItem("seller_token");
        sessionStorage.removeItem("seller");
    }
};

// Get seller's products
export const getSellerProducts = async (page = 1) => {
    const response = await api.get(`/seller/products?page=${page}`);
    return response.data;
};

// Get a single seller product
export const getSellerProduct = async (id) => {
    const response = await api.get(`/seller/products/${id}`);
    return response.data;
};


// Create a product with image upload support
export const createSellerProduct = async (productData) => {
    const response = await api.post(
        "/seller/products",
        productData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
};

// Update a product
export const updateSellerProduct = async (id, productData) => {
    const response = await api.post(
        `/seller/products/${id}`,
        productData
    );

    return response.data;
};

// Delete a product
export const deleteSellerProduct = async (id) => {
    const response = await api.delete(`/seller/products/${id}`);
    return response.data;
};

// Get available product categories
export const getSellerCategories = async () => {
    const response = await api.get("/seller/categories");
    return response.data;
};