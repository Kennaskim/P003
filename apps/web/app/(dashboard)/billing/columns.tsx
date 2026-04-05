"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Smartphone,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    MoreHorizontal,
    PlusCircle
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { RecordPaymentDialog } from "@/components/billing/record-payment-dialog"
import { api } from "@/lib/axios"
import { toast } from "sonner"
import { usePaymentStatus } from "@/hooks/usePaymentStatus"

export type Invoice = {
    id: string
    amount: number // In KES integers (e.g., 15000 = KES 15,000)
    dueDate: string
    isPaid: boolean
    lateFeeApplied: number
    rentalAgreement: {
        renter: { firstName: string; lastName: string; phone: string }
        unit: { name: string; property: { name: string } }
    }
}

const StkPushAction = ({ invoice }: { invoice: Invoice }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { status: paymentStatus, startPolling } = usePaymentStatus();

    const handlePush = async () => {
        setIsLoading(true);
        try {
            const payload = {
                rentInvoiceId: invoice.id,
                phone: invoice.rentalAgreement.renter.phone,
                amount: invoice.amount,
            };

            const response = await api.post('/mpesa/stk-push', payload);

            if (response.data.success) {
                toast.success(`Payment prompt sent to ${invoice.rentalAgreement.renter.phone}!`);

                // Start polling for payment confirmation
                const checkoutRequestId = response.data.data?.CheckoutRequestID;
                if (checkoutRequestId) {
                    startPolling(checkoutRequestId);
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to trigger M-Pesa prompt.");
        } finally {
            setIsLoading(false);
        }
    };

    if (invoice.isPaid) return <span className="text-sm text-muted-foreground mr-4">Settled</span>;

    // Show payment polling status
    if (paymentStatus === 'polling') {
        return (
            <div className="flex items-center gap-2 text-sm text-amber-600 mr-2">
                <Clock className="h-4 w-4 animate-pulse" />
                <span>Check your phone…</span>
            </div>
        );
    }

    if (paymentStatus === 'completed') {
        return (
            <div className="flex items-center gap-2 text-sm text-green-600 mr-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Payment confirmed!</span>
            </div>
        );
    }

    if (paymentStatus === 'failed') {
        return (
            <div className="flex items-center gap-2 text-sm text-red-600 mr-2">
                <XCircle className="h-4 w-4" />
                <span>Payment failed</span>
            </div>
        );
    }

    if (paymentStatus === 'timeout') {
        return (
            <div className="flex items-center gap-2 mr-2">
                <span className="text-sm text-gray-500">Timed out</span>
                <Button variant="outline" size="sm" onClick={handlePush} className="text-green-700 border-green-200 hover:bg-green-50">
                    Retry
                </Button>
            </div>
        );
    }

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

// New composite component handling both STK Push and the Manual Payment Dropdown Menu
const InvoiceRowActions = ({ invoice }: { invoice: Invoice }) => {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    return (
        <div className="flex justify-end items-center gap-2">
            <StkPushAction invoice={invoice} />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(invoice.id)}>
                        Copy Invoice ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />

                    {/* Only show Record Payment if the invoice is NOT already paid */}
                    {!invoice.isPaid && (
                        <DropdownMenuItem
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="text-green-600 font-medium cursor-pointer"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Record Payment
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem>View Details</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <RecordPaymentDialog
                invoiceId={invoice.id}
                defaultAmount={invoice.amount}
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
            />
        </div>
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
            // Amount is stored as KES integers (e.g., 15000 = KES 15,000)
            const amount = row.getValue<number>("amount");
            return <div className="text-right font-medium">
                {new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(amount)}
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
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => <InvoiceRowActions invoice={row.original} />
    }
]