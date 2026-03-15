"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export type Unit = {
    id: string
    name: string
    type: string
    status: string
    rentAmount: number
    property: {
        name: string
    }
}

export const columns: ColumnDef<Unit>[] = [
    {
        id: "propertyName",
        accessorFn: (row) => row.property?.name || "Unknown Property",
        header: "Property",
    },
    {
        accessorKey: "name",
        header: "Unit",
    },
    {
        accessorKey: "rentAmount",
        header: "Rent (KES)",
        cell: ({ row }) => {
            // Divide by 100 because we stored it as cents in the DB!
            const amountInKes = row.getValue<number>("rentAmount") / 100;
            return `KES ${amountInKes.toLocaleString()}`;
        }
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue<string>("status");
            return (
                <Badge variant={status === 'VACANT' ? 'default' : 'secondary'}>
                    {status}
                </Badge>
            )
        }
    },
]