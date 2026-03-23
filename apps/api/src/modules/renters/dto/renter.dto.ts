import { IsNotEmpty, IsOptional, IsString, Matches, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateRenterDto {
    @ApiProperty({ example: 'John' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ example: '0712345678', description: 'Kenyan phone number (e.g. 07..., +254...)' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^(?:254|\+254|0)?([17]\d{8})$/, { message: 'Phone number must be a valid Kenyan number' })
    phone: string;

    @ApiProperty({ example: '12345678', description: 'Kenyan National ID' })
    @IsString()
    @Length(7, 9, { message: 'National ID must be between 7 and 9 digits' })
    @Matches(/^\d+$/, { message: 'National ID must contain only numbers' })
    nationalId: string;

    @ApiPropertyOptional({ example: '0711111111' })
    @IsString()
    @IsOptional()
    @Matches(/^(?:254|\+254|0)?([17]\d{8})$/, { message: 'Emergency contact must be a valid Kenyan number' })
    emergencyContact?: string;
}

export class UpdateRenterDto extends PartialType(CreateRenterDto) { }
