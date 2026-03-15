"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export type Invoice = {
    id: string
    amount: number
    dueDate: string
    isPaid: boolean
    lateFeeApplied: number
    rentalAgreement: {
        renter: { firstName: string; lastName: string }
        unit: { name: string; property: { name: string } }
    }
}

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
]