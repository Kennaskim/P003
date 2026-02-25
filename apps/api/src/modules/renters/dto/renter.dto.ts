import { IsNotEmpty, IsOptional, IsString, Matches, Length } from 'class-validator';

export class CreateRenterDto {
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    // Enforce E.164 format for Kenya: +2547XXXXXXXX or +2541XXXXXXXX
    @IsString()
    @Matches(/^\+254[17]\d{8}$/, { message: 'Phone number must be in format +2547XXXXXXXX or +2541XXXXXXXX' })
    phone: string;

    // Kenyan National IDs are standard 8 digits (some older ones are 7, but 8 is standard for modern validations)
    @IsString()
    @Length(7, 9, { message: 'National ID must be between 7 and 9 digits' })
    @Matches(/^\d+$/, { message: 'National ID must contain only numbers' })
    nationalId: string;

    @IsString()
    @IsOptional()
    @Matches(/^\+254[17]\d{8}$/, { message: 'Emergency contact must be in format +254...' })
    emergencyContact?: string;
}

export class UpdateRenterDto extends CreateRenterDto { }