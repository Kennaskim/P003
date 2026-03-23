"use client";
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export default function CompanySettingsPage() {
    const { data: tenant, isLoading } = useQuery({
        queryKey: ['tenant-settings'],
        queryFn: () => api.get('/tenants/me').then(res => res.data)
    });

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
                <div className="bg-white p-6 border rounded-lg shadow-sm space-y-4">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Company Name</h3>
                        <p className="mt-1 text-lg text-gray-900">{tenant?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Contact Email</h3>
                        <p className="mt-1 text-lg text-gray-900">{tenant?.email || 'N/A'}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Subscription Plan</h3>
                        <span className="inline-flex mt-1 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {tenant?.subscriptionPlan || 'STARTER'}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Status</h3>
                        <p className="mt-1 text-sm text-gray-900">{tenant?.subscriptionStatus || 'TRIAL'}</p>
                    </div>
                </div>
            )}
        </div>
    );
}