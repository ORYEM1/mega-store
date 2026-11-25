import api from "./api";

function extractList(response) {
    const body = response.data;

    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.data)) return body.data;
    if (Array.isArray(body?.products)) return body.products;
    if (Array.isArray(body?.categories)) return body.categories;

    return [];
}

export async function getProducts() {
    const response = await api.get("/products");
    const body = response.data;

    return Array.isArray(body?.products)
        ? body.products
        : extractList(response);
}

export async function getCategories() {
    const response = await api.get("/categories");
    const body = response.data;

    return Array.isArray(body?.categories)
        ? body.categories
        : extractList(response);
}

/**
 * Get customer reviews for a product.
 */
export async function getProductReviews(productId, page = 1) {
    const response = await api.get(
        `/products/${productId}/reviews`,
        {
            params: { page },
        }
    );

    return response.data;
}

/**
 * Submit a rating or update the customer's existing review.
 */
export async function submitProductReview(productId, rating, review) {
    const response = await api.post(
        `/products/${productId}/reviews`,
        {
            rating,
            review: review?.trim() || null,
        }
    );

    return response.data;
}

/**
 * Get authenticated customer's order history.
 */
export async function getOrders(page = 1) {
    const response = await api.get("/orders", {
        params: { page },
    });

    return response.data;
}

/**
 * Get details of a specific customer order.
 */
export async function getOrderDetails(orderId) {
    const response = await api.get(`/orders/${orderId}`);

    return response.data;
}