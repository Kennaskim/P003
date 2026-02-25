import { CallHandler, ExecutionContext, Injectable, NestInterceptor, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantStorage } from '../storage/tenant.storage';
import { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest();
        const user = request.user as JwtPayload | undefined;

        if (!user || !user.tenantId) {
            // If a route is protected, the JWT Guard should have caught this. 
            // If it slips through, we block it here to prevent cross-tenant data leaks.
            throw new UnauthorizedException('MISSING_TENANT_CONTEXT');
        }

        // Wrap the rest of the request lifecycle in the async local storage context
        return tenantStorage.run({ tenantId: user.tenantId }, () => {
            return next.handle();
        });
    }
}