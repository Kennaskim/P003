"use client";

import { useQuery } from '@tanstack/react-query';
import { getOwnerDashboard } from '@/lib/api/owner-portal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, DollarSign, Wrench, Loader2 } from 'lucide-react';

export default function OwnerDashboardPage() {
    const { data: metrics, isLoading } = useQuery({
        queryKey: ['owner-dashboard'],
        queryFn: getOwnerDashboard,
    });

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading your portfolio...
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Owner Portfolio</h1>
                <p className="text-muted-foreground">Welcome back. Here is an overview of your properties.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.totalProperties || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.activeTenants || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            KES {metrics?.monthlyRevenue?.toLocaleString('en-KE') || '0'}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Maintenance</CardTitle>
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.pendingMaintenance || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Placeholder for future Owner Statements Table */}
            <div className="bg-white border rounded-lg shadow-sm p-6 mt-8">
                <h2 className="text-lg font-semibold mb-4">Recent Disbursements & Statements</h2>
                <div className="text-center py-10 text-gray-500">
                    Your monthly statements and payout records will appear here.
                </div>
            </div>
        </div>
    );
}