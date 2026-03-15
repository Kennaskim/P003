"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

// Shape of the data coming from your NestJS backend
export type Property = {
    id: string
    name: string
    address: string
    type: string
    _count: {
        units: number
    }
}

export const columns: ColumnDef<Property>[] = [
    {
        accessorKey: "name",
        header: "Property Name",
    },
    {
        accessorKey: "address",
        header: "Address",
    },
    {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
            return <Badge variant="outline">{row.getValue("type")}</Badge>
        }
    },
    {
        accessorKey: "_count.units",
        header: "Total Units",
    },
]