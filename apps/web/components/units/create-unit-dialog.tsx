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

const unitSchema = z.object({
    propertyId: z.string().uuid("Please select a property"),
    name: z.string().min(1, "Unit name is required"),
    rentAmount: z.number().min(1, "Rent cannot be zero"),
});

interface CreateUnitDialogProps {
    properties: { id: string; name: string }[];
}

export function CreateUnitDialog({ properties }: CreateUnitDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof unitSchema>>({
        resolver: zodResolver(unitSchema),
        defaultValues: {
            propertyId: "",
            name: "",
            rentAmount: 0,
        },
    });

    async function onSubmit(values: z.infer<typeof unitSchema>) {
        setIsLoading(true);
        try {
            const payload = {
                ...values,
                rentAmount: Math.floor(values.rentAmount * 100), // Cents conversion
            };

            const response = await api.post("/units", payload);

            if (response.data.success) {
                toast.success("Unit created successfully!");
                form.reset();
                setOpen(false);
                queryClient.invalidateQueries({ queryKey: ['units'] });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create unit");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button disabled={properties.length === 0}>
                    <Plus className="mr-2 h-4 w-4" /> Add Unit
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Unit</DialogTitle>
                    <DialogDescription>Create a rentable space within a property.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                            control={form.control}
                            name="propertyId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Property</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a property" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {properties.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem><FormLabel>Unit Name</FormLabel><FormControl><Input placeholder="e.g. A1" {...field} /></FormControl><FormMessage /></FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="rentAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rent (KES)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="15000"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save Unit"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}