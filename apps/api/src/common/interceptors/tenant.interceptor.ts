import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantStorage } from '../storage/tenant.storage.js';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const tenantId = user?.tenantId;

        // Run the rest of the request lifecycle inside the AsyncLocalStorage context
        return tenantStorage.run({ tenantId }, () => {
            return next.handle();
        });
    }
}