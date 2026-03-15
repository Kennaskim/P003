import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FilesService } from './files.service.js';
import { RequestUploadUrlDto, ConfirmUploadDto } from './dto/file.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../generated/prisma/client.js';

@ApiTags('Files Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantInterceptor)
@Roles(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER, UserRole.LANDLORD)
@Controller('files')
export class FilesController {
    constructor(private readonly filesService: FilesService) { }

    @ApiOperation({ summary: 'Request a pre-signed URL for direct Cloudflare R2 upload' })
    @Post('request-upload')
    async requestUploadUrl(@Body() dto: RequestUploadUrlDto) {
        const data = await this.filesService.generateUploadUrl(dto);
        return { success: true, data };
    }

    @ApiOperation({ summary: 'Confirm file upload and save record to the database' })
    @Post('confirm')
    async confirmUpload(@Body() dto: ConfirmUploadDto) {
        const data = await this.filesService.confirmUpload(dto);
        return { success: true, data, message: 'File saved successfully' };
    }

    @ApiOperation({ summary: 'Get all uploaded documents for the current tenant' })
    @Get()
    async findAll() {
        const data = await this.filesService.findAll();
        return { success: true, data };
    }

    @ApiOperation({ summary: 'Get a secure, temporary download URL for a specific document' })
    @Get(':id/download')
    async getDownloadUrl(@Param('id') id: string) {
        const data = await this.filesService.getDownloadUrl(id);
        return { success: true, data };
    }
}