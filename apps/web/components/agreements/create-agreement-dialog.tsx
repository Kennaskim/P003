"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FileSignature } from "lucide-react";
import { toast } from "sonner";

const agreementSchema = z.object({
    propertyId: z.string().min(1, "Please select a property"), // Used for UI filtering only
    unitId: z.string().uuid("Please select a unit"),
    renterId: z.string().uuid("Please select a renter"),
    startDate: z.string().min(1, "Start date is required"),
    rentAmount: z.number().int().min(0, "Rent cannot be negative"),
    deposit: z.number().int().min(0, "Deposit cannot be negative"),
});

interface CreateAgreementDialogProps {
    onSuccess: () => void;
}

export function CreateAgreementDialog({ onSuccess }: CreateAgreementDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Data states for dropdowns
    const [properties, setProperties] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [renters, setRenters] = useState<any[]>([]);

    type AgreementFormValues = z.infer<typeof agreementSchema>;
    const form = useForm<AgreementFormValues>({
        resolver: zodResolver(agreementSchema) as any,
        defaultValues: {
            propertyId: "", unitId: "", renterId: "",
            startDate: new Date().toISOString().split('T')[0], // Defaults to today YYYY-MM-DD
            rentAmount: 0, deposit: 0
        },
    });

    // Watch the selected property to fetch its units
    const selectedPropertyId = form.watch("propertyId");

    useEffect(() => {
        if (open) {
            api.get("/properties").then((res) => setProperties(res.data.data));
            api.get("/renters").then((res) => setRenters(res.data.data));
        }
    }, [open]);

    useEffect(() => {
        if (selectedPropertyId) {
            api.get(`/units/property/${selectedPropertyId}`).then((res) => {
                // Only show vacant units
                const vacantUnits = res.data.data.filter((u: any) => u.status === "VACANT");
                setUnits(vacantUnits);
                form.setValue("unitId", ""); // Reset unit selection
            });
        } else {
            setUnits([]);
        }
    }, [selectedPropertyId, form]);

    // When a unit is selected, auto-fill the rent amount
    useEffect(() => {
        const selectedUnitId = form.watch("unitId");
        if (selectedUnitId) {
            const unit = units.find(u => u.id === selectedUnitId);
            if (unit) {
                form.setValue("rentAmount", unit.rentAmount);
            }
        }
    }, [form.watch("unitId"), units, form]);

    async function onSubmit(values: z.infer<typeof agreementSchema>) {
        setIsLoading(true);
        try {
            // We don't send propertyId to the API, so we extract it out
            const { propertyId, ...payload } = values;
            // Convert date string to ISO date for the backend
            const formattedPayload = {
                ...payload,
                startDate: new Date(payload.startDate).toISOString(),
            };

            const response = await api.post("/rental-agreements", formattedPayload);
            if (response.data.success) {
                toast.success("Rental agreement created!");
                form.reset();
                setOpen(false);
                onSuccess();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create agreement");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <FileSignature className="mr-2 h-4 w-4" /> New Agreement
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Rental Agreement</DialogTitle>
                    <DialogDescription>
                        Assign a renter to a vacant unit and lock in their monthly rent.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="propertyId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Property</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {properties.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="unitId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vacant Unit</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedPropertyId}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {units.length === 0 ? (
                                                    <SelectItem value="none" disabled>No vacant units</SelectItem>
                                                ) : (
                                                    units.map((u) => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="renterId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Renter</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a renter" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {renters.filter(r => r.status === "ACTIVE").map((r) => (
                                                <SelectItem key={r.id} value={r.id}>{r.firstName} {r.lastName} - {r.phone}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="rentAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monthly Rent (KES)</FormLabel>
                                        <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="deposit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Security Deposit (KES)</FormLabel>
                                        <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Create Agreement"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}