"use client"

import { useQuery } from "@tanstack/react-query"
import { getDocuments } from "@/lib/api/documents"
import { columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { UploadDocumentDialog } from "@/components/documents/upload-document-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function DocumentsPage() {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["documents"],
        queryFn: getDocuments,
    })

    if (isError) {
        return (
            <div className="flex items-center justify-center h-[50vh] text-destructive">
                Failed to load documents.
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
                    <p className="text-muted-foreground">Manage digital copies of IDs, agreements, and receipts.</p>
                </div>

                <UploadDocumentDialog onSuccess={refetch} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>File Library</CardTitle>
                    <CardDescription>
                        All documents associated with your properties and renters.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <DataTable columns={columns} data={data?.data || []} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}