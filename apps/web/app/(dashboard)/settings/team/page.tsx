"use client";
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export default function TeamSettingsPage() {
    const { data: team, isLoading } = useQuery({
        queryKey: ['team'],
        queryFn: () => api.get('/users').then(res => res.data)
    });

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Team Management</h1>
            {isLoading ? <p>Loading team...</p> : (
                <ul className="space-y-2">
                    {team?.map((member: any) => (
                        <li key={member.id} className="p-4 border rounded shadow-sm">
                            {member.firstName} {member.lastName} - {member.email} ({member.role})
                        </li>
                    ))}
                </ul>
            )}
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Invite Member</button>
        </div>
    );
}