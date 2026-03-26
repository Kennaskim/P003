"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export default function CompanySettingsPage() {
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState('');

    const { data: tenant, isLoading } = useQuery({
        queryKey: ['tenant-settings'],
        queryFn: async () => {
            const res = await api.get('/tenants/me');
            return res.data?.data || res.data;
        },
    });

    const mutation = useMutation({
        mutationFn: (newName: string) => api.patch('/tenants/me', { name: newName }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
            setEditing(false);
        }
    });

    const handleEdit = () => {
        setName(tenant?.name || '');
        setEditing(true);
    };

    const handleSave = () => {
        if (name.trim()) mutation.mutate(name.trim());
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Company Settings</h1>

            {isLoading ? (
                <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-6 border rounded-lg shadow-sm space-y-6">
                    {/* Company Name - Editable */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Company Name</h3>
                        {editing ? (
                            <div className="mt-2 flex items-center gap-3">
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSave}
                                    disabled={mutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                                >
                                    {mutation.isPending ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={() => setEditing(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="mt-1 flex items-center justify-between">
                                <p className="text-lg text-gray-900">{tenant?.name || 'N/A'}</p>
                                <button
                                    onClick={handleEdit}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Edit
                                </button>
                            </div>
                        )}

                        {mutation.isError && (
                            <p className="mt-2 text-red-500 text-sm">Failed to update company name. Please try again.</p>
                        )}
                        {mutation.isSuccess && !editing && (
                            <p className="mt-2 text-green-600 text-sm">Company name updated successfully.</p>
                        )}
                    </div>

                    {/* Contact Email - Read Only */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Contact Email</h3>
                        <p className="mt-1 text-lg text-gray-900">{tenant?.email || 'N/A'}</p>
                    </div>

                    {/* Subscription Plan */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Subscription Plan</h3>
                        <span className="inline-flex mt-1 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {tenant?.subscriptionPlan || 'STARTER'}
                        </span>
                    </div>

                    {/* Subscription Status */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Subscription Status</h3>
                        <span className={`inline-flex mt-1 items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tenant?.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            tenant?.subscriptionStatus === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                            {tenant?.subscriptionStatus || 'TRIAL'}
                        </span>
                    </div>

                    {/* Phone */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                        <p className="mt-1 text-lg text-gray-900">{tenant?.phone || 'Not set'}</p>
                    </div>
                </div>
            )}
        </div>
    );
}