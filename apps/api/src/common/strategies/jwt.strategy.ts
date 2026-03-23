import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Define the expected shape of the JWT payload to eliminate 'any'
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    tenantId: string;
    iat?: number;
    exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'super-secret-development-key-change-in-production',
        });
    }

    // Use the JwtPayload interface to enforce strict typing
    async validate(payload: JwtPayload) {
        // This object is what gets attached to request.user
        // It MUST include the tenantId for the interceptor to work
        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            tenantId: payload.tenantId
        };
    }
}
