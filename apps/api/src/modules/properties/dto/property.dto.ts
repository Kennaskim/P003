import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePropertyDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string; // e.g., "Sunset Apartments"

    @IsString()
    @IsNotEmpty()
    address: string; // Rule: Estate/area + town structure (e.g., "Westlands, Nairobi")

    @IsString()
    @IsNotEmpty()
    type: string; // e.g., "Commercial", "Residential", "Mixed"
}

export class UpdatePropertyDto extends CreatePropertyDto { }