import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
    baseURL: API_URL,
    timeout: 20000,
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

// Attach the saved Sanctum token to authenticated requests.
api.interceptors.request.use(async (config) => {
    try {
        const savedAuth = await AsyncStorage.getItem("adrian-auth-storage");

        if (savedAuth) {
            const authData = JSON.parse(savedAuth);
            const token = authData?.state?.token;

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
    } catch (error) {
        console.log("Could not load authentication token:", error.message);
    }

    return config;
});

export default api;