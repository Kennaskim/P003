import api from '../axios';

export const unitsApi = {
    getVacant: async () => {
        const { data } = await api.get('/units/vacant');
        return data;
    },
    update: async (id: string, payload: any) => {
        const { data } = await api.patch(`/units/${id}`, payload);
        return data;
    },
    delete: async (id: string) => {
        const { data } = await api.delete(`/units/${id}`);
        return data;
    }
};