import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
export class CreateUnitDto {
    @ApiProperty({ example: 'uuid-of-property', description: 'ID of the parent property' })
    @IsUUID()
    @IsNotEmpty()
    propertyId: string;

    @ApiProperty({ example: 'A1', description: 'Door number or name' })
    @IsString()
    @IsNotEmpty()
    name: string; // e.g., "Bedsitter 4"

    @ApiProperty({ example: 15000, description: 'Monthly rent strictly in integer KES' })
    @IsInt()
    @Min(0)
    rentAmount: number; // Stored as integer KES
}

export class UpdateUnitDto extends PartialType(CreateUnitDto) { }