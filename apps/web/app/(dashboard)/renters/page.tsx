"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/axios";
import { CreateRenterDialog } from "@/components/renters/create-renter-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Phone, IdCard, User } from "lucide-react";
import { format } from "date-fns";

interface Renter {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    nationalId: string;
    status: "ACTIVE" | "PAST" | "EVICTED";
    createdAt: string;
}

export default function RentersPage() {
    const [renters, setRenters] = useState<Renter[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRenters = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get("/renters");
            if (response.data.success) {
                setRenters(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch renters", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRenters();
    }, [fetchRenters]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Renters</h1>
                    <p className="text-muted-foreground">
                        Manage your tenants and their contact information.
                    </p>
                </div>
                <CreateRenterDialog onSuccess={fetchRenters} />
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>National ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Registered</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Loading renters...
                                </TableCell>
                            </TableRow>
                        ) : renters.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No renters found. Click "Add Renter" to register someone.
                                </TableCell>
                            </TableRow>
                        ) : (
                            renters.map((renter) => (
                                <TableRow key={renter.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-400" />
                                        {renter.firstName} {renter.lastName}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="h-4 w-4" />
                                            {renter.phone}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <IdCard className="h-4 w-4" />
                                            {renter.nationalId}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={renter.status === "ACTIVE" ? "default" : "secondary"}
                                            className={
                                                renter.status === "ACTIVE" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                    renter.status === "EVICTED" ? "bg-red-50 text-red-700 border-red-200" : ""
                                            }
                                        >
                                            {renter.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {/* If you haven't installed date-fns yet, run: npm install date-fns */}
                                        {new Date(renter.createdAt).toLocaleDateString('en-KE', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
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