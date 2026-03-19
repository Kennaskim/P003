import { api } from '../axios';

export interface Document {
    id: string;
    tenantId: string;
    name: string;
    fileType: string;
    size: number;
    entityType: 'NATIONAL_ID' | 'AGREEMENT' | 'RECEIPT' | 'OTHER' | string;
    createdAt: string;
    // Optional relations
    renter?: { name: string } | null;
    property?: { name: string } | null;
}

export const getDocuments = async (): Promise<{ success: boolean; data: Document[] }> => {
    const response = await api.get('/files'); // Assuming your backend module is named 'files'
    return response.data;
};

export const uploadDocument = async (formData: FormData) => {
    const response = await api.post('/files/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const deleteDocument = async (id: string) => {
    const response = await api.delete(`/files/${id}`);
    return response.data;
};