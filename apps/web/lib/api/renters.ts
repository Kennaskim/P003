import api from '../axios';

export const rentersApi = {
    getAll: async (params?: Record<string, any>) => {
        const { data } = await api.get('/renters', { params });
        return data;
    },
    getById: async (id: string) => {
        const { data } = await api.get(`/renters/${id}`);
        return data;
    },
    create: async (payload: any) => {
        const { data } = await api.post('/renters', payload);
        return data;
    },
    update: async (id: string, payload: any) => {
        const { data } = await api.patch(`/renters/${id}`, payload);
        return data;
    },
    moveOut: async (id: string, payload: { moveOutDate: string, reason?: string }) => {
        const { data } = await api.post(`/renters/${id}/move-out`, payload);
        return data;
    }
};