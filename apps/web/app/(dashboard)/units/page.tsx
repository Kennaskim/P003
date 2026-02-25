"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/axios";
import { CreateUnitDialog } from "@/components/units/create-unit-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Home, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Property {
    id: string;
    name: string;
}

interface Unit {
    id: string;
    name: string;
    rentAmount: number;
    status: "VACANT" | "RESERVED" | "OCCUPIED" | "VACATING" | "MAINTENANCE";
}

// Kenya Shilling Formatter
const formatKES = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 0, // No cents needed for standard rent display
    }).format(amount);
};

export default function UnitsPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    // 1. Fetch properties on mount to populate the dropdown
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const response = await api.get("/properties");
                if (response.data.success && response.data.data.length > 0) {
                    setProperties(response.data.data);
                    setSelectedPropertyId(response.data.data[0].id); // Auto-select first property
                }
            } catch (error) {
                console.error("Failed to fetch properties", error);
            }
        };
        fetchProperties();
    }, []);

    // 2. Fetch units whenever the selected property changes
    const fetchUnits = useCallback(async (propertyId: string) => {
        if (!propertyId) return;
        try {
            setIsLoading(true);
            const response = await api.get(`/units/property/${propertyId}`);
            if (response.data.success) {
                setUnits(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch units", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUnits(selectedPropertyId);
    }, [selectedPropertyId, fetchUnits]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Units</h1>
                    <p className="text-muted-foreground">
                        Manage individual spaces within your properties.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select a property to view units" />
                        </SelectTrigger>
                        <SelectContent>
                            {properties.length === 0 ? (
                                <SelectItem value="none" disabled>No properties found</SelectItem>
                            ) : (
                                properties.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>

                    <CreateUnitDialog
                        properties={properties}
                        defaultPropertyId={selectedPropertyId}
                        onSuccess={() => fetchUnits(selectedPropertyId)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Unit Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Rent Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    Loading units...
                                </TableCell>
                            </TableRow>
                        ) : !selectedPropertyId ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                    Please create a property first.
                                </TableCell>
                            </TableRow>
                        ) : units.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                    No units found in this property. Click "Add Unit".
                                </TableCell>
                            </TableRow>
                        ) : (
                            units.map((unit) => (
                                <TableRow key={unit.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Home className="h-4 w-4 text-gray-400" />
                                        {unit.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={unit.status === "VACANT" ? "outline" : "default"}
                                            className={unit.status === "VACANT" ? "bg-green-50 text-green-700 border-green-200" : ""}>
                                            {unit.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        <div className="flex items-center justify-end gap-1">
                                            <Tag className="h-3 w-3 text-muted-foreground" />
                                            {formatKES(unit.rentAmount)}
                                        </div>
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