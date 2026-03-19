"use client"

import { useQuery } from "@tanstack/react-query"
import { getAuditLogs } from "@/lib/api/admin"
import { columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AuditLogsPage() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["audit-logs"],
        queryFn: () => getAuditLogs(0, 100),
    })

    if (isError) {
        return (
            <div className="flex items-center justify-center h-[50vh] text-destructive">
                Failed to load audit logs. Ensure you have Super Admin permissions.
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">System Audit Logs</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Activity Trail</CardTitle>
                    <CardDescription>
                        A chronological record of all mutations across the platform.
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