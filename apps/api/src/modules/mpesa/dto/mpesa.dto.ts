import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateStkPushDto {
    @ApiProperty({ example: 'uuid-of-invoice' })
    @IsUUID()
    @IsNotEmpty()
    rentInvoiceId: string;

    @ApiProperty({ example: '254700000000', description: 'Tenant Safaricom number (254...)' })
    @IsString()
    // Daraja expects the format to start directly with 254, no '+'
    @Matches(/^254[17]\d{8}$/, { message: 'Phone number must be in format 2547XXXXXXXX or 2541XXXXXXXX' })
    phone: string;

    @ApiProperty({ example: 15000, description: 'Amount in standard KES' })
    @IsInt()
    @Min(1) // Minimum 1 KES
    amount: number;
}

// Strictly typing the callback items to eliminate 'any'
export class MpesaCallbackItemDto {
    Name: string;
    Value?: string | number;
}

export class MpesaCallbackDto {
    @IsNotEmpty()
    Body: {
        stkCallback: {
            MerchantRequestID: string;
            CheckoutRequestID: string;
            ResultCode: number;
            ResultDesc: string;
            CallbackMetadata?: {
                Item: MpesaCallbackItemDto[];
            };
        };
    };
}
