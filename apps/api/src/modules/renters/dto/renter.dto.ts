import { IsNotEmpty, IsOptional, IsString, Matches, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRenterDto {
    @ApiProperty({ example: 'John' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    // Enforce E.164 format for Kenya: +2547XXXXXXXX or +2541XXXXXXXX
    @ApiProperty({ example: '+254712345678', description: 'Must be E.164 format' })
    @IsString()
    @Matches(/^\+254[17]\d{8}$/, { message: 'Phone number must be in format +2547XXXXXXXX or +2541XXXXXXXX' })
    phone: string;

    // Kenyan National IDs are standard 8 digits (some older ones are 7, but 8 is standard for modern validations)
    @ApiProperty({ example: '12345678', description: 'Kenyan National ID' })
    @IsString()
    @Length(7, 9, { message: 'National ID must be between 7 and 9 digits' })
    @Matches(/^\d+$/, { message: 'National ID must contain only numbers' })
    nationalId: string;

    @ApiPropertyOptional({ example: '+254711111111' })
    @IsString()
    @IsOptional()
    @Matches(/^\+254[17]\d{8}$/, { message: 'Emergency contact must be in format +254...' })
    emergencyContact?: string;
}

export class UpdateRenterDto extends CreateRenterDto { }