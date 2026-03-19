"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/axios";
import { CreateMaintenanceDialog } from "@/components/maintenance/create-maintenance-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function MaintenancePage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // State for the Update Dialog
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [updateForm, setUpdateForm] = useState({ status: "", assignedToName: "", cost: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const openUpdateDialog = (req: any) => {
        setUpdatingId(req.id);
        setUpdateForm({
            status: req.status || "SUBMITTED",
            assignedToName: req.assignedToName || "",
            cost: req.cost ? req.cost.toString() : "",
        });
    };

    const handleUpdateSubmit = async () => {
        if (!updatingId) return;
        try {
            setIsSubmitting(true);
            const payload = {
                status: updateForm.status,
                assignedToName: updateForm.assignedToName || null,
                cost: updateForm.cost ? parseInt(updateForm.cost, 10) : null,
            };

            await api.patch(`/maintenance/${updatingId}`, payload);
            toast.success("Maintenance details updated successfully");
            setUpdatingId(null);
            fetchRequests();
        } catch (error) {
            toast.error("Failed to update details");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatKES = (amount: number) => {
        return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(amount || 0);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
                    <p className="text-muted-foreground">Track repairs, assign vendors, and log costs.</p>
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
                            <TableHead>Vendor & Cost</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
                        ) : requests.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No maintenance requests found.</TableCell></TableRow>
                        ) : (
                            requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="font-medium">{req.unit?.property?.name || 'Unknown Property'}</div>
                                        <div className="text-sm text-muted-foreground">Unit: {req.unit?.name || 'Unknown Unit'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{req.category}</div>
                                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">{req.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={
                                            req.urgency === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                                                req.urgency === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''
                                        }>{req.urgency}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={
                                            req.status === 'SUBMITTED' ? 'bg-gray-100 text-gray-800' :
                                                req.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                        }>{req.status?.replace('_', ' ')}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {req.assignedToName ? <span className="font-medium">{req.assignedToName}</span> : <span className="text-muted-foreground italic">Unassigned</span>}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {req.cost ? formatKES(req.cost) : "No cost logged"}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Dialog open={updatingId === req.id} onOpenChange={(isOpen) => !isOpen && setUpdatingId(null)}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={() => openUpdateDialog(req)}>
                                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Update Work Order</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label>Status</Label>
                                                        <Select value={updateForm.status} onValueChange={(val) => setUpdateForm({ ...updateForm, status: val })}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                                                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                                                <SelectItem value="RESOLVED">Resolved</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Assigned To (Vendor / Staff)</Label>
                                                        <Input
                                                            placeholder="e.g. John the Plumber"
                                                            value={updateForm.assignedToName}
                                                            onChange={(e) => setUpdateForm({ ...updateForm, assignedToName: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Repair Cost (KES)</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            value={updateForm.cost}
                                                            onChange={(e) => setUpdateForm({ ...updateForm, cost: e.target.value })}
                                                        />
                                                        <p className="text-xs text-muted-foreground">Leave blank if unresolved or no cost incurred.</p>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setUpdatingId(null)}>Cancel</Button>
                                                    <Button onClick={handleUpdateSubmit} disabled={isSubmitting}>
                                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Details
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
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