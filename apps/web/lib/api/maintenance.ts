import { api } from '../axios';

export interface MaintenanceRequest {
    id: string;
    tenantId: string;
    unitId: string;
    category: string;
    description: string;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED';
    cost?: number | null;
    assignedToName?: string | null;
    createdAt: string;
    unit: {
        id: string;
        name: string;
        property: {
            name: string;
        };
    };
}

export const getMaintenanceRequests = async (): Promise<{ success: boolean; data: MaintenanceRequest[] }> => {
    const response = await api.get('/maintenance');
    return response.data;
};

export const updateMaintenanceStatus = async (id: string, data: Partial<MaintenanceRequest>) => {
    const response = await api.patch(`/maintenance/${id}`, data);
    return response.data;
};