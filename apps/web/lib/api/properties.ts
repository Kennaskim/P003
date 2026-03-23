import api from '../axios';

export const propertiesApi = {
    getAll: async () => {
        const { data } = await api.get('/properties');
        return data;
    },
    getById: async (id: string) => {
        const { data } = await api.get(`/properties/${id}`);
        return data;
    },
    create: async (payload: any) => {
        const { data } = await api.post('/properties', payload);
        return data;
    },
    update: async (id: string, payload: any) => {
        const { data } = await api.patch(`/properties/${id}`, payload);
        return data;
    },
    delete: async (id: string) => {
        const { data } = await api.delete(`/properties/${id}`);
        return data;
    },
    getUnits: async (propertyId: string) => {
        const { data } = await api.get(`/properties/${propertyId}/units`);
        return data;
    },
    createUnits: async (propertyId: string, payload: any) => {
        const { data } = await api.post(`/properties/${propertyId}/units`, payload);
        return data;
    }
};