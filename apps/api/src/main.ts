import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { AppModule } from './app.module';
import { SentryFilter } from './common/filters/sentry.filter';

async function bootstrap() {
  // 1. Initialize Sentry before the app starts
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
    profilesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
  });

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 2. Global Middleware
  app.use(helmet());
  app.use(cookieParser());

  const frontendUrl = configService.getOrThrow<string>('FRONTEND_URL');
  const isDev = configService.get<string>('NODE_ENV') !== 'production';

  const allowedOrigins = isDev
    ? [frontendUrl, 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']
    : [frontendUrl];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Required for cookies
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 6. Bind the Sentry Exception Filter Globally to catch 500 errors
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryFilter(httpAdapter));

  // 7. Configure Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Rental Management System API')
    .setDescription('The core API for the Kenya RMS Multi-Tenant SaaS platform')
    .setVersion('1.0')
    .addBearerAuth() // Adds the "Authorize" button for JWTs
    .addTag('Auth')
    .addTag('Properties')
    .addTag('Units')
    .addTag('Renters')
    .addTag('Rental Agreements')
    .addTag('Billing & Invoices')
    .addTag('M-Pesa Payments')
    .addTag('Maintenance')
    .addTag('Files Management')
    .addTag('Reports')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  // 8. Start the Server
  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);

  Logger.log(`API running securely on port ${port}`, 'Bootstrap');
  Logger.log(`Strict CORS allowed origins: ${allowedOrigins.join(', ')}`, 'Bootstrap');
  Logger.log(`Swagger running on http://localhost:${port}/api/v1/docs`, 'Bootstrap');
}
bootstrap();