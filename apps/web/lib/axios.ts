import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Call the backend refresh endpoint (must accept httpOnly cookie)
                const refreshResponse = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newToken = refreshResponse.data.data.accessToken;
                // Update Zustand state with new token
                useAuthStore.setState({ accessToken: newToken });

                // Retry original request
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear session and redirect
                useAuthStore.getState().logout();
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;