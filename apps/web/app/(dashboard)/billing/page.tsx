"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/axios"
import { columns, Invoice } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { CreateInvoiceDialog } from "@/components/billing/create-invoice-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function BillingPage() {
    // 1. Fetch Invoices
    const { data: invoices, isLoading, error } = useQuery({
        queryKey: ['invoices'],
        queryFn: async () => {
            const response = await api.get('/rent-invoices');
            return response.data.data as Invoice[];
        },
    });

    // 2. Fetch Active Agreements for the creation dialog
    const { data: agreements = [] } = useQuery({
        queryKey: ['agreements'],
        queryFn: async () => {
            const response = await api.get('/rental-agreements');
            return response.data.data;
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Billing & Invoices</h2>
                    <p className="text-muted-foreground">Manage rent collection and track pending payments.</p>
                </div>
                <CreateInvoiceDialog agreements={agreements} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Invoice Ledger</CardTitle>
                    <CardDescription>A comprehensive history of all issued bills.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="h-24 flex items-center justify-center text-muted-foreground">
                            Loading invoices...
                        </div>
                    ) : error ? (
                        <div className="h-24 flex items-center justify-center text-red-500">
                            Failed to load invoices.
                        </div>
                    ) : (
                        <DataTable columns={columns} data={invoices || []} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}