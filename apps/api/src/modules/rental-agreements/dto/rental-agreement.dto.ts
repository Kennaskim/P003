import { IsDateString, IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateRentalAgreementDto {
    @IsUUID()
    @IsNotEmpty()
    unitId: string;

    @IsUUID()
    @IsNotEmpty()
    renterId: string;

    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @IsInt()
    @Min(0)
    rentAmount: number; // Stored as integer KES

    @IsInt()
    @Min(0)
    deposit: number; // Stored as integer KES
}