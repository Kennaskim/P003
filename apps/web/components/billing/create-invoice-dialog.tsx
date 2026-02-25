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
import { Receipt } from "lucide-react";
import { toast } from "sonner";

const invoiceSchema = z.object({
    rentalAgreementId: z.string().uuid("Please select a rental agreement"),
    amount: z.number().int().min(1, "Amount must be greater than 0"),
    dueDate: z.string().min(1, "Due date is required"),
});

interface CreateInvoiceDialogProps {
    onSuccess: () => void;
}

export function CreateInvoiceDialog({ onSuccess }: CreateInvoiceDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [agreements, setAgreements] = useState<any[]>([]);

    type InvoiceFormValues = z.infer<typeof invoiceSchema>;
    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema) as any,
        defaultValues: {
            rentalAgreementId: "",
            amount: 0,
            dueDate: new Date().toISOString().split('T')[0]
        },
    });

    // Fetch active agreements when dialog opens
    useEffect(() => {
        if (open) {
            api.get("/rental-agreements").then((res) => {
                setAgreements(res.data.data);
            });
        }
    }, [open]);

    // Auto-fill amount based on the selected agreement's locked-in rent
    useEffect(() => {
        const selectedId = form.watch("rentalAgreementId");
        if (selectedId) {
            const agreement = agreements.find(a => a.id === selectedId);
            if (agreement) {
                form.setValue("amount", agreement.rentAmount);
            }
        }
    }, [form.watch("rentalAgreementId"), agreements, form]);

    async function onSubmit(values: z.infer<typeof invoiceSchema>) {
        setIsLoading(true);
        try {
            const payload = {
                ...values,
                dueDate: new Date(values.dueDate).toISOString(),
            };
            const response = await api.post("/rent-invoices", payload);
            if (response.data.success) {
                toast.success("Invoice generated successfully!");
                form.reset();
                setOpen(false);
                onSuccess();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to generate invoice");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Receipt className="mr-2 h-4 w-4" /> Generate Invoice
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Generate Rent Invoice</DialogTitle>
                    <DialogDescription>
                        Bill a tenant based on their active rental agreement.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="rentalAgreementId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tenant & Unit</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select tenant agreement" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {agreements.length === 0 ? (
                                                <SelectItem value="none" disabled>No active agreements</SelectItem>
                                            ) : (
                                                agreements.map((a) => (
                                                    <SelectItem key={a.id} value={a.id}>
                                                        {a.renter.firstName} ({a.unit.name})
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount (KES)</FormLabel>
                                        <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Due Date</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Generating..." : "Generate Invoice"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}