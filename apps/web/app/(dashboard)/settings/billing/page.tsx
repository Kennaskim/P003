"use client";
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export default function BillingSettingsPage() {
    // Assuming /auth/me returns tenant info or you have a /tenants/me endpoint
    const { data: user, isLoading } = useQuery({
        queryKey: ['me'],
        queryFn: () => api.get('/auth/me').then(res => res.data.data),
    });

    if (isLoading) return <div className="p-6">Loading billing info...</div>;

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Billing & Subscription</h1>
            <div className="bg-white border rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold">Current Plan: {user?.tenant?.subscriptionPlan || 'STARTER'}</h2>
                <div className="flex items-center space-x-2">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${user?.tenant?.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        user?.tenant?.subscriptionStatus === 'TRIAL' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                        {user?.tenant?.subscriptionStatus}
                    </span>
                </div>

                {user?.tenant?.subscriptionStatus === 'TRIAL' && (
                    <p className="text-sm text-gray-600">Your 14-day trial is currently active. Upgrade to keep uninterrupted access.</p>
                )}

                {user?.tenant?.subscriptionStatus !== 'ACTIVE' && (
                    <div className="mt-6 p-4 bg-gray-50 border rounded-md">
                        <p className="font-medium text-gray-800">Ready to Upgrade or Renew?</p>
                        <p className="text-sm text-gray-600 mt-1 mb-4">Contact our support team directly to process your payment and activate your workspace.</p>
                        <a href="https://wa.me/254790035911" target="_blank" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
                            WhatsApp Us to Renew
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}