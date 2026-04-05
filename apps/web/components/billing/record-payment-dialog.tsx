'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recordManualPayment, RecordPaymentPayload } from '@/lib/api/billing';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface RecordPaymentDialogProps {
    invoiceId: string;
    defaultAmount: number;
    isOpen: boolean;
    onClose: () => void;
}

export function RecordPaymentDialog({ invoiceId, defaultAmount, isOpen, onClose }: RecordPaymentDialogProps) {
    const queryClient = useQueryClient();
    const [method, setMethod] = useState<'MPESA' | 'CASH' | 'BANK'>('MPESA');

    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<RecordPaymentPayload>({
        defaultValues: {
            amount: defaultAmount,
            method: 'MPESA',
            reference: '',
        }
    });

    const mutation = useMutation({
        mutationFn: (data: RecordPaymentPayload) => recordManualPayment(invoiceId, data),
        onSuccess: () => {
            toast.success('Payment recorded successfully');
            queryClient.invalidateQueries({ queryKey: ['rent-invoices'] }); // Refresh the table
            reset();
            onClose();
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to record payment');
        }
    });

    const onSubmit = (data: RecordPaymentPayload) => {
        mutation.mutate({ ...data, amount: Number(data.amount), method });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Record Manual Payment</DialogTitle>
                    <DialogDescription>
                        Record a cash, bank transfer, or manual M-Pesa payment for this invoice.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount Paid (KES)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            {...register('amount', { required: true, min: 1 })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select value={method} onValueChange={(val: any) => setMethod(val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MPESA">M-Pesa</SelectItem>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="BANK">Bank Transfer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reference">Reference / Receipt Number (Optional)</Label>
                        <Input
                            id="reference"
                            placeholder="e.g. QWE123RTY4"
                            {...register('reference')}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Record Payment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}