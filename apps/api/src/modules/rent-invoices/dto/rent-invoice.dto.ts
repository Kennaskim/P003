import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateRentInvoiceDto {
    @IsUUID()
    @IsNotEmpty()
    rentalAgreementId: string;

    @IsInt()
    @Min(0)
    amount: number; // Stored as integer KES (e.g., 15000 for KES 15,000)

    @IsDateString()
    @IsNotEmpty()
    dueDate: string;
}

export class UpdateRentInvoiceDto {
    @IsBoolean()
    @IsOptional()
    isPaid?: boolean;

    @IsInt()
    @Min(0)
    @IsOptional()
    lateFeeApplied?: number; // Integer KES
}