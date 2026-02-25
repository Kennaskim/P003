"use client";

import { useState } from "react";
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
import { Plus } from "lucide-react";
import { toast } from "sonner";

const unitSchema = z.object({
    propertyId: z.string().uuid("Please select a property"),
    name: z.string().min(1, "Unit name is required"),
    rentAmount: z.number({ message: "Rent must be a number" }).int().min(0, "Rent cannot be negative"),
});

interface CreateUnitDialogProps {
    properties: { id: string; name: string }[];
    onSuccess: () => void;
    defaultPropertyId?: string;
}

export function CreateUnitDialog({ properties, onSuccess, defaultPropertyId }: CreateUnitDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof unitSchema>>({
        resolver: zodResolver(unitSchema),
        defaultValues: {
            propertyId: defaultPropertyId || "",
            name: "",
            rentAmount: 0
        },
    });

    async function onSubmit(values: z.infer<typeof unitSchema>) {
        setIsLoading(true);
        try {
            const response = await api.post("/units", values);
            if (response.data.success) {
                toast.success("Unit created successfully!");
                form.reset();
                setOpen(false);
                onSuccess();
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
                    <DialogDescription>
                        Create a rentable space within a property.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="propertyId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Property</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a property" />
                                            </SelectTrigger>
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
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unit Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Bedsitter 4, A1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="rentAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rent Amount (KES)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="15000" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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