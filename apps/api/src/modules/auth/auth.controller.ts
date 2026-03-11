import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import express from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto, LoginDto } from './dto/auth.dto.js';

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
    async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: express.Response) {
        const { accessToken, refreshToken, user } = await this.authService.register(dto);

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
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: express.Response) {
        const { accessToken, refreshToken, user } = await this.authService.login(dto);

        this.setRefreshCookie(res, refreshToken);

        return {
            success: true,
            data: { accessToken, user },
        };
    }

    @ApiOperation({ summary: 'Log out and clear refresh token cookie' })
    @ApiResponse({ status: 200, description: 'Logged out successfully.' })
    @Post('logout')
    async logout(@Res({ passthrough: true }) res: express.Response) {
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