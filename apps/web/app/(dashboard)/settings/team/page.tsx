"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const ROLES = ['PROPERTY_MANAGER', 'ACCOUNTANT', 'MAINTENANCE_STAFF'] as const;

export default function TeamSettingsPage() {
    const queryClient = useQueryClient();
    const [showInvite, setShowInvite] = useState(false);
    const [form, setForm] = useState({ email: '', firstName: '', lastName: '', role: 'PROPERTY_MANAGER' });

    const { data: team, isLoading } = useQuery({
        queryKey: ['team'],
        queryFn: () => api.get('/users').then(res => res.data?.data || res.data)
    });

    const inviteMutation = useMutation({
        mutationFn: (payload: typeof form) => api.post('/users/invite', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team'] });
            setShowInvite(false);
            setForm({ email: '', firstName: '', lastName: '', role: 'PROPERTY_MANAGER' });
        }
    });

    const roleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: string }) =>
            api.patch(`/users/${userId}/role`, { role }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team'] })
    });

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Team Management</h1>
                <button
                    onClick={() => setShowInvite(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    + Invite Member
                </button>
            </div>

            {/* Invite Dialog */}
            {showInvite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-4">Invite Team Member</h2>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                inviteMutation.mutate(form);
                            }}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                        required
                                        value={form.firstName}
                                        onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                        required
                                        value={form.lastName}
                                        onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    required
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    value={form.role}
                                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {ROLES.map(r => (
                                        <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                                    ))}
                                </select>
                            </div>

                            {inviteMutation.isError && (
                                <p className="text-red-500 text-sm">
                                    {(inviteMutation.error as any)?.response?.data?.message || 'Failed to send invite'}
                                </p>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowInvite(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviteMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                                >
                                    {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Team Table */}
            {isLoading ? (
                <p className="text-gray-500">Loading team...</p>
            ) : (
                <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-gray-500 uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Last Login</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {(Array.isArray(team) ? team : []).map((member: any) => (
                                <tr key={member.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium">
                                        {member.firstName || ''} {member.lastName || ''}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{member.email}</td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={member.role}
                                            onChange={e => roleMutation.mutate({ userId: member.id, role: e.target.value })}
                                            className="text-xs px-2 py-1 border rounded bg-white"
                                        >
                                            <option value="LANDLORD">LANDLORD</option>
                                            {ROLES.map(r => (
                                                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {member.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString() : 'Never'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}