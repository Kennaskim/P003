"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/axios"
import { UploadDocumentDialog } from "@/components/documents/upload-document-dialog"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { columns, DocumentType } from "./columns"

export default function DocumentsPage() {
    const { data: documents, isLoading, error } = useQuery({
        queryKey: ['documents'],
        queryFn: async () => {
            const response = await api.get('/files');
            return response.data.data as DocumentType[];
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
                    <p className="text-muted-foreground">Manage leases, ID copies, and property files.</p>
                </div>
                <UploadDocumentDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Files</CardTitle>
                    <CardDescription>All uploaded files tied to your tenant account.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="h-24 flex items-center justify-center text-muted-foreground">Loading documents...</div>
                    ) : error ? (
                        <div className="h-24 flex items-center justify-center text-red-500">Failed to load documents.</div>
                    ) : (
                        <DataTable columns={columns} data={documents || []} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}