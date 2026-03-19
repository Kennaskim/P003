import { Module } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { PrismaModule } from '../../../prisma/prisma.module.js'; // <-- Add this

@Module({
  imports: [PrismaModule], // <-- Add this
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule { }