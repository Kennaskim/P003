import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client.js';

export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    tenantId: string;
}

export const CurrentUser = createParamDecorator(
    (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | JwtPayload[keyof JwtPayload] => {
        const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
        return data ? request.user[data] : request.user;
    },
);