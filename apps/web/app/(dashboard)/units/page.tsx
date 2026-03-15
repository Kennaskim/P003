"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { CreateUnitDialog } from "@/components/units/create-unit-dialog";
import { DataTable } from "@/components/ui/data-table";
import { columns, Unit } from "./columns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Property {
    id: string;
    name: string;
}

export default function UnitsPage() {
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

    // 1. Fetch properties to populate the dropdown filter
    const { data: properties, isLoading: propertiesLoading } = useQuery({
        queryKey: ['properties'],
        queryFn: async () => {
            const response = await api.get('/properties');
            return response.data.data as Property[];
        },
    });

    // Auto-select the first property when the data loads
    useEffect(() => {
        if (properties && properties.length > 0 && !selectedPropertyId) {
            setSelectedPropertyId(properties[0]!.id);
        }
    }, [properties, selectedPropertyId]);

    // 2. Fetch units ONLY for the currently selected property
    const { data: units, isLoading: unitsLoading } = useQuery({
        // Notice we include the selectedPropertyId in the queryKey so it refetches automatically when it changes!
        queryKey: ['units', selectedPropertyId],
        queryFn: async () => {
            const response = await api.get(`/units/property/${selectedPropertyId}`);
            return response.data.data as Unit[];
        },
        enabled: !!selectedPropertyId, // Prevent fetching until a property is selected
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Units</h1>
                    <p className="text-muted-foreground">
                        Manage individual spaces within your properties.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Select
                        value={selectedPropertyId}
                        onValueChange={setSelectedPropertyId}
                        disabled={propertiesLoading || properties?.length === 0}
                    >
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select a property to view units" />
                        </SelectTrigger>
                        <SelectContent>
                            {properties?.length === 0 ? (
                                <SelectItem value="none" disabled>No properties found</SelectItem>
                            ) : (
                                properties?.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>

                    {/* Notice we removed onSuccess because React Query handles the refresh automatically now */}
                    <CreateUnitDialog properties={properties || []} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Unit Roster</CardTitle>
                    <CardDescription>
                        All rentable units and their current status for the selected property.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {propertiesLoading ? (
                        <div className="h-24 flex items-center justify-center text-muted-foreground">
                            Loading properties...
                        </div>
                    ) : !selectedPropertyId ? (
                        <div className="h-24 flex items-center justify-center text-muted-foreground border border-dashed rounded-md">
                            Please create a property first.
                        </div>
                    ) : unitsLoading ? (
                        <div className="h-24 flex items-center justify-center text-muted-foreground">
                            Loading units...
                        </div>
                    ) : (
                        // 3. Render the reusable data table!
                        <DataTable columns={columns} data={units || []} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}