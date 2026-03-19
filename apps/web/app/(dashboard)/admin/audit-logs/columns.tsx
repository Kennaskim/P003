"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { AuditLog } from "@/lib/api/admin"

export const columns: ColumnDef<AuditLog>[] = [
    {
        accessorKey: "createdAt",
        header: "Timestamp",
        cell: ({ row }) => {
            return <span>{format(new Date(row.getValue("createdAt")), "MMM d, yyyy HH:mm:ss")}</span>
        },
    },
    {
        accessorKey: "user.email",
        header: "User",
        cell: ({ row }) => {
            const email = row.original.user?.email || "System";
            const role = row.original.user?.role || "";
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{email}</span>
                    <span className="text-xs text-muted-foreground">{role}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => {
            const action: string = row.getValue("action");
            let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";

            if (action.includes("CREATE") || action.includes("LOGIN")) variant = "default";
            if (action.includes("DELETE") || action.includes("REMOVE")) variant = "destructive";
            if (action.includes("UPDATE") || action.includes("EDIT")) variant = "outline";

            return <Badge variant={variant}>{action.replace(/_/g, " ")}</Badge>
        },
    },
    {
        accessorKey: "entityType",
        header: "Entity",
        cell: ({ row }) => {
            const type = row.original.entityType;
            const id = row.original.entityId;
            if (!type) return <span className="text-muted-foreground">-</span>;
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{type}</span>
                    {id && <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={id}>{id}</span>}
                </div>
            )
        },
    },
    {
        accessorKey: "ipAddress",
        header: "IP Address",
    },
]