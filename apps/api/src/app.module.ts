import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module.js';
import { JwtStrategy } from './common/strategies/jwt.strategy.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { UnitsModule } from './modules/units/units.module';
import { RentersModule } from './modules/renters/renters.module';
import { RentalAgreementsModule } from './modules/rental-agreements/rental-agreements.module';
import { RentInvoicesModule } from './modules/rent-invoices/rent-invoices.module';
import { MpesaModule } from './modules/mpesa/mpesa.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { ReportsModule } from './modules/reports/reports.module';
import { FilesModule } from './modules/files/files.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AdminModule } from './modules/admin/admin.module';
import { OwnerPortalModule } from './modules/owner-portal/owner-portal.module';
import { OwnersModule } from './modules/owners/owners.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module';

// Security
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),

    // Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // BullMQ / Redis Configuration 
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // Parse the single REDIS_URL provided by hosting platforms
        const redisUrl = configService.getOrThrow<string>('REDIS_URL');
        const url = new URL(redisUrl);

        return {
          connection: {
            host: url.hostname,
            port: parseInt(url.port, 10) || 6379,
            password: url.password || undefined,
            username: url.username || undefined,
            tls: redisUrl.startsWith('rediss://') ? {} : undefined,
          },
        };
      },
      inject: [ConfigService],
    }),

    PassportModule,

    // GAP 26 FIXED: Strict JWT Configuration
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: (config.get<string>('JWT_EXPIRES_IN') || '15m') as any },
      }),
    }),

    PrismaModule,

    // Feature Modules
    AuthModule,
    TenantsModule,
    UsersModule,
    PropertiesModule,
    UnitsModule,
    RentersModule,
    RentalAgreementsModule,
    RentInvoicesModule,
    MpesaModule,
    DashboardModule,
    MaintenanceModule,
    ReportsModule,
    FilesModule,
    JobsModule,
    AdminModule,
    OwnerPortalModule,
    OwnersModule,
    NotificationsModule,
  ],

  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
    AppService,
    JwtStrategy
  ],
})
export class AppModule { }