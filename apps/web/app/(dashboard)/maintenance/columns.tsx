"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { MaintenanceRequest } from "@/lib/api/maintenance"

export const columns: ColumnDef<MaintenanceRequest>[] = [
    {
        accessorKey: "createdAt",
        header: "Date Logged",
        cell: ({ row }) => format(new Date(row.getValue("createdAt")), "MMM d, yyyy"),
    },
    {
        id: "location",
        header: "Property / Unit",
        cell: ({ row }) => {
            const unitName = row.original.unit?.name || "Unknown Unit";
            const propName = row.original.unit?.property?.name || "Unknown Property";
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{unitName}</span>
                    <span className="text-xs text-muted-foreground">{propName}</span>
                </div>
            );
        },
    },
    {
        accessorKey: "category",
        header: "Category",
    },
    {
        accessorKey: "description",
        header: "Issue Description",
        cell: ({ row }) => (
            <div className="max-w-[250px] truncate" title={row.getValue("description")}>
                {row.getValue("description")}
            </div>
        ),
    },
    {
        accessorKey: "urgency",
        header: "Urgency",
        cell: ({ row }) => {
            const urgency = row.getValue("urgency") as string;
            let variant: "default" | "secondary" | "destructive" | "outline" = "outline";

            if (urgency === "CRITICAL") variant = "destructive";
            if (urgency === "HIGH") variant = "default";
            if (urgency === "MEDIUM") variant = "secondary";

            return <Badge variant={variant}>{urgency}</Badge>;
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            let className = "";

            if (status === "SUBMITTED") className = "bg-yellow-100 text-yellow-800 border-yellow-200";
            if (status === "IN_PROGRESS") className = "bg-blue-100 text-blue-800 border-blue-200";
            if (status === "RESOLVED") className = "bg-green-100 text-green-800 border-green-200";

            return <Badge variant="outline" className={className}>{status.replace("_", " ")}</Badge>;
        },
    },
    {
        accessorKey: "assignedToName",
        header: "Assigned To",
        cell: ({ row }) => row.getValue("assignedToName") || <span className="text-muted-foreground">Unassigned</span>,
    },
    {
        accessorKey: "cost",
        header: "Cost (KES)",
        cell: ({ row }) => {
            const cost = row.getValue("cost") as number;
            if (!cost) return "-";
            return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(cost);
        },
    },
]