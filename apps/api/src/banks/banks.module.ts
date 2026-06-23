import { Module } from '@nestjs/common';
import { BanksController } from './banks.controller';
import { BanksService } from './banks.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [BanksController],
  providers: [BanksService, PrismaService],
})
export class BanksModule {}
