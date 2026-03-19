import { SetMetadata } from '@nestjs/common';

export const AUDIT_META_KEY = 'audit_metadata';

export interface AuditMetadata {
    action: string;
    entityType?: string;
}

export const Audit = (action: string, entityType?: string) =>
    SetMetadata(AUDIT_META_KEY, { action, entityType });