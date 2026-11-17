import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://192.168.10.246:8000/api",
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

// Attach seller authentication token to requests
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem("seller_token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Handle expired or invalid seller sessions
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            sessionStorage.removeItem("seller_token");
            sessionStorage.removeItem("seller");

            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default api;