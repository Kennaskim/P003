import { api } from '../axios';

export interface AuditLog {
    id: string;
    tenantId: string;
    userId: string;
    action: string;
    entityType: string | null;
    entityId: string | null;
    details: any;
    ipAddress: string;
    createdAt: string;
    user: {
        email: string;
        role: string;
    };
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    meta: {
        total: number;
        skip: number;
        take: number;
    };
}

export const getAuditLogs = async (skip = 0, take = 50): Promise<PaginatedResponse<AuditLog>> => {
    const response = await api.get(`/admin/audit-logs?skip=${skip}&take=${take}`);
    return response.data;
};