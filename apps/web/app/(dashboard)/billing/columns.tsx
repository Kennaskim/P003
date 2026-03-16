"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Smartphone, Loader2 } from "lucide-react"
import { api } from "@/lib/axios"
import { toast } from "sonner"

export type Invoice = {
    id: string
    amount: number // In Cents
    dueDate: string
    isPaid: boolean
    lateFeeApplied: number
    rentalAgreement: {
        renter: { firstName: string; lastName: string; phone: string }
        unit: { name: string; property: { name: string } }
    }
}

// ✅ Smart component to handle the API call directly from the table row
const StkPushAction = ({ invoice }: { invoice: Invoice }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handlePush = async () => {
        setIsLoading(true);
        try {
            // Send the exact payload the backend expects
            const payload = {
                invoiceId: invoice.id,
                phone: invoice.rentalAgreement.renter.phone,
                amount: invoice.amount // Already in integer cents!
            };

            const response = await api.post('/mpesa/stkpush', payload);

            if (response.data.success) {
                toast.success(`Payment prompt sent to ${invoice.rentalAgreement.renter.phone}!`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to trigger M-Pesa prompt.");
        } finally {
            setIsLoading(false);
        }
    };

    if (invoice.isPaid) return <span className="text-sm text-muted-foreground mr-4">Settled</span>;

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handlePush}
            disabled={isLoading}
            className="text-green-700 border-green-200 hover:bg-green-50 mr-2"
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
                <Smartphone className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Sending..." : "STK Push"}
        </Button>
    );
};

export const columns: ColumnDef<Invoice>[] = [
    {
        id: "tenant",
        accessorFn: (row) => `${row.rentalAgreement.renter.firstName} ${row.rentalAgreement.renter.lastName}`,
        header: "Tenant",
    },
    {
        id: "unit",
        accessorFn: (row) => `${row.rentalAgreement.unit.property.name} - ${row.rentalAgreement.unit.name}`,
        header: "Property / Unit",
    },
    {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount (KES)</div>,
        cell: ({ row }) => {
            // Safely convert back to readable KES
            const amountInKes = row.getValue<number>("amount") / 100;
            return <div className="text-right font-medium">
                {new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(amountInKes)}
            </div>
        }
    },
    {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => new Date(row.getValue<string>("dueDate")).toLocaleDateString('en-KE')
    },
    {
        accessorKey: "isPaid",
        header: "Status",
        cell: ({ row }) => {
            const isPaid = row.getValue<boolean>("isPaid");
            return (
                <Badge variant={isPaid ? "default" : "destructive"}>
                    {isPaid ? "Paid" : "Unpaid"}
                </Badge>
            )
        }
    },
    {
        id: "actions",
        header: () => <div className="text-right">Payment Action</div>,
        cell: ({ row }) => {
            return (
                <div className="flex justify-end items-center">
                    {/* Render the smart STK push button */}
                    <StkPushAction invoice={row.original} />
                </div>
            )
        }
    }
]