import { Module } from '@nestjs/common';
import { InvestmentController } from './investment.controller';
import { InvestmentService } from './investment.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [InvestmentController],
  providers: [InvestmentService, PrismaService],
})
export class InvestmentModule {}
