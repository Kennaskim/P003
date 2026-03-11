import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateRentInvoiceDto {
    @ApiProperty({ example: 'uuid-of-agreement' })
    @IsUUID()
    @IsNotEmpty()
    rentalAgreementId: string;

    @ApiProperty({ example: 15000, description: 'Amount strictly in integer KES' })
    @IsInt()
    @Min(0)
    amount: number; // Stored as integer KES (e.g., 15000 for KES 15,000)

    @ApiProperty({ example: '2026-04-05T00:00:00.000Z' })
    @IsDateString()
    @IsNotEmpty()
    dueDate: string;
}

export class UpdateRentInvoiceDto {
    @ApiPropertyOptional({ example: true })
    @IsBoolean()
    @IsOptional()
    isPaid?: boolean;

    @ApiPropertyOptional({ example: 500, description: 'Late fee in integer KES' })
    @IsInt()
    @Min(0)
    @IsOptional()
    lateFeeApplied?: number; // Integer KES
}