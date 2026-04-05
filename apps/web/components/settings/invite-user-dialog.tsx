"use client"

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteUser, InviteUserPayload } from '@/lib/api/team';
import { toast } from 'sonner';
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

interface InviteUserDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InviteUserDialog({ isOpen, onClose }: InviteUserDialogProps) {
    const queryClient = useQueryClient();
    const [role, setRole] = useState<string>('PROPERTY_MANAGER');

    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<InviteUserPayload>({
        defaultValues: { firstName: '', lastName: '', email: '' }
    });

    const mutation = useMutation({
        mutationFn: (data: InviteUserPayload) => inviteUser(data),
        onSuccess: () => {
            toast.success('Invitation sent successfully!');
            queryClient.invalidateQueries({ queryKey: ['team-members'] });
            reset();
            onClose();
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to invite user');
        }
    });

    const onSubmit = (data: InviteUserPayload) => {
        mutation.mutate({ ...data, role });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                        Send an email invitation to add a new manager, accountant, or staff member to your workspace.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" {...register('firstName', { required: true })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" {...register('lastName', { required: true })} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" {...register('email', { required: true })} />
                    </div>

                    <div className="space-y-2">
                        <Label>Assign Role</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PROPERTY_MANAGER">Property Manager</SelectItem>
                                <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                                <SelectItem value="MAINTENANCE">Maintenance Staff</SelectItem>
                                <SelectItem value="LANDLORD">Landlord / Owner</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Sending...' : 'Send Invite'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}