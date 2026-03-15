"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const agreementSchema = z.object({
    propertyId: z.string().optional(),
    unitId: z.string().min(1, "Please select a unit"),
    renterId: z.string().min(1, "Please select a renter"),
    startDate: z.string().min(1, "Start date is required"),
    rentAmount: z.number().min(1, "Rent amount is required"),
    deposit: z.number().min(0, "Deposit cannot be negative"),
});

interface Props {
    units: { id: string; name: string; property: { name: string } }[];
    renters: { id: string; firstName: string; lastName: string }[];
}

export function CreateAgreementDialog({ units, renters }: Props) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const queryClient = useQueryClient();

    const today = new Date().toISOString().split('T')[0];

    const form = useForm<z.infer<typeof agreementSchema>>({
        resolver: zodResolver(agreementSchema),
        defaultValues: {
            propertyId: "",
            unitId: "",
            renterId: "",
            startDate: today,
            rentAmount: 0,
            deposit: 0,
        },
    });

    async function onSubmit(values: z.infer<typeof agreementSchema>) {
        setIsLoading(true);
        try {
            const payload = {
                unitId: values.unitId,
                renterId: values.renterId,
                startDate: `${values.startDate}T00:00:00.000Z`,
                rentAmount: Math.floor(values.rentAmount * 100),
                deposit: Math.floor(values.deposit * 100),
            };

            const response = await api.post("/rental-agreements", payload);

            if (response.data.success) {
                toast.success("Rental Agreement created!");
                form.reset();
                setOpen(false);
                queryClient.invalidateQueries({ queryKey: ['agreements'] });
                queryClient.invalidateQueries({ queryKey: ['units'] });
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
                <Button disabled={units.length === 0 || renters.length === 0}>
                    <Plus className="mr-2 h-4 w-4" /> New Agreement
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Renter to Unit</DialogTitle>
                    <DialogDescription>Create a new monthly rental agreement.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="unitId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Select Vacant Unit</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Choose a unit" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {units.map((u) => (
                                                <SelectItem key={u.id} value={u.id}>
                                                    {u.property?.name || "Unknown"} - Unit {u.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="renterId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Select Renter</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Choose a renter" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {renters.map((r) => (
                                                <SelectItem key={r.id} value={r.id}>
                                                    {r.firstName} {r.lastName}
                                                </SelectItem>
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
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
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
                                        <FormLabel>Rent (KES)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="deposit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deposit (KES)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
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