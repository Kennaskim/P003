import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class InitiateStkPushDto {
    @ApiProperty({ example: 'uuid-of-invoice' })
    @IsUUID()
    @IsNotEmpty()
    rentInvoiceId: string;

    @ApiProperty({ example: '+254700000000', description: 'Tenant Safaricom number' })
    @IsString()
    @Matches(/^\+254[17]\d{8}$/, { message: 'Phone number must be in format +2547XXXXXXXX' })
    phone: string;

    @ApiProperty({ example: 15000, description: 'Amount to charge via M-Pesa (KES)' })
    @IsInt()
    @Min(1)
    amount: number; // Integer KES
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
                Item: { Name: string; Value: any }[];
            };
        };
    };
}