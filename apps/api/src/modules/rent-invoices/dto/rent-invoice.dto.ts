import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateRentInvoiceDto {
    @ApiProperty({ example: 'uuid-of-agreement' })
    @IsUUID()
    @IsNotEmpty()
    rentalAgreementId: string;

    @ApiProperty({ example: 15000, description: 'Amount in KES (e.g., KES 15,000 = 15000)' })
    @IsInt()
    @Min(0)
    amount: number;

    @ApiProperty({ example: '2026-04-05T00:00:00.000Z' })
    @IsDateString()
    @IsNotEmpty()
    dueDate: string;
}

export class UpdateRentInvoiceDto extends PartialType(CreateRentInvoiceDto) {
    @ApiPropertyOptional({ example: true })
    @IsBoolean()
    @IsOptional()
    isPaid?: boolean;

    @ApiPropertyOptional({ example: 500, description: 'Late fee in KES' })
    @IsInt()
    @Min(0)
    @IsOptional()
    lateFeeApplied?: number;
}
