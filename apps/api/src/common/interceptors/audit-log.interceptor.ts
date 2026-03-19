import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../../prisma/prisma.service';
import { AUDIT_META_KEY, AuditMetadata } from '../decorators/audit.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
    private readonly logger = new Logger(AuditLogInterceptor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly reflector: Reflector,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest();
        const { method, originalUrl, ip, user, body, params } = request;

        // 1. Skip GET requests (we generally only audit mutations)
        if (['GET', 'OPTIONS', 'HEAD'].includes(method)) {
            return next.handle();
        }

        return next.handle().pipe(
            tap(() => {
                // 2. We run the logging asynchronously after the request succeeds
                this.logActionAsync(context, method, originalUrl, ip, user, body, params);
            }),
        );
    }

    private async logActionAsync(
        context: ExecutionContext,
        method: string,
        originalUrl: string,
        ip: string,
        user: any,
        body: any,
        params: any,
    ) {
        // 3. Ensure we have an authenticated user with a tenantId
        if (!user || !user.id || !user.tenantId) {
            return;
        }

        // 4. Retrieve custom metadata from our @Audit() decorator (if it exists)
        const auditMeta = this.reflector.get<AuditMetadata>(
            AUDIT_META_KEY,
            context.getHandler(),
        );

        const action = auditMeta?.action || `${method} ${originalUrl.split('?')[0]}`;
        const entityType = auditMeta?.entityType || null;
        const entityId = params.id || null;

        // 5. Sanitize the payload (NEVER log passwords or large base64 strings)
        const sanitizedDetails = this.sanitizePayload(body);

        try {
            await this.prisma.client.auditLog.create({
                data: {
                    tenantId: user.tenantId,
                    userId: user.id,
                    action,
                    entityType,
                    entityId,
                    details: sanitizedDetails,
                    ipAddress: ip,
                },
            });
        } catch (error) {
            // We log the error but don't throw it, so we don't crash the user's response
            this.logger.error(`Failed to save audit log for user ${user.id}`, error);
        }
    }

    private sanitizePayload(body: any): any {
        if (!body) return null;

        // Create a shallow copy to avoid mutating the actual request body
        const sanitized = { ...body };

        // Remove sensitive or overly large fields
        const fieldsToRemove = ['password', 'confirmPassword', 'token', 'refreshToken'];
        fieldsToRemove.forEach((field) => {
            if (field in sanitized) {
                sanitized[field] = '[REDACTED]';
            }
        });

        return sanitized;
    }
}