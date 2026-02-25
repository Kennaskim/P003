import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import express from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto, LoginDto } from './dto/auth.dto.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

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

    @Post('login')
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: express.Response) {
        const { accessToken, refreshToken, user } = await this.authService.login(dto);

        this.setRefreshCookie(res, refreshToken);

        return {
            success: true,
            data: { accessToken, user },
        };
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) res: express.Response) {
        res.clearCookie('refresh_token'); // Clear httpOnly cookie [cite: 186]
        return { success: true, message: 'Logged out successfully' };
    }

    private setRefreshCookie(res: express.Response, token: string) {
        res.cookie('refresh_token', token, {
            httpOnly: true, // Never in localStorage 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }
}