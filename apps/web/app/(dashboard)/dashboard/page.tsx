"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Home, Users, CreditCard, AlertCircle } from "lucide-react";

interface DashboardMetrics {
    totalProperties: number;
    totalUnits: number;
    occupiedUnits: number;
    vacancyRate: number;
    activeRenters: number;
    collectedRent: number;
    pendingRent: number;
}

const formatKES = (amount: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(amount);
};

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await api.get("/dashboard/metrics");
                if (response.data.success) {
                    setMetrics(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard metrics", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    if (isLoading || !metrics) {
        return <div className="flex h-full items-center justify-center text-muted-foreground">Loading analytics...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Portfolio Overview</h1>
                <p className="text-muted-foreground">
                    Live analytics for your rental properties.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalProperties}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Units Overview</CardTitle>
                        <Home className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalUnits}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {metrics.occupiedUnits} occupied ({metrics.vacancyRate.toFixed(1)}% vacant)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Renters</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.activeRenters}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Collected Rent</CardTitle>
                        <CreditCard className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">{formatKES(metrics.collectedRent)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Row for Alerts/Arrears */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-red-100 bg-red-50/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-800">Pending Rent (Arrears)</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">{formatKES(metrics.pendingRent)}</div>
                        <p className="text-xs text-red-600 mt-1">Outstanding invoices requiring STK push</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}