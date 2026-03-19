import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReportsService } from './reports.service.js';
import { ReportsController } from './reports.controller.js';
import { ReportsProcessor } from './reports.processor.js';
import { PrismaModule } from '../../../prisma/prisma.module.js';

@Module({
    imports: [
        PrismaModule,
        BullModule.registerQueue({
            name: 'reports-queue',
        }),
    ],
    controllers: [ReportsController],
    providers: [ReportsService, ReportsProcessor],
    exports: [ReportsService],
})
export class ReportsModule { }