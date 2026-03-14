import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetReportsQueryDto {
    @ApiPropertyOptional({ example: '2026-01-01', description: 'Start date for financial filtering' })
    @IsDateString()
    @IsOptional()
    startDate?: string;

    @ApiPropertyOptional({ example: '2026-12-31', description: 'End date for financial filtering' })
    @IsDateString()
    @IsOptional()
    endDate?: string;
}