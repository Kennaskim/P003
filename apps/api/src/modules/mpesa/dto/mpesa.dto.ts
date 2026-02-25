import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';

export class InitiateStkPushDto {
    @IsUUID()
    @IsNotEmpty()
    rentInvoiceId: string;

    @IsString()
    @Matches(/^\+254[17]\d{8}$/, { message: 'Phone number must be in format +2547XXXXXXXX' })
    phone: string;

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