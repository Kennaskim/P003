import api from '../axios';

export const agreementsApi = {
    getAll: async (params?: { renterId?: string; isActive?: boolean }) => {
        const { data } = await api.get('/rental-agreements', { params });
        return data.data || data;
    },

    getById: async (id: string) => {
        const { data } = await api.get(`/rental-agreements/${id}`);
        return data.data || data;
    },

    create: async (payload: any) => {
        const { data } = await api.post('/rental-agreements', payload);
        return data.data || data;
    },

    update: async (id: string, payload: any) => {
        // Note: A generic PATCH /rental-agreements/:id endpoint is not currently in your backend controller. 
        // You will need to add it to rental-agreements.controller.ts for this to work.
        const { data } = await api.patch(`/rental-agreements/${id}`, payload);
        return data.data || data;
    },

    terminate: async (id: string) => {
        // Backend uses PATCH and doesn't currently require a payload body for termination
        const { data } = await api.patch(`/rental-agreements/${id}/terminate`);
        return data.data || data;
    },

    downloadPdf: async (id: string) => {
        // Note: GET /rental-agreements/:id/pdf needs to be implemented on the backend!
        const { data } = await api.get(`/rental-agreements/${id}/pdf`, { responseType: 'blob' });
        return data;
    }
};

// Maintained for backward compatibility with pages using the standalone function
export const getRentalAgreements = async (params?: { renterId?: string; isActive?: boolean }) => {
    const response = await api.get('/rental-agreements', { params });
    return response.data.data;
};