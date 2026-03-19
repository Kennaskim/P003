import { Controller, Post, Body, Res, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import express from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto, LoginDto } from './dto/auth.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @ApiOperation({ summary: 'Register a new property management agency' })
    @ApiResponse({ status: 201, description: 'Tenant created successfully.' })
    @ApiResponse({ status: 400, description: 'Bad Request - Validation failed.' })
    // Enforce strict rate limit: 5 attempts per 60 seconds
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('register')
    async register(@Body() dto: RegisterDto, @Req() req: express.Request, @Res({ passthrough: true }) res: express.Response) {
        const ip = req.ip || req.socket.remoteAddress;
        const { accessToken, refreshToken, user } = await this.authService.register(dto, ip);

        this.setRefreshCookie(res, refreshToken);

        return {
            success: true,
            data: { accessToken, user },
            message: 'Registration successful',
        };
    }

    @ApiOperation({ summary: 'Log in to an existing tenant account' })
    @ApiResponse({ status: 200, description: 'Successfully logged in and JWT generated.' })
    @ApiResponse({ status: 401, description: 'Invalid credentials.' })
    // Enforce strict rate limit: 5 attempts per 60 seconds
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('login')
    async login(@Body() dto: LoginDto, @Req() req: express.Request, @Res({ passthrough: true }) res: express.Response) {
        const ip = req.ip || req.socket.remoteAddress;
        const { accessToken, refreshToken, user } = await this.authService.login(dto, ip);

        this.setRefreshCookie(res, refreshToken);

        return {
            success: true,
            data: { accessToken, user },
        };
    }

    @ApiOperation({ summary: 'Log out and clear refresh token cookie' })
    @ApiResponse({ status: 200, description: 'Logged out successfully.' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard) // Protect this route so we know who is logging out
    @Post('logout')
    async logout(@Req() req: any, @Res({ passthrough: true }) res: express.Response) {
        const ip = req.ip || req.socket.remoteAddress;

        // Extract user data from the JWT payload attached by the guard
        const userId = req.user?.sub || req.user?.id;
        const tenantId = req.user?.tenantId;

        // Log the logout event
        if (userId && tenantId) {
            await this.authService.logAuthEvent(tenantId, userId, 'LOGOUT', ip);
        }

        res.clearCookie('refresh_token');
        return { success: true, message: 'Logged out successfully' };
    }

    private setRefreshCookie(res: express.Response, token: string) {
        res.cookie('refresh_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }
}