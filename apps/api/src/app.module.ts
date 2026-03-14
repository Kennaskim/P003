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

// Security
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

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
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),

    PassportModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'super-secret-development-key-change-in-production',
        signOptions: { expiresIn: (config.get('JWT_EXPIRES_IN') ?? '1d') as any },
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
  ],

  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    AppService,
    JwtStrategy
  ],
})
export class AppModule { }