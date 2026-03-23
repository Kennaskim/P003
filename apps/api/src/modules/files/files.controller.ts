import { Controller, Get, Post, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesService } from './files.service.js';
import { RequestUploadUrlDto, ConfirmUploadDto } from './dto/file.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

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

    @ApiOperation({ summary: 'Upload a file directly via multipart form data' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                category: { type: 'string', enum: ['NATIONAL_ID', 'AGREEMENT', 'RECEIPT', 'OTHER'] },
            },
        },
    })
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Body('category') category?: string) {
        const data = await this.filesService.uploadFile(file, category);
        return { success: true, data, message: 'File uploaded successfully' };
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

    @ApiOperation({ summary: 'Soft-delete a document' })
    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.filesService.softDelete(id);
        return { success: true, message: 'Document deleted successfully' };
    }
}
