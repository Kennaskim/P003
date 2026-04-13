import api from '../axios';

export interface OwnerDashboardData {
    totalProperties: number;
    activeTenants: number;
    monthlyRevenue: number;
    pendingMaintenance: number;
}

export const getOwnerDashboard = async (): Promise<OwnerDashboardData> => {
    const response = await api.get('/owner-portal/dashboard');
    return response.data.data;
};