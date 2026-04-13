"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Home, AlertCircle, Percent } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

// Helper to format KES amounts
const formatKES = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 0,
    }).format(amount || 0);
};

export default function DashboardPage() {
    const { user } = useAuthStore();

    // 1. Fetch Financials (Collected vs Pending)
    const { data: financials, isLoading: loadingFin } = useQuery({
        queryKey: ["reports", "financials"],
        queryFn: async () => {
            const res = await api.get("/reports/financials");
            return res.data.data;
        },
    });

    // 2. Fetch Occupancy (Vacant vs Occupied)
    const { data: occupancy, isLoading: loadingOcc } = useQuery({
        queryKey: ["reports", "occupancy"],
        queryFn: async () => {
            const res = await api.get("/reports/occupancy");
            return res.data.data;
        },
    });

    // 3. Fetch Arrears (Tenants who owe money)
    const { data: arrears = [], isLoading: loadingArr } = useQuery({
        queryKey: ["reports", "arrears"],
        queryFn: async () => {
            const res = await api.get("/reports/arrears");
            return res.data.data;
        },
    });

    // Calculate Occupancy Rate safely
    const totalUnits = occupancy?.total || 0;
    const occupiedUnits = occupancy?.OCCUPIED || 0;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    const isLoading = loadingFin || loadingOcc || loadingArr;

    if (isLoading) {
        return <div className="flex h-full items-center justify-center text-muted-foreground">Loading dashboard data...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Welcome back. Here is an overview.
                </p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatKES(financials?.totalCollectedInKES)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Collection rate: {financials?.collectionRate}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Arrears</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatKES(financials?.totalPendingInKES)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Unpaid invoices
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {occupancyRate}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {occupiedUnits} out of {totalUnits} units occupied
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                        <Home className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totalUnits}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {occupancy?.VACANT || 0} vacant, {occupancy?.MAINTENANCE || 0} under maintenance
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Arrears List */}
            <Card className="col-span-4 mt-6">
                <CardHeader>
                    <CardTitle>Recent Arrears</CardTitle>
                    <CardDescription>Tenants with overdue rent payments.</CardDescription>
                </CardHeader>
                <CardContent>
                    {arrears.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">All tenants are currently up to date.</p>
                    ) : (
                        <div className="space-y-4">
                            {arrears.slice(0, 5).map((invoice: any) => (
                                <div key={invoice.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium">
                                            {invoice.rentalAgreement.renter.firstName} {invoice.rentalAgreement.renter.lastName}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {invoice.rentalAgreement.unit.property.name} - Unit {invoice.rentalAgreement.unit.name}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-red-600">{formatKES(invoice.amount)}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Due: {new Date(invoice.dueDate).toLocaleDateString('en-KE')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}