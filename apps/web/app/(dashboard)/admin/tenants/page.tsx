"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/axios"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { Loader2, Building2 } from "lucide-react"
import { toast } from "sonner"

export default function SuperAdminTenantsPage() {
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-tenants"],
        queryFn: async () => {
            const res = await api.get("/admin/tenants");
            return res.data.data;
        },
    });

    const handleSubscriptionUpdate = async (tenantId: string, field: 'plan' | 'status', value: string, currentPlan: string, currentStatus: string) => {
        try {
            setUpdatingId(tenantId);
            const payload = {
                plan: field === 'plan' ? value : currentPlan,
                status: field === 'status' ? value : currentStatus,
            };

            await api.patch(`/admin/tenants/${tenantId}/subscription`, payload);
            toast.success("Tenant subscription updated!");
            refetch();
        } catch (error) {
            toast.error("Failed to update subscription.");
        } finally {
            setUpdatingId(null);
        }
    };

    if (isError) {
        return <div className="p-8 text-destructive">Failed to load tenants. Verify Super Admin access.</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Agencies & Landlords</h2>
                    <p className="text-muted-foreground">Manage your SaaS customers and their billing plans.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Platform Tenants</CardTitle>
                    <CardDescription>All registered property management companies on your platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Company Name</TableHead>
                                        <TableHead>Usage Stats</TableHead>
                                        <TableHead>Joined Date</TableHead>
                                        <TableHead>Plan Tier</TableHead>
                                        <TableHead>Account Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.map((tenant: any) => (
                                        <TableRow key={tenant.id}>
                                            <TableCell>
                                                <div className="font-medium">{tenant.name}</div>
                                                <div className="text-sm text-muted-foreground">{tenant.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <span className="font-medium">{tenant._count?.properties || 0}</span> Props &middot; <span className="font-medium">{tenant._count?.units || 0}</span> Units
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {format(new Date(tenant.createdAt), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    disabled={updatingId === tenant.id}
                                                    defaultValue={tenant.subscriptionPlan || "STARTER"}
                                                    onValueChange={(val) => handleSubscriptionUpdate(tenant.id, 'plan', val, tenant.subscriptionPlan, tenant.subscriptionStatus)}
                                                >
                                                    <SelectTrigger className="w-[140px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="STARTER">Starter</SelectItem>
                                                        <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                                                        <SelectItem value="AGENCY">Agency</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    disabled={updatingId === tenant.id}
                                                    defaultValue={tenant.subscriptionStatus || "TRIAL"}
                                                    onValueChange={(val) => handleSubscriptionUpdate(tenant.id, 'status', val, tenant.subscriptionPlan, tenant.subscriptionStatus)}
                                                >
                                                    <SelectTrigger className="w-[140px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="TRIAL">Trial</SelectItem>
                                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                                        <SelectItem value="PAST_DUE">Past Due</SelectItem>
                                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}