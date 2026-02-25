import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
    withCredentials: true, // Crucial for sending/receiving the httpOnly refresh_token cookie
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercept requests to attach the JWT token
api.interceptors.request.use(
    (config) => {
        // Get the current token directly from the Zustand store
        const token = useAuthStore.getState().accessToken;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Optional: Intercept responses to handle global 401s (e.g., token expired)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // If unauthorized, clear the store and force login
            useAuthStore.getState().logout();
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);