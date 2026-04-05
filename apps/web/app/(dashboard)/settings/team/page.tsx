"use client"

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Shield, Mail } from 'lucide-react';
import { getTeamMembers } from '@/lib/api/team';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InviteUserDialog } from '@/components/settings/invite-user-dialog';

export default function TeamSettingsPage() {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const { data: teamMembers, isLoading } = useQuery({
        queryKey: ['team-members'],
        queryFn: getTeamMembers,
    });

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
                    <p className="text-muted-foreground">Manage who has access to your property data.</p>
                </div>
                <Button onClick={() => setIsInviteModalOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8 text-muted-foreground">Loading team data...</div>
            ) : (
                <div className="border rounded-lg bg-card">
                    <div className="divide-y">
                        {teamMembers?.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                        {member.firstName[0]}{member.lastName[0]}
                                    </div>
                                    <div>
                                        <p className="font-medium">{member.firstName} {member.lastName}</p>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Mail className="h-3 w-3 mr-1" />
                                            {member.email}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Badge variant={member.isActive ? "default" : "secondary"}>
                                        {member.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <div className="flex items-center text-sm text-muted-foreground w-32">
                                        <Shield className="h-3 w-3 mr-1" />
                                        {member.role.replace('_', ' ')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <InviteUserDialog
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
            />
        </div>
    );
}