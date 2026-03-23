import { IsDateString, IsInt, IsNotEmpty, IsUUID, Min, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateRentalAgreementDto {
    @ApiProperty({ example: 'uuid-of-unit', description: 'The vacant unit ID' })
    @IsUUID()
    @IsNotEmpty()
    unitId: string;

    @ApiProperty({ example: 'uuid-of-renter', description: 'The registered renter ID' })
    @IsUUID()
    @IsNotEmpty()
    renterId: string;

    @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @ApiProperty({ example: 15000, description: 'Locked-in monthly rent (KES)' })
    @IsInt()
    @Min(0)
    rentAmount: number; // Stored as integer KES

    @ApiProperty({ example: 15000, description: 'Security deposit (KES)' })
    @IsInt()
    @Min(0)
    deposit: number; // Stored as integer KES
}

export class UpdateRentalAgreementDto extends PartialType(CreateRentalAgreementDto) {
    @ApiProperty({ example: false, required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
