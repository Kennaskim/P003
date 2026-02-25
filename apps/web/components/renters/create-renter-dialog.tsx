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
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

const renterSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    phone: z.string().regex(/^\+254[17]\d{8}$/, "Must be in format +2547XXXXXXXX or +2541XXXXXXXX"),
    nationalId: z.string().regex(/^\d{7,9}$/, "National ID must be 7 to 9 digits"),
    emergencyContact: z.string()
        .regex(/^\+254[17]\d{8}$/, "Must be in format +254...")
        .optional()
        .or(z.literal("")),
});

interface CreateRenterDialogProps {
    onSuccess: () => void;
}

export function CreateRenterDialog({ onSuccess }: CreateRenterDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof renterSchema>>({
        resolver: zodResolver(renterSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            phone: "+254",
            nationalId: "",
            emergencyContact: ""
        },
    });

    async function onSubmit(values: z.infer<typeof renterSchema>) {
        setIsLoading(true);
        try {
            // Remove empty string if emergency contact was left blank
            const payload = {
                ...values,
                emergencyContact: values.emergencyContact === "" ? undefined : values.emergencyContact
            };

            const response = await api.post("/renters", payload);
            if (response.data.success) {
                toast.success("Renter added successfully!");
                form.reset();
                setOpen(false);
                onSuccess();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to add renter");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" /> Add Renter
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Register New Renter</DialogTitle>
                    <DialogDescription>
                        Add a tenant to your system. Their phone number will be used for M-Pesa billing.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name</FormLabel>
                                        <FormControl><Input placeholder="John" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name</FormLabel>
                                        <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number (M-Pesa)</FormLabel>
                                    <FormControl><Input placeholder="+254700000000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="nationalId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>National ID</FormLabel>
                                    <FormControl><Input placeholder="12345678" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="emergencyContact"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Emergency Contact (Optional)</FormLabel>
                                    <FormControl><Input placeholder="+2547..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save Renter"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}