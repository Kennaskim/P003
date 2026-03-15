"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { CreateInvoiceDialog } from "@/components/billing/create-invoice-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";

// 1. Format KES by dividing the DB cents by 100
const formatKES = (amountInCents: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(amountInCents / 100);
};

export default function BillingPage() {
    const [processingId, setProcessingId] = useState<string | null>(null);

    // 2. Fetch Invoices via React Query
    const { data: invoices = [], isLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: async () => {
            const response = await api.get("/rent-invoices");
            return response.data.data;
        }
    });

    const handleMpesaPush = async (invoiceId: string, phone: string, amountInCents: number) => {
        setProcessingId(invoiceId);
        try {
            // amountInCents is passed exactly as stored in the DB, matching your M-Pesa backend DTO
            const response = await api.post("/mpesa/stk-push", {
                rentInvoiceId: invoiceId,
                phone: phone,
                amount: amountInCents,
            });

            if (response.data.success) {
                toast.success(`M-Pesa STK Push sent to ${phone}`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to initiate M-Pesa payment");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Billing & Invoices</h1>
                    <p className="text-muted-foreground">
                        Manage rent collection and trigger M-Pesa payments.
                    </p>
                </div>
                {/* 3. Removed onSuccess prop, React Query handles this globally now */}
                <CreateInvoiceDialog />
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tenant & Unit</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Loading invoices...</TableCell>
                            </TableRow>
                        ) : invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No invoices found. Click "Generate Invoice" to bill a tenant.
                                </TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((invoice: any) => (
                                <TableRow key={invoice.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {invoice.rentalAgreement.renter.firstName} {invoice.rentalAgreement.renter.lastName}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                Unit: {invoice.rentalAgreement.unit.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(invoice.dueDate).toLocaleDateString('en-KE')}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {/* Apply the math fix here */}
                                        {formatKES(invoice.amount)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={invoice.isPaid ? "default" : "destructive"}
                                            className={invoice.isPaid ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                                        >
                                            {invoice.isPaid ? "PAID" : "UNPAID"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {!invoice.isPaid && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                                disabled={processingId === invoice.id}
                                                onClick={() => handleMpesaPush(
                                                    invoice.id,
                                                    invoice.rentalAgreement.renter.phone,
                                                    invoice.amount
                                                )}
                                            >
                                                <Send className="mr-2 h-4 w-4" />
                                                {processingId === invoice.id ? "Sending..." : "STK Push"}
                                            </Button>
                                        )}
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