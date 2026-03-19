"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Wrench, Loader2 } from "lucide-react";
import { toast } from "sonner";

const maintenanceSchema = z.object({
    unitId: z.string().uuid("Please select a unit"),
    category: z.string().min(1, "Category is required"),
    description: z.string().min(5, "Please provide more details"),
    urgency: z.string().min(1, "Urgency is required"),
    assignedToName: z.string().optional(),
    cost: z.string().optional(),
});

export function CreateMaintenanceDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [properties, setProperties] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [selectedProperty, setSelectedProperty] = useState("");

    const form = useForm<z.infer<typeof maintenanceSchema>>({
        resolver: zodResolver(maintenanceSchema),
        defaultValues: { unitId: "", category: "", description: "", urgency: "MEDIUM", assignedToName: "", cost: "" },
    });

    useEffect(() => {
        if (open) {
            api.get("/properties").then(res => setProperties(res.data.data));
        }
    }, [open]);

    useEffect(() => {
        if (selectedProperty) {
            api.get(`/units/property/${selectedProperty}`).then(res => {
                setUnits(res.data.data);
                form.setValue("unitId", ""); // Reset unit when property changes
            });
        } else {
            setUnits([]);
        }
    }, [selectedProperty, form]);

    async function onSubmit(values: z.infer<typeof maintenanceSchema>) {
        setIsLoading(true);
        try {
            // Clean up the payload before sending to the backend
            const payload = {
                ...values,
                assignedToName: values.assignedToName || undefined,
                cost: values.cost ? parseInt(values.cost, 10) : undefined,
            };

            await api.post("/maintenance", payload);
            toast.success("Maintenance request logged.");
            form.reset();
            setOpen(false);
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to log request");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Wrench className="mr-2 h-4 w-4" /> Log Issue</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Log Maintenance Request</DialogTitle>
                    <DialogDescription>Fill out the details below to log a new issue for your property.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 pt-2">
                                <Label>Property</Label>
                                <Select onValueChange={setSelectedProperty} value={selectedProperty}>
                                    <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                                    <SelectContent>
                                        {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <FormField
                                control={form.control}
                                name="unitId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedProperty}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Plumbing">Plumbing</SelectItem>
                                                <SelectItem value="Electrical">Electrical</SelectItem>
                                                <SelectItem value="Carpentry">Carpentry</SelectItem>
                                                <SelectItem value="General">General</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="urgency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Urgency</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {/* Standardized to uppercase to match UI badges */}
                                                <SelectItem value="CRITICAL">Critical</SelectItem>
                                                <SelectItem value="HIGH">High</SelectItem>
                                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                                <SelectItem value="LOW">Low</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl><Textarea placeholder="Describe the issue..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                            <FormField
                                control={form.control}
                                name="assignedToName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-muted-foreground">Vendor (Optional)</FormLabel>
                                        <FormControl><Input placeholder="e.g. John Plumber" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-muted-foreground">Cost in KES (Optional)</FormLabel>
                                        <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isLoading ? "Saving..." : "Submit Request"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}