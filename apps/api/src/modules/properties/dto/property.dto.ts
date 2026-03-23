import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
export class CreatePropertyDto {
    @ApiProperty({ example: 'Sunset Apartments', description: 'Name of the property' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string; // e.g., "Sunset Apartments"

    @ApiProperty({ example: 'Westlands, Nairobi', description: 'Address of the property' })
    @IsString()
    @IsNotEmpty()
    address: string; // Rule: Estate/area + town structure (e.g., "Westlands, Nairobi")

    @ApiProperty({ example: 'Commercial', description: 'Type of the property' })
    @IsString()
    @IsNotEmpty()
    type: string; // e.g., "Commercial", "Residential", "Mixed"
}

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) { }
