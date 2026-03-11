import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { MaintenanceStatus } from '../../../generated/prisma/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaintenanceDto {
    @ApiProperty({ example: 'uuid-of-unit' })
    @IsUUID()
    @IsNotEmpty()
    unitId: string;

    @ApiProperty({ example: 'Plumbing' })
    @IsString()
    @IsNotEmpty()
    category: string; // e.g., Plumbing, Electrical, Carpentry

    @ApiProperty({ example: 'Leaking tap in the kitchen' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ example: 'Critical' })
    @IsString()
    @IsNotEmpty()
    urgency: string; // Critical, High, Medium, Low
}

export class UpdateMaintenanceDto {
    @ApiPropertyOptional({ enum: MaintenanceStatus, example: 'IN_PROGRESS' })
    @IsEnum(MaintenanceStatus)
    @IsOptional()
    status?: MaintenanceStatus;
}