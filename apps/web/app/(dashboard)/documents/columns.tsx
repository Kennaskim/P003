"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ExternalLink, FileText, Image as ImageIcon, FileArchive, Trash2 } from "lucide-react"
import { Document, deleteDocument } from "@/lib/api/documents"
import { api } from "@/lib/axios"
import { toast } from "sonner"

// Helper to format bytes into readable sizes (KB, MB)
const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
        await deleteDocument(id);
        toast.success("Document deleted.");
        window.location.reload();
    } catch {
        toast.error("Failed to delete document.");
    }
};

const handleView = async (id: string) => {
    try {
        const response = await api.get(`/files/${id}/download`);
        if (response.data.success && response.data.data.url) {
            window.open(response.data.data.url, "_blank");
        }
    } catch {
        toast.error("Failed to retrieve document link.");
    }
};

export const columns: ColumnDef<Document>[] = [
    {
        accessorKey: "name",
        header: "File Name",
        cell: ({ row }) => {
            const type = row.original.fileType.toLowerCase();
            let Icon = FileText;
            if (type.includes("image")) Icon = ImageIcon;
            if (type.includes("zip") || type.includes("tar")) Icon = FileArchive;

            return (
                <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium truncate max-w-[250px]" title={row.getValue("name")}>
                        {row.getValue("name")}
                    </span>
                </div>
            )
        },
    },
    {
        accessorKey: "entityType",
        header: "Category",
        cell: ({ row }) => {
            const category = (row.getValue("entityType") as string) || "OTHER";
            return <Badge variant="secondary">{category.replace("_", " ")}</Badge>;
        },
    },
    {
        accessorKey: "size",
        header: "Size",
        cell: ({ row }) => <span className="text-muted-foreground">{formatBytes(row.getValue("size"))}</span>,
    },
    {
        accessorKey: "createdAt",
        header: "Uploaded On",
        cell: ({ row }) => format(new Date(row.getValue("createdAt")), "MMM d, yyyy"),
    },
    {
        id: "actions",
        cell: ({ row }) => {
            return (
                <div className="flex justify-end items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleView(row.original.id)}>
                        <ExternalLink className="h-4 w-4 mr-1" /> View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row.original.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            )
        },
    },
]