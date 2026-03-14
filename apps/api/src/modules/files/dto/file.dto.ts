import { IsNotEmpty, IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestUploadUrlDto {
    @ApiProperty({ example: 'passport.pdf' })
    @IsString()
    @IsNotEmpty()
    fileName: string;

    @ApiProperty({ example: 'application/pdf' })
    @IsString()
    @IsNotEmpty()
    fileType: string;
}

export class ConfirmUploadDto {
    @ApiProperty({ example: 'folder/uuid-file.pdf' })
    @IsString()
    @IsNotEmpty()
    fileKey: string;

    @ApiProperty({ example: 'passport.pdf' })
    @IsString()
    @IsNotEmpty()
    fileName: string;

    @ApiProperty({ example: 'application/pdf' })
    @IsString()
    @IsNotEmpty()
    fileType: string;

    @ApiProperty({ example: 102400, description: 'File size in bytes' })
    @IsInt()
    @Min(1)
    fileSize: number;

    @ApiPropertyOptional({ example: 'PROPERTY' })
    @IsString()
    @IsOptional()
    entityType?: string;

    @ApiPropertyOptional({ example: 'uuid-of-entity' })
    @IsString()
    @IsOptional()
    entityId?: string;
}