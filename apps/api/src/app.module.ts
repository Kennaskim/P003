import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../prisma/prisma.module.js';
import { JwtStrategy } from './common/strategies/jwt.strategy.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { UnitsModule } from './modules/units/units.module';
import { RentersModule } from './modules/renters/renters.module';
import { RentalAgreementsModule } from './modules/rental-agreements/rental-agreements.module';
import { RentInvoicesModule } from './modules/rent-invoices/rent-invoices.module';
import { MpesaModule } from './modules/mpesa/mpesa.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
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
    AuthModule,
    PropertiesModule,
    UnitsModule,
    RentersModule,
    RentalAgreementsModule,
    RentInvoicesModule,
    MpesaModule,
  ],

  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule { }
