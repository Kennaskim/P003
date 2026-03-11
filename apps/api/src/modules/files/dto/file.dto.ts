import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestUploadUrlDto {
    @ApiProperty({ example: 'document.pdf' })
    @IsString()
    @IsNotEmpty()
    fileName: string;

    @ApiProperty({ example: 'application/pdf' })
    @IsString()
    @IsNotEmpty()
    fileType: string; // e.g., 'application/pdf', 'image/jpeg'

    @ApiProperty({ example: 2048000, description: 'File size in bytes' })
    @IsNumber()
    @IsNotEmpty()
    fileSize: number;
}

export class ConfirmUploadDto {
    @ApiProperty({ example: 'document.pdf' })
    @IsString()
    @IsNotEmpty()
    fileName: string;

    @ApiProperty({ example: 'tenantId/uuid-document.pdf' })
    @IsString()
    @IsNotEmpty()
    fileKey: string;

    @ApiProperty({ example: 'application/pdf' })
    @IsString()
    @IsNotEmpty()
    fileType: string;

    @ApiProperty({ example: 2048000 })
    @IsNumber()
    @IsNotEmpty()
    fileSize: number;

    @ApiPropertyOptional({ example: 'GENERAL' })
    @IsString()
    @IsOptional()
    entityType?: string;

    @ApiPropertyOptional({ example: 'GENERAL' })
    @IsString()
    @IsOptional()
    entityId?: string;
}