"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/axios";
import { CreatePropertyDialog } from "@/components/properties/create-property-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Building, MapPin } from "lucide-react";

// Define our TypeScript interface mapping to the backend Prisma model
interface Property {
    id: string;
    name: string;
    address: string;
    type: string;
    _count?: {
        units: number;
    };
}

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProperties = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get("/properties");
            if (response.data.success) {
                setProperties(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch properties", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Properties</h1>
                    <p className="text-muted-foreground">
                        Manage your buildings and estates.
                    </p>
                </div>
                <CreatePropertyDialog onSuccess={fetchProperties} />
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Property Name</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Total Units</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Loading properties...
                                </TableCell>
                            </TableRow>
                        ) : properties.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No properties found. Click "Add Property" to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            properties.map((property) => (
                                <TableRow key={property.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Building className="h-4 w-4 text-gray-400" />
                                        {property.name}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            {property.address}
                                        </div>
                                    </TableCell>
                                    <TableCell>{property.type}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        {property._count?.units || 0}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}