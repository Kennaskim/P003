import { Controller, Post, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MpesaService } from './mpesa.service';
import { InitiateStkPushDto, MpesaCallbackDto } from './dto/mpesa.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client.js';

@Controller('mpesa')
export class MpesaController {
    constructor(
        private readonly mpesaService: MpesaService,
        private eventEmitter: EventEmitter2,
    ) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(TenantInterceptor)
    @Roles(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER, UserRole.LANDLORD, UserRole.TENANT)
    @Post('stk-push')
    async initiateStkPush(@Body() dto: InitiateStkPushDto) {
        const data = await this.mpesaService.initiateStkPush(dto);
        return { success: true, data, message: 'STK Push sent to user phone' };
    }

    // Public webhook endpoint for Safaricom. No JWT Guards here!
    @Post('callback')
    async handleCallback(@Body() dto: MpesaCallbackDto) {
        // Fire the event and return 200 OK immediately to prevent Safaricom timeouts
        this.eventEmitter.emit('mpesa.callback', dto);
        return { ResultCode: 0, ResultDesc: 'Accepted' };
    }
}