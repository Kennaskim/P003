import { Controller, Post, Body, UseGuards, UseInterceptors, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MpesaService } from './mpesa.service.js';
import { InitiateStkPushDto, MpesaCallbackDto } from './dto/mpesa.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { SafaricomIpGuard } from '../../common/guards/safaricom-ip.guard.js'; // <-- Import new guard
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../generated/prisma/client.js';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('M-Pesa Payments')
@Controller('mpesa')
export class MpesaController {
    constructor(
        private readonly mpesaService: MpesaService,
        @InjectQueue('mpesa-callbacks') private readonly mpesaQueue: Queue,
    ) { }

    @ApiOperation({ summary: 'Initiate a Daraja STK Push to a tenant phone' })
    @ApiBearerAuth()
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(TenantInterceptor)
    @Roles(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER, UserRole.LANDLORD, UserRole.TENANT)
    @Post('stk-push')
    async initiateStkPush(@Body() dto: InitiateStkPushDto) {
        const data = await this.mpesaService.initiateStkPush(dto);
        return { success: true, data, message: 'STK Push sent to user phone' };
    }

    @ApiOperation({ summary: 'Safaricom Webhook Callback (Public but IP Restricted)' })
    @SkipThrottle()
    @UseGuards(SafaricomIpGuard) // <-- Apply Security Guard
    @Post('callback')
    @HttpCode(HttpStatus.OK)
    async handleCallback(@Body() dto: any) {
        // Drop the payload into Redis and return 200 OK instantly
        await this.mpesaQueue.add('process-stk-result', dto, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
        });

        // Safaricom requires this exact response format
        return { ResultCode: 0, ResultDesc: 'Accepted' };
    }
}