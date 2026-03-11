import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { AppModule } from './app.module';
import { SentryFilter } from './common/filters/sentry.filter';

async function bootstrap() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
    profilesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
  });

  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      process.env.FRONTEND_URL || '',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Required for cookies
  });

  // 4. Set your global API prefix
  app.setGlobalPrefix('api/v1');

  // 5. Global Validation (Strips out malicious extra fields not defined in your DTOs)
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

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API running securely on port ${port}`);
  console.log(`Swagger running on http://localhost:${port}/api/v1/docs`);
}
bootstrap();