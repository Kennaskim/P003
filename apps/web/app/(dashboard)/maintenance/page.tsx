"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/axios";
import { CreateMaintenanceDialog } from "@/components/maintenance/create-maintenance-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench } from "lucide-react";
import { toast } from "sonner";

export default function MaintenancePage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get("/maintenance");
            if (response.data.success) {
                setRequests(response.data.data);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await api.patch(`/maintenance/${id}`, { status: newStatus });
            toast.success("Status updated");
            fetchRequests();
        } catch {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
                    <p className="text-muted-foreground">Track and resolve property issues.</p>
                </div>
                <CreateMaintenanceDialog onSuccess={fetchRequests} />
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Property & Unit</TableHead>
                            <TableHead>Issue</TableHead>
                            <TableHead>Urgency</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Update Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow>
                        ) : requests.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No maintenance requests found.</TableCell></TableRow>
                        ) : (
                            requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="font-medium">{req.unit.property.name}</div>
                                        <div className="text-sm text-muted-foreground">Unit: {req.unit.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{req.category}</div>
                                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">{req.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={
                                            req.urgency === 'Critical' ? 'bg-red-50 text-red-700' :
                                                req.urgency === 'High' ? 'bg-orange-50 text-orange-700' : ''
                                        }>{req.urgency}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={
                                            req.status === 'SUBMITTED' ? 'bg-gray-500' :
                                                req.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-green-500'
                                        }>{req.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Select defaultValue={req.status} onValueChange={(val) => handleStatusChange(req.id, val)}>
                                            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                                <SelectItem value="RESOLVED">Resolved</SelectItem>
                                            </SelectContent>
                                        </Select>
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