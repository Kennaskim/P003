import api from '../axios';

export const authApi = {
    forgotPassword: async (email: string) => {
        const { data } = await api.post('/auth/forgot-password', { email });
        return data;
    },
    resetPassword: async (payload: { token: string; newPassword: string }) => {
        const { data } = await api.post('/auth/reset-password', payload);
        return data;
    }
};