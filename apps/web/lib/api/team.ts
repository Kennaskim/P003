import api from '../axios';

export interface TeamMember {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'SUPER_ADMIN' | 'PROPERTY_MANAGER' | 'LANDLORD' | 'ACCOUNTANT' | 'MAINTENANCE' | 'TENANT';
    isActive: boolean;
}

export interface InviteUserPayload {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

export const getTeamMembers = async (): Promise<TeamMember[]> => {
    const response = await api.get('/users');
    return response.data.data;
};

export const inviteUser = async (data: InviteUserPayload) => {
    const response = await api.post('/users/invite', data);
    return response.data;
};