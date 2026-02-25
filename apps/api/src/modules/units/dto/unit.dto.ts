import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class CreateUnitDto {
    @IsUUID()
    @IsNotEmpty()
    propertyId: string;

    @IsString()
    @IsNotEmpty()
    name: string; // e.g., "Bedsitter 4"

    @IsInt()
    @Min(0)
    rentAmount: number; // Stored as integer KES
}

export class UpdateUnitDto extends CreateUnitDto { }