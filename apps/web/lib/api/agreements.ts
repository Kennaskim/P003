import api from '../axios';

export const agreementsApi = {
    getAll: async () => {
        const { data } = await api.get('/agreements');
        return data;
    },
    getById: async (id: string) => {
        const { data } = await api.get(`/agreements/${id}`);
        return data;
    },
    create: async (payload: any) => {
        const { data } = await api.post('/agreements', payload);
        return data;
    },
    update: async (id: string, payload: any) => {
        const { data } = await api.patch(`/agreements/${id}`, payload);
        return data;
    },
    terminate: async (id: string, payload: { terminationDate: string, reason?: string }) => {
        const { data } = await api.post(`/agreements/${id}/terminate`, payload);
        return data;
    },
    downloadPdf: async (id: string) => {
        const { data } = await api.get(`/agreements/${id}/pdf`, { responseType: 'blob' });
        return data;
    }
};