import api from '../axios';

export interface RecordPaymentPayload {
    amount: number;
    method: 'MPESA' | 'CASH' | 'BANK' | string;
    reference?: string;
}

export const billingApi = {
    // --- Invoices ---
    // Updated to match RentInvoicesController ('/rent-invoices')
    getInvoices: async (params?: Record<string, any>) => {
        const { data } = await api.get('/rent-invoices', { params });
        return data;
    },
    getInvoiceById: async (id: string) => {
        const { data } = await api.get(`/rent-invoices/${id}`);
        return data;
    },
    createInvoice: async (payload: any) => {
        const { data } = await api.post('/rent-invoices', payload);
        return data;
    },
    sendReminder: async (id: string) => {
        const { data } = await api.post(`/rent-invoices/${id}/send-reminder`);
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

    // Updated to match MpesaController ('/mpesa/stk-push')
    initiateStkPush: async (payload: { rentInvoiceId?: string, phone: string, amount: number }) => {
        const { data } = await api.post('/mpesa/stk-push', payload);
        return data;
    },

    // Updated to match the newly added endpoint: POST /rent-invoices/:id/record-payment
    recordManualPayment: async (invoiceId: string, payload: RecordPaymentPayload) => {
        const { data } = await api.post(`/rent-invoices/${invoiceId}/record-payment`, payload);
        return data;
    },

    refundPayment: async (id: string, payload: { reason: string }) => {
        const { data } = await api.post(`/payments/${id}/refund`, payload);
        return data;
    }
};

// Export standalone function to maintain compatibility with the RecordPaymentDialog component
export const recordManualPayment = billingApi.recordManualPayment;