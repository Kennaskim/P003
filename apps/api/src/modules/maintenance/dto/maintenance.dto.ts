import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { MaintenanceStatus } from '../../../generated/prisma/client.js';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

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

    @ApiPropertyOptional({ example: 'John Doe' })
    @IsString()
    @IsOptional()
    assignedToName?: string;

    @ApiPropertyOptional({ example: 1000 })
    @Min(0)
    @IsOptional()
    cost?: number;
}

export class UpdateMaintenanceDto extends PartialType(CreateMaintenanceDto) {
    @ApiPropertyOptional({ enum: MaintenanceStatus, example: 'IN_PROGRESS' })
    @IsEnum(MaintenanceStatus)
    @IsOptional()
    status?: MaintenanceStatus;
}