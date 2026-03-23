import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    tenantId: string;
}

export const CurrentUser = createParamDecorator(
    (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
        const user = request.user;

        return data ? user?.[data] : user;
    },
);
