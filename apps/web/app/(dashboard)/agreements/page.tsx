"use client";

import { api } from "@/lib/axios";
import { CreateAgreementDialog } from "@/components/agreements/create-agreement-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { User, Home, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// ✅ Divide by 100 because values are stored as integer CENTS in the DB
const formatKES = (amountInCents: number) => {
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 0
    }).format(amountInCents / 100);
};

export default function AgreementsPage() {
    const queryClient = useQueryClient();

    // 1. Fetch Active Agreements
    const { data: agreements = [], isLoading } = useQuery({
        queryKey: ['agreements'],
        queryFn: async () => {
            const response = await api.get("/rental-agreements");
            return response.data.data;
        }
    });

    // 2. Fetch Vacant Units (for the dialog)
    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: async () => {
            const response = await api.get("/units");
            // We only want to pass VACANT units to the agreement creator
            return response.data.data.filter((u: any) => u.status === 'VACANT');
        }
    });

    // 3. Fetch Renters (for the dialog)
    const { data: renters = [] } = useQuery({
        queryKey: ['renters'],
        queryFn: async () => {
            const response = await api.get("/renters");
            return response.data.data.filter((r: any) => r.status === 'ACTIVE');
        }
    });

    const handleTerminate = async (id: string) => {
        if (!confirm("Are you sure you want to terminate this agreement? The unit will be marked as VACANT.")) return;

        try {
            const response = await api.patch(`/rental-agreements/${id}/terminate`);
            if (response.data.success) {
                toast.success("Agreement terminated successfully.");
                // ✅ Tell React Query to refresh the tables instantly
                queryClient.invalidateQueries({ queryKey: ['agreements'] });
                queryClient.invalidateQueries({ queryKey: ['units'] });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to terminate agreement");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Rental Agreements</h1>
                    <p className="text-muted-foreground">
                        Manage active contracts between your properties and renters.
                    </p>
                </div>
                {/* ✅ Pass the fetched units and renters down to the dialog */}
                <CreateAgreementDialog units={units} renters={renters} />
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tenant</TableHead>
                            <TableHead>Property & Unit</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead className="text-right">Rent / Deposit</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Loading agreements...</TableCell>
                            </TableRow>
                        ) : agreements.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No active agreements found. Click "New Agreement" to assign a unit.
                                </TableCell>
                            </TableRow>
                        ) : (
                            agreements.map((agreement: any) => (
                                <TableRow key={agreement.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            {agreement.renter.firstName} {agreement.renter.lastName}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{agreement.unit.property.name}</span>
                                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Home className="h-3 w-3" /> Unit: {agreement.unit.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(agreement.startDate).toLocaleDateString('en-KE')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-medium">{formatKES(agreement.rentAmount)}</span>
                                            <span className="text-sm text-muted-foreground">Dep: {formatKES(agreement.deposit)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleTerminate(agreement.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                            <XCircle className="h-4 w-4 mr-1" /> Terminate
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}