"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/axios"
import { toast } from "sonner"

export type DocumentType = {
    id: string
    name: string
    fileType: string
    size: number
    createdAt: string
}

const handleSecureDownload = async (id: string) => {
    try {
        const response = await api.get(`/files/${id}/download`);
        if (response.data.success) {
            window.open(response.data.data.url, "_blank");
        }
    } catch (error) {
        toast.error("Failed to securely fetch document.");
    }
};

export const columns: ColumnDef<DocumentType>[] = [
    {
        accessorKey: "name",
        header: "File Name",
        cell: ({ row }) => {
            const fileType = row.getValue<string>("fileType");
            return (
                <div className="flex items-center gap-2 font-medium">
                    {fileType?.includes("image") ? (
                        <ImageIcon className="h-4 w-4 text-blue-400" />
                    ) : (
                        <FileText className="h-4 w-4 text-red-400" />
                    )}
                    <span className="truncate max-w-[250px]">{row.getValue("name")}</span>
                </div>
            )
        }
    },
    {
        accessorKey: "fileType",
        header: "Type",
        cell: ({ row }) => (
            <span className="text-muted-foreground text-sm">
                {row.getValue<string>("fileType")?.split("/")[1]?.toUpperCase() || "FILE"}
            </span>
        )
    },
    {
        accessorKey: "size",
        header: "Size",
        cell: ({ row }) => {
            const bytes = row.getValue<number>("size");
            const mb = (bytes / (1024 * 1024)).toFixed(2);
            return <span className="text-muted-foreground text-sm">{mb} MB</span>;
        }
    },
    {
        accessorKey: "createdAt",
        header: "Uploaded",
        cell: ({ row }) => (
            <span className="text-muted-foreground text-sm">
                {new Date(row.getValue<string>("createdAt")).toLocaleDateString('en-KE')}
            </span>
        )
    },
    {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => {
            return (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSecureDownload(row.original.id)}
                    >
                        <Download className="h-4 w-4 mr-2" /> View / Download
                    </Button>
                </div>
            )
        }
    }
]