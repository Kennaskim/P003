import api from '../axios';

export const billingApi = {
    // --- Invoices ---
    getInvoices: async (params?: Record<string, any>) => {
        const { data } = await api.get('/invoices', { params });
        return data;
    },
    getInvoiceById: async (id: string) => {
        const { data } = await api.get(`/invoices/${id}`);
        return data;
    },
    createInvoice: async (payload: any) => {
        const { data } = await api.post('/invoices', payload);
        return data;
    },
    sendReminder: async (id: string) => {
        const { data } = await api.post(`/invoices/${id}/send-reminder`);
        return data;
    },

    // --- Payments ---
    getPayments: async (params?: Record<string, any>) => {
        const { data } = await api.get('/payments', { params });
        return data;
    },
    getPaymentById: async (id: string) => {
        const { data } = await api.get(`/payments/${id}`);
        return data;
    },
    initiateStkPush: async (payload: { rentInvoiceId: string, phone: string, amount: number }) => {
        const { data } = await api.post('/payments/initiate', payload);
        return data;
    },
    recordManualPayment: async (payload: { rentInvoiceId: string, amount: number, method: string, reference?: string }) => {
        const { data } = await api.post('/payments/record-manual', payload);
        return data;
    },
    refundPayment: async (id: string, payload: { reason: string }) => {
        const { data } = await api.post(`/payments/${id}/refund`, payload);
        return data;
    }
};