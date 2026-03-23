import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
    constructor(
        message: string,
        public readonly errorCode: string,
        status: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        // Format matches the Addendum requirements: { success, error, code }
        super({ success: false, error: message, code: errorCode }, status);
    }
}
