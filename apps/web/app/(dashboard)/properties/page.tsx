"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/axios"
import { columns, Property } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { CreatePropertyDialog } from "@/components/properties/create-property-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PropertiesPage() {
    // Replaced manual useState/useEffect with React Query
    const { data: properties, isLoading, error } = useQuery({
        queryKey: ['properties'],
        queryFn: async () => {
            const response = await api.get('/properties');
            return response.data.data as Property[];
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Properties</h2>
                    <p className="text-muted-foreground">Manage your physical buildings and locations.</p>
                </div>
                {/* The onSuccess prop is removed because CreatePropertyDialog 
                  now uses queryClient.invalidateQueries() internally!
                */}
                <CreatePropertyDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Portfolio Overview</CardTitle>
                    <CardDescription>A list of all active properties in your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="h-24 flex items-center justify-center text-muted-foreground">
                            Loading properties...
                        </div>
                    ) : error ? (
                        <div className="h-24 flex items-center justify-center text-red-500">
                            Failed to load properties.
                        </div>
                    ) : (
                        <DataTable columns={columns} data={properties || []} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}