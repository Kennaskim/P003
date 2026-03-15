"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export type Renter = {
    id: string
    firstName: string
    lastName: string
    phone: string
    nationalId: string
    status: string
}

export const columns: ColumnDef<Renter>[] = [
    {
        id: "fullName",
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        header: "Full Name",
    },
    {
        accessorKey: "phone",
        header: "Phone Number",
    },
    {
        accessorKey: "nationalId",
        header: "National ID",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue<string>("status");
            return (
                <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {status}
                </Badge>
            )
        }
    },
]