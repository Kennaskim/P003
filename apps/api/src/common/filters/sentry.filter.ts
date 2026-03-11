import { Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(SentryFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    
    // Determine the HTTP status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Only send critical 500+ server errors to Sentry (ignore 400s, 401s, 404s, etc.)
    if (status >= 500) {
      this.logger.error(`[${request.method}] ${request.url} - Error captured by Sentry`);
      
      Sentry.captureException(exception, {
        extra: {
          path: request.url,
          method: request.method,
          body: request.body, // Captures what the user was trying to send when it crashed
          tenantId: request.user?.tenantId || 'Unknown', // Identifies which agency experienced the crash
        },
      });
    }

    // Continue with the default NestJS error response to the client
    super.catch(exception, host);
  }
}